import { and, eq, sql } from "drizzle-orm";
import { db, schema } from "./_lib/db";
import { ApiError, num, oneOf, requirePlayer, route, str } from "./_lib/http";
import { round2, round6, toNum, usd } from "./_lib/money";
import { getQuotes } from "./_lib/prices";

const MIN_ORDER = 1;

/**
 * Buy or sell.
 *
 * The client sends a symbol, a side and a dollar amount — never a price and
 * never a share count. The server prices the fill from its own quote cache, so
 * a tampered request can't mint shares. Cash, holdings and the order record
 * move together in one transaction, so a failure can't leave a player paid but
 * unfilled.
 */
export default route("POST", async (req) => {
  const playerId = requirePlayer(req);
  const symbol = str(req.body?.symbol, "symbol").toUpperCase();
  const side = oneOf(req.body?.side, ["buy", "sell"] as const, "buy");
  const sellAll = req.body?.all === true;
  const amount = sellAll ? 0 : round2(num(req.body?.amount, "amount"));

  if (!sellAll && amount < MIN_ORDER) {
    throw new ApiError(400, `Orders start at ${usd(MIN_ORDER)}.`);
  }

  const d = db();

  const [instrument] = await d
    .select()
    .from(schema.instruments)
    .where(eq(schema.instruments.symbol, symbol));
  if (!instrument) throw new ApiError(404, `We don't carry ${symbol} yet.`);

  const quote = (await getQuotes([symbol])).get(symbol);
  if (!quote || quote.price <= 0) {
    throw new ApiError(503, "No price available right now — your order wasn't placed.");
  }
  const price = quote.price;

  return d.transaction(async (tx) => {
    // Lock the player row so two taps can't spend the same cash twice.
    const [player] = await tx
      .select()
      .from(schema.players)
      .where(eq(schema.players.id, playerId))
      .for("update");
    if (!player) throw new ApiError(401, "Sign in to continue.");

    const cash = toNum(player.cash);
    const [held] = await tx
      .select()
      .from(schema.holdings)
      .where(and(eq(schema.holdings.playerId, playerId), eq(schema.holdings.symbol, symbol)))
      .for("update");

    let filledAmount: number;
    let filledShares: number;

    if (side === "buy") {
      filledAmount = amount;
      if (filledAmount > cash) {
        throw new ApiError(400, `Not enough coins. You have ${usd(cash)}.`);
      }
      filledShares = round6(filledAmount / price);

      const newShares = round6(toNum(held?.shares) + filledShares);
      const newCost = round2(toNum(held?.costBasis) + filledAmount);

      await tx
        .insert(schema.holdings)
        .values({
          playerId,
          symbol,
          shares: String(newShares),
          costBasis: String(newCost),
        })
        .onConflictDoUpdate({
          target: [schema.holdings.playerId, schema.holdings.symbol],
          set: { shares: sql`excluded.shares`, costBasis: sql`excluded.cost_basis` },
        });

      await tx
        .update(schema.players)
        .set({ cash: String(round2(cash - filledAmount)) })
        .where(eq(schema.players.id, playerId));
    } else {
      const heldShares = toNum(held?.shares);
      if (!held || heldShares <= 0) throw new ApiError(400, `You don't own any ${instrument.name}.`);

      const heldValue = round2(heldShares * price);
      filledAmount = sellAll ? heldValue : amount;

      if (filledAmount > heldValue + 0.01) {
        throw new ApiError(400, `You only hold ${usd(heldValue)} of ${instrument.name}.`);
      }

      // Clear the position outright when the remainder would be dust, so a
      // "sell all" never strands a fraction of a cent on the books.
      const proportion = Math.min(1, filledAmount / heldValue);
      filledShares = round6(heldShares * proportion);
      const remainingShares = round6(heldShares - filledShares);
      const cost = toNum(held.costBasis);

      if (remainingShares <= 0.000001) {
        await tx
          .delete(schema.holdings)
          .where(and(eq(schema.holdings.playerId, playerId), eq(schema.holdings.symbol, symbol)));
      } else {
        await tx
          .update(schema.holdings)
          .set({
            shares: String(remainingShares),
            costBasis: String(round2(cost * (1 - proportion))),
          })
          .where(and(eq(schema.holdings.playerId, playerId), eq(schema.holdings.symbol, symbol)));
      }

      await tx
        .update(schema.players)
        .set({ cash: String(round2(cash + filledAmount)) })
        .where(eq(schema.players.id, playerId));
    }

    await tx.insert(schema.orders).values({
      playerId,
      symbol,
      side,
      amount: String(round2(filledAmount)),
      shares: String(filledShares),
      price: String(price),
    });

    return {
      ok: true,
      side,
      symbol,
      name: instrument.name,
      amount: round2(filledAmount),
      amountLabel: usd(filledAmount),
      shares: filledShares,
      sharesLabel: `${filledShares.toLocaleString("en-US", { maximumFractionDigits: 2 })} shares`,
      price,
      cashAfter: round2(side === "buy" ? cash - filledAmount : cash + filledAmount),
    };
  });
});

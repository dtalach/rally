import { and, eq, sql } from "drizzle-orm";
import { db, schema } from "./_lib/db.js";
import { ApiError, num, oneOf, requirePlayer, route, str } from "./_lib/http.js";
import { round2, round6, toNum, usd } from "./_lib/money.js";
import { getQuotes } from "./_lib/prices.js";

const MIN_ORDER = 1;

/**
 * Buy or sell.
 *
 * The client sends a symbol, a side and a size — whole shares, or "all" —
 * but never a price. The server prices the fill from its own quote cache, so a
 * tampered request can't mint shares. Cash, holdings and the order record move
 * together in one transaction, so a failure can't leave a player paid but
 * unfilled.
 */
export default route("POST", async (req) => {
  const playerId = requirePlayer(req);
  const symbol = str(req.body?.symbol, "symbol").toUpperCase();
  const side = oneOf(req.body?.side, ["buy", "sell"] as const, "buy");
  const sellAll = req.body?.all === true;

  // An order is expressed one of three ways: every share you hold, a dollar
  // amount, or a share count. Shares are filled as shares — converting them to
  // dollars client-side would leave you with *about* the number you asked for.
  const bySharesRaw = req.body?.shares;
  const byShares = !sellAll && bySharesRaw !== undefined && bySharesRaw !== null;
  const wantShares = byShares ? round6(num(bySharesRaw, "shares")) : 0;
  const amount = sellAll || byShares ? 0 : round2(num(req.body?.amount, "amount"));

  if (byShares && wantShares <= 0) {
    throw new ApiError(400, "Enter how many shares you want.");
  }
  // Whole shares only. A fractional position can still be closed — that's what
  // `all` is for — but nothing new creates one.
  if (byShares && !Number.isInteger(wantShares)) {
    throw new ApiError(400, "Orders are in whole shares.");
  }
  if (!sellAll && !byShares && amount < MIN_ORDER) {
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
      if (byShares) {
        filledShares = wantShares;
        filledAmount = round2(wantShares * price);
      } else {
        filledAmount = amount;
        filledShares = round6(filledAmount / price);
      }
      if (filledAmount > cash) {
        throw new ApiError(
          400,
          byShares
            ? `${wantShares} shares costs ${usd(filledAmount)} — you have ${usd(cash)}.`
            : `Not enough coins. You have ${usd(cash)}.`
        );
      }
      if (filledAmount < MIN_ORDER) {
        throw new ApiError(400, `Orders start at ${usd(MIN_ORDER)}.`);
      }

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

      if (byShares && wantShares > heldShares + 0.000001) {
        throw new ApiError(
          400,
          `You only hold ${heldShares.toLocaleString("en-US", { maximumFractionDigits: 2 })} shares of ${instrument.name}.`
        );
      }
      filledAmount = sellAll ? heldValue : byShares ? round2(wantShares * price) : amount;

      if (filledAmount > heldValue + 0.01) {
        throw new ApiError(400, `You only hold ${usd(heldValue)} of ${instrument.name}.`);
      }

      // Clear the position outright when the remainder would be dust, so a
      // "sell all" never strands a fraction of a cent on the books.
      const proportion = byShares
        ? Math.min(1, wantShares / heldShares)
        : Math.min(1, filledAmount / heldValue);
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

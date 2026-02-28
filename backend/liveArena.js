/**
 * LiveArena — Persistent multiplayer model-fighting arena
 *
 * Anyone can join with a wallet address + model weights JSON.
 * The arena ticks every 5 s on live BNB/USD price from CoinGecko.
 * Each fighter starts with $10 000 virtual cash.
 * Every trade is logged. A global leaderboard ranks by portfolio value.
 */
const { predict, prepareFeatures, getSignal, validateModel } = require("./mlInference");
const { supabase, isReady: sbReady } = require("./supabaseClient");

const INITIAL_CASH   = 10_000;
const TRADE_FRACTION = 0.10;     // 10 % of available balance per trade
const TICK_MS        = 10_000;    // 10 seconds
const MAX_FIGHTERS   = 50;       // cap to prevent abuse
const PRICE_HISTORY_CAP = 200;   // keep last 200 prices

// Distinct fighter colors (never gold #f0b90b — that's BNB price line)
const FIGHTER_COLORS = [
  '#00bcd4', '#ec4899', '#8b5cf6', '#10b981', '#f97316', '#06b6d4',
  '#a855f7', '#14b8a6', '#f43f5e', '#6366f1', '#84cc16', '#fb923c',
];

class LiveArena {
  constructor(fetchPriceFn) {
    this.fighters     = new Map();   // wallet → fighter state
    this.priceHistory = [];
    this.tickCount    = 0;
    this.tradeLog     = [];          // global trade log (last 500)
    this.running      = false;
    this._interval    = null;
    this._fetchPrice  = fetchPriceFn; // async () => number | null
    this.startedAt    = null;
  }

  /* ── Join the arena ─────────────────────────────────────────────── */
  join(wallet, model) {
    const addr = wallet.toLowerCase();
    if (this.fighters.size >= MAX_FIGHTERS && !this.fighters.has(addr)) {
      return { ok: false, error: `Arena full (max ${MAX_FIGHTERS} fighters)` };
    }
    const check = validateModel(model);
    if (!check.valid) return { ok: false, error: check.error };

    // If already in arena, update model (reset portfolio)
    this.fighters.set(addr, {
      wallet: addr,
      model,
      cash: INITIAL_CASH,
      bnb: 0,
      joinedAt: Date.now(),
      signals: [],
      trades: [],
      portfolioHistory: [],
      totalBuys: 0,
      totalSells: 0,
      totalHolds: 0,
      lastSignal: null,
    });

    console.log(`[Arena] ${model.name} joined (${addr.slice(0,8)}…)`);
    this._sbUpsertFighter(addr, model);
    return { ok: true };
  }

  /* ── Leave the arena ────────────────────────────────────────────── */
  leave(wallet) {
    const addr = wallet.toLowerCase();
    const f = this.fighters.get(addr);
    if (!f) return { ok: false, error: "Not in arena" };
    this.fighters.delete(addr);
    console.log(`[Arena] ${f.model.name} left (${addr.slice(0,8)}…)`);
    this._sbRemoveFighter(addr);
    return { ok: true };
  }

  /* ── Start the arena loop ───────────────────────────────────────── */
  start() {
    if (this.running) return;
    this.running   = true;
    this.startedAt = Date.now();
    console.log("[Arena] 🏟️  Live arena started");
    this._tick();                         // first tick immediately
    this._interval = setInterval(() => this._tick(), TICK_MS);
  }

  stop() {
    this.running = false;
    if (this._interval) clearInterval(this._interval);
    this._interval = null;
    console.log("[Arena] Stopped");
  }

  /* ── One tick ───────────────────────────────────────────────────── */
  async _tick() {
    try {
      const price = await this._fetchPrice();
      if (price == null) return;           // API hiccup, skip tick

      this.priceHistory.push(price);
      if (this.priceHistory.length > PRICE_HISTORY_CAP)
        this.priceHistory = this.priceHistory.slice(-PRICE_HISTORY_CAP);

      this.tickCount++;

      for (const [addr, f] of this.fighters) {
        try {
          const features = prepareFeatures(
            [...this.priceHistory],
            f.model.inputWindow || 5,
            f.model
          );
          const output = predict(f.model, features);
          const { label: signal, confidence } = getSignal(output);

          f.lastSignal = signal;
          f.signals.push(signal);

          // Execute trade — allows short selling (negative BNB)
          if (signal === "buy" && f.cash > 1) {
            const spend  = f.cash * TRADE_FRACTION;
            const amount = spend / price;
            const wasShort = f.bnb < -0.0001;
            f.cash -= spend;
            f.bnb  += amount;
            f.totalBuys++;
            const trade = {
              tick: this.tickCount, wallet: addr, model: f.model.name,
              type: wasShort ? "cover" : "buy", price, amount, confidence, ts: Date.now(),
            };
            f.trades.push(trade);
            this.tradeLog.push(trade);
          } else if (signal === "sell" && f.bnb > 0.0001) {
            // Normal sell — sell existing BNB
            const sellAmt = f.bnb * TRADE_FRACTION;
            const revenue = sellAmt * price;
            f.bnb  -= sellAmt;
            f.cash += revenue;
            f.totalSells++;
            const trade = {
              tick: this.tickCount, wallet: addr, model: f.model.name,
              type: "sell", price, amount: sellAmt, confidence, ts: Date.now(),
            };
            f.trades.push(trade);
            this.tradeLog.push(trade);
          } else if (signal === "sell" && f.cash > 1) {
            // Short sell — borrow BNB, sell for cash (negative BNB position)
            const spend   = f.cash * TRADE_FRACTION;
            const amount  = spend / price;
            f.cash += spend;       // receive cash from short
            f.bnb  -= amount;      // owe BNB (negative)
            f.totalSells++;
            const trade = {
              tick: this.tickCount, wallet: addr, model: f.model.name,
              type: "short", price, amount, confidence, ts: Date.now(),
            };
            f.trades.push(trade);
            this.tradeLog.push(trade);
          } else {
            f.totalHolds++;
          }

          const value = f.cash + f.bnb * price;
          f.portfolioHistory.push({ tick: this.tickCount, value, ts: Date.now() });
        } catch (err) {
          console.error(`[Arena] Inference error for ${addr}:`, err.message);
        }
      }

      // Trim global trade log
      if (this.tradeLog.length > 500)
        this.tradeLog = this.tradeLog.slice(-500);

      // Async Supabase sync (fire & forget)
      this._sbSyncTick(price);

    } catch (err) {
      console.error("[Arena] Tick error:", err.message);
    }
  }

  /* ── Getters ────────────────────────────────────────────────────── */

  getLeaderboard() {
    const curPrice = this.priceHistory[this.priceHistory.length - 1] || 0;
    const list = [];
    for (const [addr, f] of this.fighters) {
      const value = f.cash + f.bnb * curPrice;
      const pnl   = value - INITIAL_CASH;
      list.push({
        wallet:     addr,
        name:       f.model.name,
        color:      f.model.color || FIGHTER_COLORS[list.length % FIGHTER_COLORS.length],
        value:      +value.toFixed(2),
        pnl:        +pnl.toFixed(2),
        pnlPct:     +((pnl / INITIAL_CASH) * 100).toFixed(2),
        cash:       +f.cash.toFixed(2),
        bnb:        +f.bnb.toFixed(6),
        totalBuys:  f.totalBuys,
        totalSells: f.totalSells,
        totalHolds: f.totalHolds,
        lastSignal: f.lastSignal,
        joinedAt:   f.joinedAt,
        tradeCount: f.trades.length,
        // recent signal history (last 30) for visualization
        signalHistory: f.signals.slice(-30),
        // position info
        isShort:    f.bnb < 0,
        exposure:   +(Math.abs(f.bnb) * curPrice).toFixed(2),
      });
    }
    list.sort((a, b) => b.value - a.value);
    return list;
  }

  getFighterDetail(wallet) {
    const f = this.fighters.get(wallet.toLowerCase());
    if (!f) return null;
    const curPrice = this.priceHistory[this.priceHistory.length - 1] || 0;
    return {
      wallet: f.wallet,
      name: f.model.name,
      color: f.model.color,
      description: f.model.description,
      cash: f.cash,
      bnb: f.bnb,
      value: f.cash + f.bnb * curPrice,
      signals: f.signals.slice(-50),
      trades: f.trades.slice(-50),
      portfolioHistory: f.portfolioHistory,
      totalBuys: f.totalBuys,
      totalSells: f.totalSells,
      totalHolds: f.totalHolds,
    };
  }

  getStatus() {
    return {
      running:      this.running,
      tickCount:    this.tickCount,
      fighterCount: this.fighters.size,
      currentPrice: this.priceHistory[this.priceHistory.length - 1] || null,
      priceHistory: this.priceHistory.slice(-100),
      startedAt:    this.startedAt,
    };
  }

  getRecentTrades(limit = 50) {
    return this.tradeLog.slice(-limit).reverse();
  }

  getPortfolioChartData() {
    const data = {};
    let idx = 0;
    for (const [addr, f] of this.fighters) {
      data[addr] = {
        name: f.model.name,
        color: f.model.color || FIGHTER_COLORS[idx % FIGHTER_COLORS.length],
        history: f.portfolioHistory,
        trades: f.trades.slice(-100).map(t => ({ tick: t.tick, type: t.type, price: t.price })),
      };
      idx++;
    }
    return data;
  }

  /* ═══ Supabase write-behind helpers (all fire-and-forget) ════════════ */

  async _sbUpsertFighter(addr, model) {
    if (!sbReady()) return;
    try {
      // Upsert profile
      await supabase.from("profiles").upsert(
        { wallet: addr, display_name: model.name },
        { onConflict: "wallet" }
      );
      // Upsert fighter
      await supabase.from("fighters").upsert({
        wallet: addr,
        model_name: model.name,
        model_color: model.color || "#f0b90b",
        model_json: model,
        cash: INITIAL_CASH,
        bnb: 0,
        total_buys: 0,
        total_sells: 0,
        total_holds: 0,
        last_signal: null,
        active: true,
        joined_at: new Date().toISOString(),
      }, { onConflict: "wallet" });
    } catch (e) { console.error("[Supabase] upsert fighter:", e.message); }
  }

  async _sbRemoveFighter(addr) {
    if (!sbReady()) return;
    try {
      await supabase.from("fighters").update({ active: false }).eq("wallet", addr);
    } catch (e) { console.error("[Supabase] remove fighter:", e.message); }
  }

  async _sbSyncTick(price) {
    if (!sbReady()) return;
    try {
      // Update arena state
      await supabase.from("arena_state").update({
        tick_count: this.tickCount,
        current_price: price,
        running: this.running,
      }).eq("id", 1);

      // Batch-insert new trades from this tick
      const tickTrades = this.tradeLog.filter(t => t.tick === this.tickCount);
      if (tickTrades.length > 0) {
        const rows = tickTrades.map(t => ({
          wallet: t.wallet,
          model_name: t.model,
          trade_type: t.type,
          price: t.price,
          amount: t.amount,
          confidence: t.confidence,
          tick: t.tick,
        }));
        await supabase.from("trades").insert(rows);
      }

      // Update fighter rows & insert portfolio snapshots
      const snapRows = [];
      for (const [addr, f] of this.fighters) {
        await supabase.from("fighters").update({
          cash: f.cash,
          bnb: f.bnb,
          total_buys: f.totalBuys,
          total_sells: f.totalSells,
          total_holds: f.totalHolds,
          last_signal: f.lastSignal,
        }).eq("wallet", addr);

        const last = f.portfolioHistory[f.portfolioHistory.length - 1];
        if (last) snapRows.push({ wallet: addr, tick: last.tick, value: last.value });
      }
      if (snapRows.length) await supabase.from("portfolio_snapshots").insert(snapRows);
    } catch (e) { console.error("[Supabase] sync tick:", e.message); }
  }

  /* ── Restore from Supabase on startup ────────────────────────── */
  async restoreFromSupabase() {
    if (!sbReady()) return;
    try {
      const { data: fighters } = await supabase
        .from("fighters")
        .select("*")
        .eq("active", true);
      if (!fighters?.length) return;

      for (const row of fighters) {
        const model = row.model_json;
        this.fighters.set(row.wallet, {
          wallet: row.wallet,
          model,
          cash: row.cash,
          bnb: row.bnb,
          joinedAt: new Date(row.joined_at).getTime(),
          signals: [],
          trades: [],
          portfolioHistory: [],
          totalBuys: row.total_buys,
          totalSells: row.total_sells,
          totalHolds: row.total_holds,
          lastSignal: row.last_signal,
        });
      }

      const { data: arenaRow } = await supabase.from("arena_state").select("*").eq("id", 1).single();
      if (arenaRow) this.tickCount = arenaRow.tick_count || 0;

      console.log(`[Arena] Restored ${fighters.length} fighters from Supabase (tick ${this.tickCount})`);
    } catch (e) { console.error("[Supabase] restore:", e.message); }
  }
}

module.exports = LiveArena;

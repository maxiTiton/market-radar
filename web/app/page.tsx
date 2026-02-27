"use client";

import { useState, useEffect } from "react";

type Period = "daily" | "weekly" | "monthly";

type Asset = {
  symbol: string;
  sector: string;
  returns: { daily: number; weekly: number; monthly: number };
};

type SectorData = { sector: string; count: number; avg_return: number };
type TopBySector = { symbol: string; return: number };

type MarketData = {
  top_movers: Asset[];
  bottom_movers: Asset[];
  sector_ranking: SectorData[];
  top_by_sector: Record<string, TopBySector[]>;
};

const SECTOR_ICONS: Record<string, string> = {
  Technology: "◈", Healthcare: "✦", Financials: "◆", Energy: "⬡",
  Automotive: "◉", Crypto: "⬢", Commodity: "▲", CEDEAR: "◎",
  "Consumer Discretionary": "◐", "Consumer Staples": "◑",
  Industrials: "⬟", Utilities: "◇", "Real Estate": "⬜",
  Materials: "△", "Communication Services": "◎", ETF: "◇",
};

const PERIOD_LABELS: Record<Period, string> = { daily: "1D", weekly: "1W", monthly: "1M" };

function pct(value: number) {
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}

function colorClass(value: number) {
  if (value > 2) return "pos-strong";
  if (value > 0) return "pos";
  if (value < -2) return "neg-strong";
  if (value < 0) return "neg";
  return "neutral";
}

function BarFill({ value, max }: { value: number; max: number }) {
  const width = Math.min(Math.abs(value) / max, 1) * 100;
  return (
    <div className="bar-track">
      <div className={`bar-fill ${value >= 0 ? "bar-pos" : "bar-neg"}`} style={{ width: `${width}%` }} />
    </div>
  );
}

function StarBtn({ symbol, favorites, onToggle }: { symbol: string; favorites: Set<string>; onToggle: (s: string) => void }) {
  const isFav = favorites.has(symbol);
  return (
    <button onClick={() => onToggle(symbol)} className={`star-btn ${isFav ? "star-active" : ""}`}>
      {isFav ? "★" : "☆"}
    </button>
  );
}

export default function Home() {
  const [period, setPeriod] = useState<Period>("daily");
  const [data, setData] = useState<MarketData | null>(null);
  const [allAssets, setAllAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  useEffect(() => {
    const saved = localStorage.getItem("mr-favorites");
    if (saved) setFavorites(new Set(JSON.parse(saved)));
  }, []);

  // Fetch period data + all assets on mount
  useEffect(() => {
    Promise.all([
      fetch("/api/market/all").then((r) => r.json()),
    ]).then(([all]) => {
      setAllAssets(all.assets ?? []);
    });
  }, []);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/market/${period}`)
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [period]);

  function toggleFavorite(symbol: string) {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(symbol)) next.delete(symbol);
      else next.add(symbol);
      localStorage.setItem("mr-favorites", JSON.stringify(Array.from(next)));
      return next;
    });
  }

  const now = new Date();
  const timeStr = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  const dateStr = now.toLocaleDateString("en-US", { weekday: "short", year: "numeric", month: "short", day: "numeric" });

  if (!data && loading) return <div className="heatmap-loading"><span>⟳ &nbsp;LOADING...</span></div>;
  if (!data) return <div className="heatmap-loading"><span style={{ color: "var(--red)" }}>✕ &nbsp;API unavailable</span></div>;

  const movers = [...data.top_movers, ...data.bottom_movers];
  const maxReturn = Math.max(...movers.map((a) => Math.abs(a.returns[period])), 1);
  const sectorMax = Math.max(...data.sector_ranking.map((s) => Math.abs(s.avg_return)), 1);

  // Favorites from ALL assets (not just top/bottom movers)
  const favAssets = allAssets.filter((a) => favorites.has(a.symbol));

  return (
    <main className="app">
      <div className="header">
        <div className="header-left">
          <div className="header-meta">
            <span className="meta-date">{dateStr}</span>
            <span className="meta-sep">·</span>
            <span className="meta-time">{timeStr}</span>
          </div>
        </div>
        <nav className="period-nav">
          {(["daily", "weekly", "monthly"] as Period[]).map((p) => (
            <button key={p} onClick={() => setPeriod(p)} className={`period-btn ${period === p ? "period-btn-active" : ""}`}>
              <span className="period-label-short">{PERIOD_LABELS[p]}</span>
              <span className="period-label-long">{p}</span>
            </button>
          ))}
        </nav>
      </div>

      <div className="summary-bar">
        <div className="summary-stat">
          <span className="summary-label">UNIVERSE</span>
          <span className="summary-value">{allAssets.length || movers.length}</span>
          <span className="summary-unit">assets tracked</span>
        </div>
        <div className="summary-divider" />
        <div className="summary-stat">
          <span className="summary-label">BEST</span>
          <span className={`summary-value ${colorClass(data.top_movers[0]?.returns[period] ?? 0)}`}>{data.top_movers[0]?.symbol}</span>
          <span className={`summary-unit ${colorClass(data.top_movers[0]?.returns[period] ?? 0)}`}>{pct(data.top_movers[0]?.returns[period] ?? 0)}</span>
        </div>
        <div className="summary-divider" />
        <div className="summary-stat">
          <span className="summary-label">WORST</span>
          <span className={`summary-value ${colorClass(data.bottom_movers[0]?.returns[period] ?? 0)}`}>{data.bottom_movers[0]?.symbol}</span>
          <span className={`summary-unit ${colorClass(data.bottom_movers[0]?.returns[period] ?? 0)}`}>{pct(data.bottom_movers[0]?.returns[period] ?? 0)}</span>
        </div>
        <div className="summary-divider" />
        <div className="summary-stat">
          <span className="summary-label">TOP SECTOR</span>
          <span className="summary-value" style={{ fontSize: "0.85rem" }}>{data.sector_ranking[0]?.sector}</span>
          <span className={`summary-unit ${colorClass(data.sector_ranking[0]?.avg_return ?? 0)}`}>{pct(data.sector_ranking[0]?.avg_return ?? 0)} avg</span>
        </div>
        <div className="summary-divider" />
        <div className="summary-stat">
          <span className="summary-label">WATCHLIST</span>
          <span className="summary-value">{favorites.size}</span>
          <span className="summary-unit">favorites</span>
        </div>
      </div>

      {/* MY POSITIONS — always shows all favorites regardless of period */}
      {favAssets.length > 0 && (
        <section className="panel panel-wide" style={{ marginBottom: "1rem" }}>
          <div className="panel-header">
            <span className="panel-icon" style={{ color: "var(--gold)" }}>★</span>
            <h2 className="panel-title">MY POSITIONS</h2>
            <span className="panel-badge" style={{ background: "rgba(240,160,64,0.1)", color: "var(--gold)", border: "1px solid rgba(240,160,64,0.25)" }}>
              {favAssets.length} tracked
            </span>
          </div>
          <div className="fav-grid">
            {favAssets.map((item) => (
              <div key={item.symbol} className="fav-card">
                <div className="fav-card-top">
                  <a href={`/asset/${item.symbol}`} className="fav-symbol symbol-link">{item.symbol}</a>
                  <StarBtn symbol={item.symbol} favorites={favorites} onToggle={toggleFavorite} />
                </div>
                <span className="fav-sector">{SECTOR_ICONS[item.sector] ?? "◦"} {item.sector}</span>
                <div className="fav-returns">
                  {(["daily", "weekly", "monthly"] as Period[]).map((p) => (
                    <div key={p} className="fav-return-row">
                      <span className="fav-period">{PERIOD_LABELS[p]}</span>
                      <span className={`fav-val ${colorClass(item.returns[p] ?? 0)}`}>{pct(item.returns[p] ?? 0)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="main-grid">
        <section className="panel">
          <div className="panel-header">
            <span className="panel-icon green">▲</span>
            <h2 className="panel-title">TOP MOVERS</h2>
            <span className="panel-badge green">{period}</span>
          </div>
          <div className="mover-list">
            {data.top_movers.map((item, i) => (
              <div key={i} className={`mover-row ${favorites.has(item.symbol) ? "mover-row-fav" : ""}`}>
                <span className="mover-rank">{String(i + 1).padStart(2, "0")}</span>
                <div className="mover-info">
                  <a href={`/asset/${item.symbol}`} className="mover-symbol symbol-link">{item.symbol}</a>
                  <span className="mover-sector">{SECTOR_ICONS[item.sector] ?? "◦"} {item.sector}</span>
                </div>
                <div className="mover-right">
                  <BarFill value={item.returns[period]} max={maxReturn} />
                  <span className={`mover-pct ${colorClass(item.returns[period])}`}>{pct(item.returns[period])}</span>
                </div>
                <StarBtn symbol={item.symbol} favorites={favorites} onToggle={toggleFavorite} />
              </div>
            ))}
          </div>
        </section>

        <section className="panel">
          <div className="panel-header">
            <span className="panel-icon red">▼</span>
            <h2 className="panel-title">BOTTOM MOVERS</h2>
            <span className="panel-badge red">{period}</span>
          </div>
          <div className="mover-list">
            {data.bottom_movers.map((item, i) => (
              <div key={i} className={`mover-row ${favorites.has(item.symbol) ? "mover-row-fav" : ""}`}>
                <span className="mover-rank red">{String(i + 1).padStart(2, "0")}</span>
                <div className="mover-info">
                  <a href={`/asset/${item.symbol}`} className="mover-symbol symbol-link">{item.symbol}</a>
                  <span className="mover-sector">{SECTOR_ICONS[item.sector] ?? "◦"} {item.sector}</span>
                </div>
                <div className="mover-right">
                  <BarFill value={item.returns[period]} max={maxReturn} />
                  <span className={`mover-pct ${colorClass(item.returns[period])}`}>{pct(item.returns[period])}</span>
                </div>
                <StarBtn symbol={item.symbol} favorites={favorites} onToggle={toggleFavorite} />
              </div>
            ))}
          </div>
        </section>

        <section className="panel panel-wide">
          <div className="panel-header">
            <span className="panel-icon">◈</span>
            <h2 className="panel-title">SECTOR RANKING</h2>
            <span className="panel-badge">{data.sector_ranking.length} sectors</span>
          </div>
          <div className="sector-list">
            {data.sector_ranking.map((item, i) => (
              <div key={i} className="sector-row">
                <div className="sector-left">
                  <span className="sector-rank">{i + 1}</span>
                  <span className="sector-icon">{SECTOR_ICONS[item.sector] ?? "◦"}</span>
                  <div className="sector-info">
                    <span className="sector-name-text">{item.sector}</span>
                    <span className="sector-count">{item.count} assets</span>
                  </div>
                </div>
                <div className="sector-right">
                  <BarFill value={item.avg_return} max={sectorMax} />
                  <span className={`sector-pct ${colorClass(item.avg_return)}`}>{pct(item.avg_return)}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="panel panel-wide">
          <div className="panel-header">
            <span className="panel-icon">⬡</span>
            <h2 className="panel-title">LEADERS BY SECTOR</h2>
            <span className="panel-badge">{Object.keys(data.top_by_sector).length} sectors</span>
          </div>
          <div className="sector-grid">
            {Object.entries(data.top_by_sector).map(([sector, assets]) => (
              <div key={sector} className="sector-card">
                <div className="sector-card-header">
                  <span className="sector-card-icon">{SECTOR_ICONS[sector] ?? "◦"}</span>
                  <span className="sector-card-name">{sector}</span>
                </div>
                <ul className="sector-asset-list">
                  {assets.map((a, i) => (
                    <li key={i} className="sector-asset-row">
                      <span className="sector-asset-symbol">{a.symbol}</span>
                      <div className="sector-mini-track">
                        <div className={`sector-mini-bar ${a.return >= 0 ? "bar-pos" : "bar-neg"}`}
                          style={{ width: `${Math.min(Math.abs(a.return) / sectorMax, 1) * 100}%` }} />
                      </div>
                      <span className={`sector-asset-pct ${colorClass(a.return)}`}>{pct(a.return)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      </div>

      <footer className="footer">
        <span>MARKET RADAR · Data via Yahoo Finance · Refreshed every 15 min</span>
        <span>FastAPI + Next.js</span>
      </footer>
    </main>
  );
}
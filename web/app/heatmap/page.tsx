"use client";

import { useState, useEffect } from "react";

type Period = "daily" | "weekly" | "monthly";

type Asset = {
  symbol: string;
  sector: string;
  returns: { daily: number; weekly: number; monthly: number };
};

type MarketData = {
  top_movers: Asset[];
  bottom_movers: Asset[];
  sector_ranking: { sector: string; count: number; avg_return: number }[];
  top_by_sector: Record<string, { symbol: string; return: number }[]>;
};

const SECTOR_ICONS: Record<string, string> = {
  Technology: "◈", Healthcare: "✦", Financials: "◆", Energy: "⬡",
  Automotive: "◉", Crypto: "⬢", Commodity: "▲", CEDEAR: "◎",
  "Consumer Discretionary": "◐", "Consumer Staples": "◑",
  Industrials: "⬟", Utilities: "◇", "Real Estate": "⬜",
  Materials: "△", "Communication Services": "◎", ETF: "◇",
};

function pct(v: number) {
  return `${v >= 0 ? "+" : ""}${v.toFixed(2)}%`;
}

function heatColor(value: number): string {
  const clamped = Math.max(-10, Math.min(10, value));
  if (clamped >= 0) {
    const t = clamped / 10;
    return `rgb(${Math.round(10 - 10*t)},${Math.round(20 + 180*t)},${Math.round(15 + 65*t)})`;
  } else {
    const t = Math.abs(clamped) / 10;
    return `rgb(${Math.round(20 + 180*t)},${Math.round(10 + 10*t)},${Math.round(15 + 5*t)})`;
  }
}

function colorClass(v: number) {
  if (v > 2) return "pos-strong";
  if (v > 0) return "pos";
  if (v < -2) return "neg-strong";
  if (v < 0) return "neg";
  return "neutral";
}

export default function HeatmapPage() {
  const [period, setPeriod] = useState<Period>("daily");
  const [allAssets, setAllAssets] = useState<Asset[]>([]);
  const [sectorRankings, setSectorRankings] = useState<Record<Period, { sector: string; count: number; avg_return: number }[]>>({ daily: [], weekly: [], monthly: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  useEffect(() => {
    const saved = localStorage.getItem("mr-favorites");
    if (saved) setFavorites(new Set(JSON.parse(saved)));
  }, []);

  useEffect(() => {
    async function fetchAll() {
      setLoading(true);
      setError(false);
      try {
        const [all, d, w, m] = await Promise.all([
          fetch("/api/market/all").then((r) => r.json()),
          fetch("/api/market/daily").then((r) => r.json()),
          fetch("/api/market/weekly").then((r) => r.json()),
          fetch("/api/market/monthly").then((r) => r.json()),
        ]);
        setAllAssets(all.assets ?? []);
        setSectorRankings({ daily: d.sector_ranking ?? [], weekly: w.sector_ranking ?? [], monthly: m.sector_ranking ?? [] });
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
  }, []);

  function toggleFavorite(symbol: string) {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(symbol)) next.delete(symbol);
      else next.add(symbol);
      localStorage.setItem("mr-favorites", JSON.stringify(Array.from(next)));
      return next;
    });
  }

  const sectorMap = new Map<string, Asset[]>();
  allAssets.forEach((a) => {
    if (!sectorMap.has(a.sector)) sectorMap.set(a.sector, []);
    sectorMap.get(a.sector)!.push(a);
  });
  sectorMap.forEach((assets, sector) => {
    sectorMap.set(sector, assets.sort((a, b) => (b.returns?.[period] ?? 0) - (a.returns?.[period] ?? 0)));
  });

  const currentRanking = sectorRankings[period];
  const sortedSectors = currentRanking.length > 0 ? currentRanking.map((s) => s.sector) : Array.from(sectorMap.keys());

  if (loading) return <div className="heatmap-loading"><span>⟳ &nbsp;LOADING MARKET DATA...</span></div>;
  if (error) return <div className="heatmap-loading"><span style={{ color: "var(--red)" }}>✕ &nbsp;FAILED TO CONNECT TO API</span></div>;

  return (
    <div className="heatmap-page">
      <div className="heatmap-header">
        <div className="heatmap-title-block">
          <h1>MARKET HEATMAP</h1>
          <p>{allAssets.length} assets · grouped by sector · hover for details · ★ to watch</p>
        </div>
        <div className="heatmap-controls">
          <div className="heatmap-legend">
            <span className="legend-label">−10%</span>
            <div className="legend-bar" />
            <span className="legend-label">+10%</span>
          </div>
          <nav className="period-nav">
            {(["daily", "weekly", "monthly"] as Period[]).map((p) => (
              <button key={p} onClick={() => setPeriod(p)} className={`period-btn ${period === p ? "period-btn-active" : ""}`}>
                <span className="period-label-short">{p === "daily" ? "1D" : p === "weekly" ? "1W" : "1M"}</span>
                <span className="period-label-long">{p}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      <div className="heatmap-body">
        {sortedSectors.map((sectorName) => {
          const assets = sectorMap.get(sectorName) ?? [];
          if (assets.length === 0) return null;
          const sectorEntry = currentRanking.find((s) => s.sector === sectorName);
          const avgReturn = sectorEntry?.avg_return ?? 0;

          return (
            <div key={sectorName} className="heatmap-sector">
              <div className="heatmap-sector-header">
                <span className="heatmap-sector-icon">{SECTOR_ICONS[sectorName] ?? "◦"}</span>
                <span className="heatmap-sector-name">{sectorName}</span>
                <span className={`heatmap-sector-avg ${colorClass(avgReturn)}`}>avg {pct(avgReturn)}</span>
                <span className="sector-count" style={{ marginLeft: "0.5rem" }}>{assets.length} assets</span>
              </div>
              <div className="heatmap-tiles">
                {assets.map((asset) => {
                  const val = asset.returns?.[period] ?? 0;
                  const isFav = favorites.has(asset.symbol);
                  return (
                    <div
                      key={asset.symbol}
                      className={`heatmap-tile ${isFav ? "heatmap-tile-fav" : ""}`}
                      style={{ background: heatColor(val) }}
                      onClick={() => toggleFavorite(asset.symbol)}
                    >
                      {isFav && <span className="tile-star">★</span>}
                      <span className="tile-symbol">{asset.symbol}</span>
                      <span className="tile-pct">{pct(val)}</span>
                      <div className="tile-tooltip">
                        <span className="tooltip-symbol">{asset.symbol}</span>
                        <span className="tooltip-sector">{asset.sector}</span>
                        <div className="tooltip-row">
                          <span className="tooltip-period">1D</span>
                          <span className={`tooltip-val ${colorClass(asset.returns?.daily ?? 0)}`}>{pct(asset.returns?.daily ?? 0)}</span>
                        </div>
                        <div className="tooltip-row">
                          <span className="tooltip-period">1W</span>
                          <span className={`tooltip-val ${colorClass(asset.returns?.weekly ?? 0)}`}>{pct(asset.returns?.weekly ?? 0)}</span>
                        </div>
                        <div className="tooltip-row">
                          <span className="tooltip-period">1M</span>
                          <span className={`tooltip-val ${colorClass(asset.returns?.monthly ?? 0)}`}>{pct(asset.returns?.monthly ?? 0)}</span>
                        </div>
                        <div style={{ marginTop: "4px", fontSize: "0.58rem", color: "var(--txt-dimmer)" }}>
                          {isFav ? "click to unwatch" : "click to watch ★"}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <footer className="footer" style={{ marginTop: "2rem" }}>
        <span>MARKET RADAR · Heatmap · Data via Yahoo Finance</span>
        <span>FastAPI + Next.js</span>
      </footer>
    </div>
  );
}
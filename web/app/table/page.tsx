"use client";

import { useState, useEffect, useMemo } from "react";

type Asset = {
  symbol: string;
  sector: string;
  returns: { daily: number | null; weekly: number | null; monthly: number | null };
};

type SortKey = "symbol" | "sector" | "daily" | "weekly" | "monthly";
type SortDir = "asc" | "desc";

const SECTOR_ICONS: Record<string, string> = {
  Technology: "◈", Healthcare: "✦", Financials: "◆", Energy: "⬡",
  Automotive: "◉", Crypto: "⬢", Commodity: "▲", CEDEAR: "◎",
  "Consumer Discretionary": "◐", "Consumer Staples": "◑",
  Industrials: "⬟", Utilities: "◇", "Real Estate": "⬜",
  Materials: "△", "Communication Services": "◎", ETF: "◇",
};

function pct(v: number | null) {
  if (v === null || v === undefined) return "—";
  return `${v >= 0 ? "+" : ""}${v.toFixed(2)}%`;
}

function colorClass(v: number | null) {
  if (v === null || v === undefined) return "neutral";
  if (v > 2) return "pos-strong";
  if (v > 0) return "pos";
  if (v < -2) return "neg-strong";
  if (v < 0) return "neg";
  return "neutral";
}

function MomentumBadge({ asset }: { asset: Asset }) {
  const d = asset.returns.daily ?? 0;
  const w = asset.returns.weekly ?? 0;
  const m = asset.returns.monthly ?? 0;
  if (d > 0 && w > 0 && m > 0) return <span className="badge badge-green">↑ bullish</span>;
  if (d < 0 && w < 0 && m < 0) return <span className="badge badge-red">↓ bearish</span>;
  return null;
}

function StarBtn({ symbol, favorites, onToggle }: { symbol: string; favorites: Set<string>; onToggle: (s: string) => void }) {
  const isFav = favorites.has(symbol);
  return (
    <button onClick={() => onToggle(symbol)} className={`star-btn ${isFav ? "star-active" : ""}`} title={isFav ? "Remove from favorites" : "Add to favorites"}>
      {isFav ? "★" : "☆"}
    </button>
  );
}

export default function TablePage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("daily");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [search, setSearch] = useState("");
  const [sectorFilter, setSectorFilter] = useState("ALL");
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [showFavsOnly, setShowFavsOnly] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("mr-favorites");
    if (saved) setFavorites(new Set(JSON.parse(saved)));
  }, []);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/market/all");
        const data = await res.json();
        setAssets(data.assets ?? []);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
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

  const sectors = useMemo(() => {
    const s = Array.from(new Set(assets.map((a) => a.sector))).sort();
    return ["ALL", ...s];
  }, [assets]);

  const sorted = useMemo(() => {
    const filtered = assets.filter((a) => {
      const matchSearch = a.symbol.toLowerCase().includes(search.toLowerCase());
      const matchSector = sectorFilter === "ALL" || a.sector === sectorFilter;
      const matchFav = !showFavsOnly || favorites.has(a.symbol);
      return matchSearch && matchSector && matchFav;
    });

    filtered.sort((a, b) => {
      let av: string | number, bv: string | number;
      if (sortKey === "symbol") { av = a.symbol; bv = b.symbol; }
      else if (sortKey === "sector") { av = a.sector; bv = b.sector; }
      else {
        av = a.returns[sortKey] ?? -Infinity;
        bv = b.returns[sortKey] ?? -Infinity;
      }
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

    // Always put favorites on top
    return [...filtered.filter((a) => favorites.has(a.symbol)), ...filtered.filter((a) => !favorites.has(a.symbol))];
  }, [assets, search, sectorFilter, sortKey, sortDir, favorites, showFavsOnly]);

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("desc"); }
  }

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col) return <span className="sort-icon">⇅</span>;
    return <span className="sort-icon active">{sortDir === "desc" ? "↓" : "↑"}</span>;
  }

  const refPeriod = sortKey === "symbol" || sortKey === "sector" ? "daily" : sortKey;
  const gainers = sorted.filter((a) => (a.returns[refPeriod] ?? 0) > 0).length;
  const losers  = sorted.filter((a) => (a.returns[refPeriod] ?? 0) < 0).length;

  if (loading) return <div className="heatmap-loading"><span>⟳ &nbsp;LOADING...</span></div>;
  if (error)   return <div className="heatmap-loading"><span style={{ color: "var(--red)" }}>✕ &nbsp;API unavailable</span></div>;

  return (
    <div className="table-page">
      <div className="table-header">
        <div className="heatmap-title-block">
          <h1>COMPARISON TABLE</h1>
          <p>{sorted.length} assets · click any column header to sort · returns 1D / 1W / 1M</p>
        </div>
        <div className="table-stats">
          <span className="pos">▲ {gainers} positive</span>
          <span className="table-stats-sep">·</span>
          <span className="neg">▼ {losers} negative</span>
          <span className="table-stats-sep">·</span>
          <span className="neutral">{sorted.length - gainers - losers} neutral</span>
        </div>
      </div>

      <div className="table-controls">
        <input
          className="table-search"
          type="text"
          placeholder="Search symbol..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button
          onClick={() => setShowFavsOnly(!showFavsOnly)}
          className={`sector-filter-btn ${showFavsOnly ? "active" : ""}`}
          style={{ borderColor: showFavsOnly ? "var(--gold)" : undefined, color: showFavsOnly ? "var(--gold)" : undefined }}
        >
          ★ Watchlist ({favorites.size})
        </button>
        <div className="sector-filters">
          {sectors.map((s) => (
            <button key={s} onClick={() => setSectorFilter(s)} className={`sector-filter-btn ${sectorFilter === s ? "active" : ""}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th className="th-rank">#</th>
              <th style={{ width: "2rem" }}></th>
              <th className="th-sortable" onClick={() => handleSort("symbol")}>SYMBOL <SortIcon col="symbol" /></th>
              <th className="th-sortable" onClick={() => handleSort("sector")}>SECTOR <SortIcon col="sector" /></th>
              <th className="th-sortable th-num" onClick={() => handleSort("daily")}>1D <SortIcon col="daily" /></th>
              <th className="th-sortable th-num" onClick={() => handleSort("weekly")}>1W <SortIcon col="weekly" /></th>
              <th className="th-sortable th-num" onClick={() => handleSort("monthly")}>1M <SortIcon col="monthly" /></th>
              <th className="th-badge">TREND</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((asset, i) => (
              <tr key={asset.symbol} className={`data-row ${favorites.has(asset.symbol) ? "data-row-fav" : ""}`}>
                <td className="td-rank">{i + 1}</td>
                <td className="td-star"><StarBtn symbol={asset.symbol} favorites={favorites} onToggle={toggleFavorite} /></td>
                <td className="td-symbol">{asset.symbol}</td>
                <td className="td-sector"><span className="sector-chip">{SECTOR_ICONS[asset.sector] ?? "◦"} {asset.sector}</span></td>
                <td className={`td-num ${colorClass(asset.returns.daily)}`}>{pct(asset.returns.daily)}</td>
                <td className={`td-num ${colorClass(asset.returns.weekly)}`}>{pct(asset.returns.weekly)}</td>
                <td className={`td-num ${colorClass(asset.returns.monthly)}`}>{pct(asset.returns.monthly)}</td>
                <td className="td-badge"><MomentumBadge asset={asset} /></td>
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr><td colSpan={8} className="td-empty">No results found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <footer className="footer" style={{ marginTop: "2rem" }}>
        <span>MARKET RADAR · Comparison Table · Data via Yahoo Finance</span>
        <span>FastAPI + Next.js</span>
      </footer>
    </div>
  );
}
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

type PricePoint = { date: string; price: number };

type AssetDetail = {
  symbol: string;
  sector: string;
  current_price: number;
  prev_price: number;
  high: number;
  low: number;
  daily_return: number;
  returns: { daily: number; weekly: number; monthly: number } | null;
  sector_avg_return: number | null;
  history: PricePoint[];
  period: string;
};

const SECTOR_ICONS: Record<string, string> = {
  Technology: "◈", Healthcare: "✦", Financials: "◆", Energy: "⬡",
  Automotive: "◉", Crypto: "⬢", Commodity: "▲", CEDEAR: "◎",
  "Consumer Discretionary": "◐", "Consumer Staples": "◑",
  Industrials: "⬟", Utilities: "◇", "Real Estate": "⬜",
  Materials: "△", "Communication Services": "◎", ETF: "◇",
};

const PERIODS = [
  { value: "1mo", label: "1M" },
  { value: "3mo", label: "3M" },
  { value: "6mo", label: "6M" },
  { value: "1y",  label: "1Y" },
];

function pct(v: number | null | undefined) {
  if (v === null || v === undefined) return "—";
  return `${v >= 0 ? "+" : ""}${v.toFixed(2)}%`;
}

function colorClass(v: number | null | undefined) {
  if (v === null || v === undefined) return "neutral";
  if (v > 2) return "pos-strong";
  if (v > 0) return "pos";
  if (v < -2) return "neg-strong";
  if (v < 0) return "neg";
  return "neutral";
}

function formatPrice(v: number) {
  if (v > 1000) return v.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  if (v > 10)   return v.toFixed(2);
  return v.toFixed(4);
}

// Simple SVG line chart
function PriceChart({ history }: { history: PricePoint[] }) {
  if (history.length < 2) return null;

  const prices = history.map((h) => h.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min || 1;

  const W = 800;
  const H = 200;
  const PAD = { top: 16, right: 16, bottom: 32, left: 16 };

  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;

  const points = history.map((h, i) => {
    const x = PAD.left + (i / (history.length - 1)) * chartW;
    const y = PAD.top + chartH - ((h.price - min) / range) * chartH;
    return `${x},${y}`;
  });

  const polyline = points.join(" ");
  const firstY = parseFloat(points[0].split(",")[1]);
  const lastY  = parseFloat(points[points.length - 1].split(",")[1]);
  const isUp   = prices[prices.length - 1] >= prices[0];

  // Fill area under the line
  const fillPoints = `${PAD.left},${PAD.top + chartH} ${polyline} ${PAD.left + chartW},${PAD.top + chartH}`;

  const lineColor  = isUp ? "var(--green)"      : "var(--red)";
  const fillColor  = isUp ? "rgba(0,230,118,0.08)" : "rgba(255,68,68,0.08)";

  // X axis labels (first, middle, last)
  const labelIdxs = [0, Math.floor(history.length / 2), history.length - 1];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }}>
      {/* Fill */}
      <polygon points={fillPoints} fill={fillColor} />
      {/* Line */}
      <polyline points={polyline} fill="none" stroke={lineColor} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
      {/* Start dot */}
      <circle cx={PAD.left} cy={firstY} r="3" fill={lineColor} opacity="0.5" />
      {/* End dot */}
      <circle cx={PAD.left + chartW} cy={lastY} r="4" fill={lineColor} />
      {/* X labels */}
      {labelIdxs.map((idx) => {
        const x = PAD.left + (idx / (history.length - 1)) * chartW;
        return (
          <text key={idx} x={x} y={H - 6} textAnchor="middle" fontSize="9" fill="var(--txt-dimmer)" fontFamily="IBM Plex Mono, monospace">
            {history[idx].date.slice(5)} {/* MM-DD */}
          </text>
        );
      })}
      {/* Min/max labels */}
      <text x={PAD.left + 4} y={PAD.top + chartH - 4} fontSize="9" fill="var(--txt-dimmer)" fontFamily="IBM Plex Mono, monospace">
        {formatPrice(min)}
      </text>
      <text x={PAD.left + 4} y={PAD.top + 12} fontSize="9" fill="var(--txt-dimmer)" fontFamily="IBM Plex Mono, monospace">
        {formatPrice(max)}
      </text>
    </svg>
  );
}

export default function AssetPage() {
  const params = useParams();
  const router = useRouter();
  const symbol = (params?.symbol as string ?? "").toUpperCase();

  const [data, setData] = useState<AssetDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [period, setPeriod] = useState("3mo");
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  useEffect(() => {
    const saved = localStorage.getItem("mr-favorites");
    if (saved) setFavorites(new Set(JSON.parse(saved)));
  }, []);

  useEffect(() => {
    if (!symbol) return;
    setLoading(true);
    setError(false);
    fetch(`/api/market/asset/${symbol}?period=${period}`)
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => { setError(true); setLoading(false); });
  }, [symbol, period]);

  function toggleFavorite() {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(symbol)) next.delete(symbol);
      else next.add(symbol);
      localStorage.setItem("mr-favorites", JSON.stringify(Array.from(next)));
      return next;
    });
  }

  if (loading) return <div className="heatmap-loading"><span>⟳ &nbsp;LOADING {symbol}...</span></div>;
  if (error || !data) return (
    <div className="heatmap-loading">
      <span style={{ color: "var(--red)" }}>✕ &nbsp;No data for {symbol}</span>
      <a href="/" style={{ marginLeft: "1rem", color: "var(--accent)", fontFamily: "var(--font-mono)", fontSize: "0.75rem" }}>← Back</a>
    </div>
  );

  const isFav = favorites.has(symbol);
  const isUp  = data.daily_return >= 0;

  return (
    <div className="asset-page">
      {/* Back link */}
      <div className="asset-back">
        <button onClick={() => router.back()} className="asset-back-link" style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>← Back</button>
      </div>

      {/* Header */}
      <div className="asset-header">
        <div className="asset-header-left">
          <div className="asset-title-row">
            <h1 className="asset-symbol">{data.symbol}</h1>
            <button onClick={toggleFavorite} className={`star-btn ${isFav ? "star-active" : ""}`} style={{ fontSize: "1.2rem" }}>
              {isFav ? "★" : "☆"}
            </button>
          </div>
          <span className="asset-sector">
            {SECTOR_ICONS[data.sector] ?? "◦"} {data.sector}
          </span>
        </div>
        <div className="asset-price-block">
          <span className="asset-current-price">{formatPrice(data.current_price)}</span>
          <span className={`asset-daily-return ${colorClass(data.daily_return)}`}>
            {isUp ? "▲" : "▼"} {pct(data.daily_return)} today
          </span>
        </div>
      </div>

      {/* Stats row */}
      <div className="asset-stats">
        <div className="asset-stat">
          <span className="asset-stat-label">1D RETURN</span>
          <span className={`asset-stat-value ${colorClass(data.returns?.daily)}`}>{pct(data.returns?.daily)}</span>
        </div>
        <div className="asset-stat-divider" />
        <div className="asset-stat">
          <span className="asset-stat-label">1W RETURN</span>
          <span className={`asset-stat-value ${colorClass(data.returns?.weekly)}`}>{pct(data.returns?.weekly)}</span>
        </div>
        <div className="asset-stat-divider" />
        <div className="asset-stat">
          <span className="asset-stat-label">1M RETURN</span>
          <span className={`asset-stat-value ${colorClass(data.returns?.monthly)}`}>{pct(data.returns?.monthly)}</span>
        </div>
        <div className="asset-stat-divider" />
        <div className="asset-stat">
          <span className="asset-stat-label">PERIOD HIGH</span>
          <span className="asset-stat-value pos">{formatPrice(data.high)}</span>
        </div>
        <div className="asset-stat-divider" />
        <div className="asset-stat">
          <span className="asset-stat-label">PERIOD LOW</span>
          <span className="asset-stat-value neg">{formatPrice(data.low)}</span>
        </div>
        {data.sector_avg_return !== null && (
          <>
            <div className="asset-stat-divider" />
            <div className="asset-stat">
              <span className="asset-stat-label">SECTOR AVG 1D</span>
              <span className={`asset-stat-value ${colorClass(data.sector_avg_return)}`}>{pct(data.sector_avg_return)}</span>
            </div>
          </>
        )}
      </div>

      {/* Chart */}
      <div className="asset-chart-panel">
        <div className="asset-chart-header">
          <span className="asset-chart-title">PRICE HISTORY</span>
          <div className="period-nav">
            {PERIODS.map((p) => (
              <button key={p.value} onClick={() => setPeriod(p.value)} className={`period-btn ${period === p.value ? "period-btn-active" : ""}`}>
                <span className="period-label-short">{p.label}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="asset-chart-body">
          <PriceChart history={data.history} />
        </div>
      </div>

      <footer className="footer" style={{ marginTop: "2rem" }}>
        <span>MARKET RADAR · {data.symbol} · Data via Yahoo Finance</span>
        <span>FastAPI + Next.js</span>
      </footer>
    </div>
  );
}
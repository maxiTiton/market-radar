type Period = "daily" | "weekly" | "monthly";

type Asset = {
  symbol: string;
  sector: string;
  returns: {
    daily: number;
    weekly: number;
    monthly: number;
  };
};

type SectorData = {
  sector: string;
  count: number;
  avg_return: number;
};

type TopBySector = {
  symbol: string;
  return: number;
};

type MarketData = {
  top_movers: Asset[];
  bottom_movers: Asset[];
  sector_ranking: SectorData[];
  top_by_sector: Record<string, TopBySector[]>;
};

async function getData(period: Period): Promise<MarketData> {
  const res = await fetch(`http://127.0.0.1:8000/market/${period}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to fetch market data");
  return res.json();
}

function pct(value: number) {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
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
  const isPos = value >= 0;
  return (
    <div className="bar-track">
      <div
        className={`bar-fill ${isPos ? "bar-pos" : "bar-neg"}`}
        style={{ width: `${width}%` }}
      />
    </div>
  );
}

const SECTOR_ICONS: Record<string, string> = {
  Technology: "◈",
  Healthcare: "✦",
  Financials: "◆",
  Energy: "⬡",
  Automotive: "◉",
  Crypto: "⬢",
  Commodity: "▲",
  "Consumer Discretionary": "◐",
  "Consumer Staples": "◑",
  Industrials: "⬟",
  Utilities: "◇",
  "Real Estate": "⬜",
  Materials: "△",
  "Communication Services": "◎",
};

const PERIOD_LABELS: Record<Period, string> = {
  daily: "1D",
  weekly: "1W",
  monthly: "1M",
};

export default async function Home({
  searchParams,
}: {
  searchParams?: Promise<{ period?: Period }>;
}) {
  const params = await searchParams;
  const period: Period = params?.period || "daily";
  const data: MarketData = await getData(period);

  const allReturns = [...data.top_movers, ...data.bottom_movers].map((a) =>
    Math.abs(a.returns[period])
  );
  const maxReturn = Math.max(...allReturns, 1);
  const sectorMax = Math.max(
    ...data.sector_ranking.map((s) => Math.abs(s.avg_return)),
    1
  );

  const now = new Date();
  const timeStr = now.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const dateStr = now.toLocaleDateString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <main className="app">
      {/* HEADER */}
      <header className="header">
        <div className="header-left">
          <div className="logo">
            <span className="logo-mark">▲</span>
            <span className="logo-text">
              MARKET<span className="logo-accent">RADAR</span>
            </span>
          </div>
          <div className="header-meta">
            <span className="meta-date">{dateStr}</span>
            <span className="meta-sep">·</span>
            <span className="meta-time">{timeStr}</span>
          </div>
        </div>

        <nav className="period-nav">
          {(["daily", "weekly", "monthly"] as Period[]).map((p) => (
            <a
              key={p}
              href={`/?period=${p}`}
              className={`period-btn ${period === p ? "period-btn-active" : ""}`}
            >
              <span className="period-label-short">{PERIOD_LABELS[p]}</span>
              <span className="period-label-long">{p}</span>
            </a>
          ))}
        </nav>
      </header>

      {/* SUMMARY BAR */}
      <div className="summary-bar">
        <div className="summary-stat">
          <span className="summary-label">UNIVERSE</span>
          <span className="summary-value">
            {data.top_movers.length + data.bottom_movers.length}
          </span>
          <span className="summary-unit">assets</span>
        </div>
        <div className="summary-divider" />
        <div className="summary-stat">
          <span className="summary-label">BEST</span>
          <span className={`summary-value ${colorClass(data.top_movers[0]?.returns[period] ?? 0)}`}>
            {data.top_movers[0]?.symbol}
          </span>
          <span className={`summary-unit ${colorClass(data.top_movers[0]?.returns[period] ?? 0)}`}>
            {pct(data.top_movers[0]?.returns[period] ?? 0)}
          </span>
        </div>
        <div className="summary-divider" />
        <div className="summary-stat">
          <span className="summary-label">WORST</span>
          <span className={`summary-value ${colorClass(data.bottom_movers[0]?.returns[period] ?? 0)}`}>
            {data.bottom_movers[0]?.symbol}
          </span>
          <span className={`summary-unit ${colorClass(data.bottom_movers[0]?.returns[period] ?? 0)}`}>
            {pct(data.bottom_movers[0]?.returns[period] ?? 0)}
          </span>
        </div>
        <div className="summary-divider" />
        <div className="summary-stat">
          <span className="summary-label">TOP SECTOR</span>
          <span className="summary-value" style={{ fontSize: "0.85rem" }}>
            {data.sector_ranking[0]?.sector}
          </span>
          <span className={`summary-unit ${colorClass(data.sector_ranking[0]?.avg_return ?? 0)}`}>
            {pct(data.sector_ranking[0]?.avg_return ?? 0)} avg
          </span>
        </div>
        <div className="summary-divider" />
        <div className="summary-stat">
          <span className="summary-label">PERIOD</span>
          <span className="summary-value">{PERIOD_LABELS[period]}</span>
          <span className="summary-unit">{period}</span>
        </div>
      </div>

      {/* MAIN GRID */}
      <div className="main-grid">
        {/* TOP MOVERS */}
        <section className="panel">
          <div className="panel-header">
            <span className="panel-icon green">▲</span>
            <h2 className="panel-title">TOP MOVERS</h2>
            <span className="panel-badge green">{period}</span>
          </div>
          <div className="mover-list">
            {data.top_movers.map((item, i) => (
              <div key={i} className="mover-row">
                <span className="mover-rank">{String(i + 1).padStart(2, "0")}</span>
                <div className="mover-info">
                  <span className="mover-symbol">{item.symbol}</span>
                  <span className="mover-sector">
                    {SECTOR_ICONS[item.sector] ?? "◦"} {item.sector}
                  </span>
                </div>
                <div className="mover-right">
                  <BarFill value={item.returns[period]} max={maxReturn} />
                  <span className={`mover-pct ${colorClass(item.returns[period])}`}>
                    {pct(item.returns[period])}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* BOTTOM MOVERS */}
        <section className="panel">
          <div className="panel-header">
            <span className="panel-icon red">▼</span>
            <h2 className="panel-title">BOTTOM MOVERS</h2>
            <span className="panel-badge red">{period}</span>
          </div>
          <div className="mover-list">
            {data.bottom_movers.map((item, i) => (
              <div key={i} className="mover-row">
                <span className="mover-rank red">{String(i + 1).padStart(2, "0")}</span>
                <div className="mover-info">
                  <span className="mover-symbol">{item.symbol}</span>
                  <span className="mover-sector">
                    {SECTOR_ICONS[item.sector] ?? "◦"} {item.sector}
                  </span>
                </div>
                <div className="mover-right">
                  <BarFill value={item.returns[period]} max={maxReturn} />
                  <span className={`mover-pct ${colorClass(item.returns[period])}`}>
                    {pct(item.returns[period])}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* SECTOR RANKING */}
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
                  <span className={`sector-pct ${colorClass(item.avg_return)}`}>
                    {pct(item.avg_return)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* TOP BY SECTOR */}
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
                        <div
                          className={`sector-mini-bar ${a.return >= 0 ? "bar-pos" : "bar-neg"}`}
                          style={{
                            width: `${Math.min(Math.abs(a.return) / sectorMax, 1) * 100}%`,
                          }}
                        />
                      </div>
                      <span className={`sector-asset-pct ${colorClass(a.return)}`}>
                        {pct(a.return)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* FOOTER */}
      <footer className="footer">
        <span>MARKET RADAR · Data via Yahoo Finance · Refreshed daily</span>
        <span>FastAPI + Next.js</span>
      </footer>
    </main>
  );
}

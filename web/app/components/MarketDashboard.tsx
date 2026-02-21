"use client";

import { useEffect, useState } from "react";

type Period = "daily" | "weekly" | "monthly";

type Returns = {
  daily: number;
  weekly: number;
  monthly: number;
};

type Mover = {
  symbol: string;
  sector: string;
  returns: Returns;
};

type SectorRanking = {
  sector: string;
  avg_return: number;
  count: number;
};

type TopBySectorItem = {
  symbol: string;
  return: number;
  type: string;
};

type MarketData = {
  top_movers: Mover[];
  bottom_movers: Mover[];
  sector_ranking: SectorRanking[];
  top_by_sector: Record<string, TopBySectorItem[]>;
};

function getColor(value: number) {
  if (value > 0) return "text-green-400";
  if (value < 0) return "text-red-400";
  return "text-gray-400";
}

export default function MarketDashboard({ period }: { period: Period }) {
  const [data, setData] = useState<MarketData | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    const res = await fetch(`http://127.0.0.1:8000/market/${period}`, {
      cache: "no-store",
    });
    const json = await res.json();
    setData(json);
    setLoading(false);
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, 30_000); // 30s
    return () => clearInterval(interval);
  }, [period]);

  if (loading || !data) return <p>Cargando datos del mercado...</p>;

  return (
    <>
      <h2 className="text-xl font-semibold mb-2">🔥 Top Movers ({period})</h2>
      <ul className="space-y-2 mb-8">
        {data.top_movers.map((item, i) => (
          <li key={i} className="border p-3 rounded flex justify-between">
            <span>
              <strong>{item.symbol}</strong> – {item.sector}
            </span>
            <span className={getColor(item.returns[period])}>
              {item.returns[period].toFixed(2)}%
            </span>
          </li>
        ))}
      </ul>

      <h2 className="text-xl font-semibold mb-2">💀 Bottom Movers ({period})</h2>
      <ul className="space-y-2 mb-8">
        {data.bottom_movers.map((item, i) => (
          <li key={i} className="border p-3 rounded flex justify-between">
            <span>
              <strong>{item.symbol}</strong> – {item.sector}
            </span>
            <span className={getColor(item.returns[period])}>
              {item.returns[period].toFixed(2)}%
            </span>
          </li>
        ))}
      </ul>

      <h2 className="text-xl font-semibold mb-2">🏭 Sector Ranking ({period})</h2>
      <ul className="space-y-2 mb-10">
        {data.sector_ranking.map((item, i) => (
          <li key={i} className="border p-3 rounded flex justify-between">
            <span>
              {i + 1}. {item.sector} ({item.count} assets)
            </span>
            <span className={getColor(item.avg_return)}>
              {item.avg_return.toFixed(2)}%
            </span>
          </li>
        ))}
      </ul>

      <h2 className="text-xl font-semibold mb-4">🎯 Top by Sector</h2>

      <div className="grid md:grid-cols-2 gap-6">
        {Object.entries(data.top_by_sector).map(([sector, assets]) => (
          <div key={sector} className="border rounded p-4">
            <h3 className="font-semibold mb-2">{sector}</h3>
            <ul className="space-y-1">
              {assets.map((a, i) => (
                <li key={i} className="flex justify-between text-sm">
                  <span>{a.symbol}</span>
                  <span className={getColor(a.return)}>
                    {a.return.toFixed(2)}%
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </>
  );
}

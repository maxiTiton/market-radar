type Period = "daily" | "weekly" | "monthly";

type MarketData = {
  top_movers: any[];
  bottom_movers: any[];
  sector_ranking: any[];
  top_by_sector: Record<string, any[]>;
};

async function getData(period: Period) {
  const res = await fetch(`http://127.0.0.1:8000/market/${period}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Failed to fetch market data");
  }

  return res.json();
}

function getColor(value: number) {
  if (value > 0) return "text-green-400";
  if (value < 0) return "text-red-400";
  return "text-gray-400";
}

export default async function Home({
  searchParams,
}: {
  searchParams?: Promise<{ period?: Period }>;
}) {
  const params = await searchParams;
  const period: Period = params?.period || "daily";

  const data: MarketData = await getData(period);

  return (
    <main className="p-8 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">📈 Market Radar</h1>

      {/* Selector */}
      <div className="flex gap-3 mb-8">
        {(["daily", "weekly", "monthly"] as Period[]).map((p) => (
          <a
            key={p}
            href={`/?period=${p}`}
            className={`px-4 py-2 rounded border ${
              period === p ? "bg-white text-black" : "border-gray-600"
            }`}
          >
            {p.toUpperCase()}
          </a>
        ))}
      </div>

      {/* Top Movers */}
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

      {/* Bottom Movers */}
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

      {/* Sector Ranking */}
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

      {/* Top by Sector */}
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
    </main>
  );
}

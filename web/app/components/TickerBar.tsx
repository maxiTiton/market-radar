"use client";

import { useState, useEffect } from "react";

type Asset = {
  symbol: string;
  sector: string;
  returns: { daily: number | null; weekly: number | null; monthly: number | null };
};

function pct(v: number) {
  return `${v >= 0 ? "+" : ""}${v.toFixed(2)}%`;
}

export default function TickerBar() {
  const [assets, setAssets] = useState<Asset[]>([]);

  useEffect(() => {
    fetch("/api/market/all")
      .then((r) => r.json())
      .then((d) => {
        const valid = (d.assets ?? []).filter(
          (a: Asset) => a.returns.daily !== null && a.returns.daily !== undefined
        );
        const sorted = valid.sort(
          (a: Asset, b: Asset) => Math.abs(b.returns.daily!) - Math.abs(a.returns.daily!)
        );
        setAssets(sorted);
      })
      .catch(() => {});
  }, []);

  if (assets.length === 0) return null;

  const items = [...assets, ...assets];

  return (
    <div className="ticker-wrap">
      <div className="ticker-track">
        {items.map((asset, i) => {
          const val = asset.returns.daily!;
          const isPos = val >= 0;
          return (
            <span key={i} className="ticker-item">
              <span className="ticker-symbol">{asset.symbol}</span>
              <span className={`ticker-val ${isPos ? "pos" : "neg"}`}>
                {isPos ? "▲" : "▼"} {pct(val)}
              </span>
              <span className="ticker-sep">·</span>
            </span>
          );
        })}
      </div>
    </div>
  );
}
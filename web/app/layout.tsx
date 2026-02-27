import type { Metadata } from "next";
import "./globals.css";
import TickerBar from "./components/TickerBar";

export const metadata: Metadata = {
  title: "Market Radar",
  description: "Real-time market movers and sector rankings",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <TickerBar />
        <nav className="top-nav">
          <div className="top-nav-inner">
            <a href="/" className="logo">
              <span className="logo-mark">▲</span>
              <span className="logo-text">
                MARKET<span className="logo-accent">RADAR</span>
              </span>
            </a>
            <div className="nav-links">
              <a href="/" className="nav-link">Dashboard</a>
              <a href="/heatmap" className="nav-link">Heatmap</a>
              <a href="/table" className="nav-link">Table</a>
            </div>
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}
# 📈 Market Radar

Dashboard de mercado financiero en tiempo real con seguimiento de acciones, ETFs, criptomonedas y CEDEARs argentinos.

🔗 **[Ver demo](https://market-radar.vercel.app)**

---

## ¿Qué incluye?

**Dashboard** — Top y bottom movers del día, ranking de sectores y líderes por sector, con selector de período 1D / 1W / 1M.

**Heatmap** — Visualización de todos los activos como tiles coloreados por retorno (rojo → verde), agrupados por sector.

**Tabla comparativa** — Todos los activos en una sola vista con retornos 1D/1W/1M lado a lado, ordenamiento por columna, búsqueda y filtro por sector.

**Fichas de activo** — Al hacer click en cualquier símbolo se abre una página de detalle con gráfico de precio histórico (1M/3M/6M/1Y), estadísticas clave y comparativa vs el sector.

**Watchlist** — Sistema de favoritos persistente por usuario (localStorage) visible en todas las páginas. El dashboard muestra un panel "My Positions" con los retornos de cada favorito.

**Ticker animado** — Barra superior con todos los activos desfilando en tiempo real.

---

## Universo de activos

113 activos entre acciones del S&P 500, ETFs, criptomonedas y CEDEARs que cotizan en el Merval.

---

## Stack tecnológico

**Backend** — Python · FastAPI · yfinance · pandas  
**Frontend** — Next.js 16 · TypeScript · CSS  
**Deploy** — Render (backend) · Vercel (frontend)

---

## Arquitectura

El backend corre un scraper cada 15 minutos que obtiene precios de Yahoo Finance, calcula retornos y guarda los resultados como JSON. La API FastAPI sirve esos JSONs al frontend. Next.js actúa como proxy entre el cliente y la API.

---

## Autor

**Máximo Titón** — [maximo-titon.vercel.app](https://maximo-titon.vercel.app)
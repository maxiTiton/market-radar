# Portfolio Tracker

Sistema de seguimiento de portafolio de inversiones con integración a Google Sheets.

## Estructura del Proyecto

```
portfolio-tracker/
│
├── data/
│   ├── portfolio.csv          # Datos del portafolio
│   └── prices_cache.csv       # Caché de precios
│
├── src/
│   ├── fetch_prices.py        # Obtención de precios de mercado
│   ├── calculations.py        # Cálculos y métricas del portafolio
│   ├── sheets.py              # Integración con Google Sheets
│   └── main.py                # Punto de entrada principal
│
└── README.md
```

## Instalación

```bash
pip install -r requirements.txt
```

## Uso

```bash
python src/main.py
```

## Funcionalidades

- Seguimiento de posiciones en portafolio
- Actualización automática de precios
- Cálculo de ganancias/pérdidas
- Sincronización con Google Sheets


## DIRECTORIOS

data → conocimiento del dominio (CEDEARs, CSVs)
services → lógica externa (precios, dólar, APIs)
utils → helpers
main → orquestador
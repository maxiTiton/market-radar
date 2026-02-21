import pandas as pd
from datetime import timedelta


def calculate_returns(prices):
    # ── DIARIO: último cierre vs cierre anterior ──────────────────────────
    daily = prices.pct_change().iloc[-1] * 100

    # ── SEMANAL: último cierre vs último viernes de la semana anterior ────
    # Busca el precio más cercano al viernes pasado (hasta 4 días atrás por feriados)
    weekly = None
    last_date = prices.index[-1]
    # Día de semana del último dato: 0=lunes ... 4=viernes
    days_since_friday = (last_date.weekday() - 4) % 7
    if days_since_friday == 0:
        days_since_friday = 7  # si hoy es viernes, busca el viernes anterior
    target_friday = last_date - timedelta(days=days_since_friday)

    # Busca el precio en target_friday o el día hábil más cercano anterior
    ref_prices = prices[prices.index <= target_friday]
    if len(ref_prices) > 0:
        weekly = (prices.iloc[-1] / ref_prices.iloc[-1] - 1) * 100

    # ── MENSUAL: último cierre vs último día del mes anterior ─────────────
    monthly = None
    first_of_month = last_date.replace(day=1)
    ref_monthly = prices[prices.index < first_of_month]
    if len(ref_monthly) > 0:
        monthly = (prices.iloc[-1] / ref_monthly.iloc[-1] - 1) * 100
    else:
        # fallback: primer precio del historial disponible
        monthly = (prices.iloc[-1] / prices.iloc[0] - 1) * 100

    return {
        "daily": daily,
        "weekly": weekly,
        "monthly": monthly
    }
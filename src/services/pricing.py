import yfinance as yf

def get_prices(symbol, period="1mo"):
    ticker = yf.Ticker(symbol)
    hist = ticker.history(period=period)

    if hist.empty:
        raise ValueError(f"No hay datos para {symbol}")

    return hist["Close"]


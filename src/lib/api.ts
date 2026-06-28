import type { OHLCV } from './financial';

export async function fetchStockData(
  ticker: string,
  range: string = '1mo',
  interval: string = '1d'
): Promise<OHLCV[]> {
  const url = `https://corsproxy.io/?url=https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=${interval}%26range=${range}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch stock data for ${ticker}: ${response.statusText}`);
  }

  const data = await response.json();
  const result = data?.chart?.result?.[0];

  if (!result || !result.timestamp || !result.indicators?.quote?.[0]) {
    return [];
  }

  const timestamps: number[] = result.timestamp;
  const quote = result.indicators.quote[0];

  const ohlcvData: OHLCV[] = [];

  for (let i = 0; i < timestamps.length; i++) {
    const open = quote.open[i];
    const high = quote.high[i];
    const low = quote.low[i];
    const close = quote.close[i];
    const volume = quote.volume[i];

    if (
      open === null || open === undefined ||
      high === null || high === undefined ||
      low === null || low === undefined ||
      close === null || close === undefined ||
      volume === null || volume === undefined
    ) {
      continue;
    }

    ohlcvData.push({
      date: timestamps[i],
      open,
      high,
      low,
      close,
      volume,
    });
  }

  return ohlcvData;
}

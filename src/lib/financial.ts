export interface OHLCV {
  date?: string | number | Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface SupportResistance {
  support1: number;
  support2: number;
  support3: number;
  resistance1: number;
  resistance2: number;
  resistance3: number;
  pivot: number;
}

/**
 * Calculates standard Pivot Point and Support/Resistance levels based on the previous period's High, Low, and Close.
 *
 * @param high - The highest price of the previous period.
 * @param low - The lowest price of the previous period.
 * @param close - The closing price of the previous period.
 * @returns An object containing the calculated pivot, support, and resistance levels.
 */
export function calculateSupportResistance(high: number, low: number, close: number): SupportResistance {
  const pivot = (high + low + close) / 3;
  const resistance1 = (pivot * 2) - low;
  const support1 = (pivot * 2) - high;
  const resistance2 = pivot + (high - low);
  const support2 = pivot - (high - low);
  const resistance3 = high + 2 * (pivot - low);
  const support3 = low - 2 * (high - pivot);

  return {
    pivot,
    support1,
    support2,
    support3,
    resistance1,
    resistance2,
    resistance3
  };
}

export type BreakoutDirection = 'upward' | 'downward' | 'none';

/**
 * Detects if a price breakout has occurred relative to given support or resistance levels.
 *
 * @param currentPrice - The current price to check for a breakout (often the current Close).
 * @param support - The support level.
 * @param resistance - The resistance level.
 * @returns 'upward' if currentPrice > resistance, 'downward' if currentPrice < support, 'none' otherwise.
 */
export function detectBreakout(currentPrice: number, support: number, resistance: number): BreakoutDirection {
  if (currentPrice > resistance) {
    return 'upward';
  } else if (currentPrice < support) {
    return 'downward';
  }
  return 'none';
}

/**
 * Calculates the Simple Moving Average (SMA) over a specified period.
 *
 * @param data - Array of OHLCV data.
 * @param period - The number of periods to calculate the SMA over.
 * @returns An array of SMA values. The first `period - 1` elements will be null.
 */
export function calculateSMA(data: OHLCV[], period: number): (number | null)[] {
  const sma: (number | null)[] = [];
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      sma.push(null);
    } else {
      let sum = 0;
      for (let j = 0; j < period; j++) {
        sum += data[i - j].close;
      }
      sma.push(sum / period);
    }
  }
  return sma;
}

export type TradingSignal = 'BUY' | 'SELL' | 'HOLD';

/**
 * Provides a simple cyclical buy/sell suggestion based on short-term vs long-term Simple Moving Average (SMA) crossover.
 * A buy signal (Golden Cross) is generated when the short SMA crosses above the long SMA.
 * A sell signal (Death Cross) is generated when the short SMA crosses below the long SMA.
 *
 * @param data - Array of raw OHLCV price data.
 * @param shortPeriod - Period for the short-term SMA (default 5).
 * @param longPeriod - Period for the long-term SMA (default 20).
 * @returns A TradingSignal ('BUY', 'SELL', or 'HOLD') for the most recent data point.
 */
export function getCyclicalSuggestion(data: OHLCV[], shortPeriod: number = 5, longPeriod: number = 20): TradingSignal {
  if (data.length < longPeriod) {
    return 'HOLD';
  }

  const shortSMA = calculateSMA(data, shortPeriod);
  const longSMA = calculateSMA(data, longPeriod);

  const currentIndex = data.length - 1;
  const prevIndex = data.length - 2;

  const currentShort = shortSMA[currentIndex];
  const currentLong = longSMA[currentIndex];
  const prevShort = shortSMA[prevIndex];
  const prevLong = longSMA[prevIndex];

  if (currentShort === null || currentLong === null || prevShort === null || prevLong === null) {
    return 'HOLD';
  }

  if (prevShort <= prevLong && currentShort > currentLong) {
    return 'BUY';
  }

  if (prevShort >= prevLong && currentShort < currentLong) {
    return 'SELL';
  }

  return 'HOLD';
}

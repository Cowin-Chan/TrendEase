import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchStockData } from './api';

const mockYahooResponse = {
  chart: {
    result: [
      {
        timestamp: [1640995200, 1641081600],
        indicators: {
          quote: [
            {
              open: [100.1, 101.5],
              high: [102.3, 104.2],
              low: [99.8, 101.1],
              close: [101.5, 103.8],
              volume: [1000, 1100]
            }
          ]
        }
      }
    ],
    error: null
  }
};

const mockYahooResponseWithNulls = {
  chart: {
    result: [
      {
        timestamp: [1640995200, 1641081600],
        indicators: {
          quote: [
            {
              open: [100.1, null],
              high: [102.3, null],
              low: [99.8, null],
              close: [101.5, null],
              volume: [1000, null]
            }
          ]
        }
      }
    ],
    error: null
  }
};

describe('fetchStockData', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should fetch and format stock data correctly', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockYahooResponse,
    } as Response);

    const result = await fetchStockData('AAPL');

    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://corsproxy.io/?url=https://query1.finance.yahoo.com/v8/finance/chart/AAPL?interval=1d%26range=1mo'
    );
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      date: 1640995200,
      open: 100.1,
      high: 102.3,
      low: 99.8,
      close: 101.5,
      volume: 1000
    });
  });

  it('should filter out data points with null values', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockYahooResponseWithNulls,
    } as Response);

    const result = await fetchStockData('AAPL');

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      date: 1640995200,
      open: 100.1,
      high: 102.3,
      low: 99.8,
      close: 101.5,
      volume: 1000
    });
  });

  it('should return empty array if data is missing', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ chart: { result: [] } }),
    } as Response);

    const result = await fetchStockData('AAPL');
    expect(result).toEqual([]);
  });

  it('should throw an error if fetch fails', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      statusText: 'Not Found',
    } as Response);

    await expect(fetchStockData('INVALID')).rejects.toThrow('Failed to fetch stock data for INVALID: Not Found');
  });
});


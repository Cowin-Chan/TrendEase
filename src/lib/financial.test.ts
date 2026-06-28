// @ts-nocheck
import {
  calculateSupportResistance,
  detectBreakout,
  calculateSMA,
  getCyclicalSuggestion,
  OHLCV
} from './financial';

describe('Financial Module', () => {
  describe('calculateSupportResistance', () => {
    it('calculates standard pivot, support, and resistance correctly', () => {
      // Example values
      const high = 150;
      const low = 100;
      const close = 125;
      const result = calculateSupportResistance(high, low, close);

      expect(result.pivot).toBe(125); // (150 + 100 + 125) / 3
      expect(result.resistance1).toBe(150); // (125 * 2) - 100
      expect(result.support1).toBe(100); // (125 * 2) - 150
      expect(result.resistance2).toBe(175); // 125 + 50
      expect(result.support2).toBe(75); // 125 - 50
      expect(result.resistance3).toBe(175); // 150 + 2 * (125 - 100)
      expect(result.support3).toBe(75); // 100 - 2 * (150 - 125)
    });
  });

  describe('detectBreakout', () => {
    const support = 100;
    const resistance = 150;

    it('returns upward when current price is above resistance', () => {
      expect(detectBreakout(155, support, resistance)).toBe('upward');
    });

    it('returns downward when current price is below support', () => {
      expect(detectBreakout(95, support, resistance)).toBe('downward');
    });

    it('returns none when current price is between support and resistance', () => {
      expect(detectBreakout(125, support, resistance)).toBe('none');
    });
    
    it('returns none when current price exactly hits support or resistance', () => {
      expect(detectBreakout(100, support, resistance)).toBe('none');
      expect(detectBreakout(150, support, resistance)).toBe('none');
    });
  });

  describe('calculateSMA', () => {
    it('calculates SMA correctly', () => {
      const data: OHLCV[] = [
        { open: 1, high: 2, low: 0, close: 10, volume: 100 },
        { open: 1, high: 2, low: 0, close: 20, volume: 100 },
        { open: 1, high: 2, low: 0, close: 30, volume: 100 },
        { open: 1, high: 2, low: 0, close: 40, volume: 100 },
      ];

      const sma = calculateSMA(data, 3);
      expect(sma.length).toBe(4);
      expect(sma[0]).toBeNull();
      expect(sma[1]).toBeNull();
      expect(sma[2]).toBe(20); // (10 + 20 + 30) / 3
      expect(sma[3]).toBe(30); // (20 + 30 + 40) / 3
    });
  });

  describe('getCyclicalSuggestion', () => {
    it('returns HOLD if data length is less than long period', () => {
      const data: OHLCV[] = [{ open: 1, high: 2, low: 0, close: 10, volume: 100 }];
      expect(getCyclicalSuggestion(data, 2, 5)).toBe('HOLD');
    });

    it('generates BUY signal on Golden Cross', () => {
      const data: OHLCV[] = [
        // Long term stays flat at 10, short term starts below 10 and crosses above
        { open: 1, high: 2, low: 0, close: 5, volume: 100 },
        { open: 1, high: 2, low: 0, close: 10, volume: 100 },
        { open: 1, high: 2, low: 0, close: 15, volume: 100 }, // short (2): 12.5, long(3): 10
      ];
      // At index 1: shortSMA(2) = 7.5, longSMA(3) = null -> HOLD
      // Need 4 items to check prev vs current
      const data2: OHLCV[] = [
        { open: 1, high: 2, low: 0, close: 10, volume: 100 },
        { open: 1, high: 2, low: 0, close: 10, volume: 100 }, // short(2)=10, long(3)=null
        { open: 1, high: 2, low: 0, close: 10, volume: 100 }, // short(2)=10, long(3)=10
        { open: 1, high: 2, low: 0, close: 20, volume: 100 }, // short(2)=15, long(3)=13.33 -> BUY
      ];
      expect(getCyclicalSuggestion(data2, 2, 3)).toBe('BUY');
    });

    it('generates SELL signal on Death Cross', () => {
      const data: OHLCV[] = [
        { open: 1, high: 2, low: 0, close: 20, volume: 100 },
        { open: 1, high: 2, low: 0, close: 20, volume: 100 },
        { open: 1, high: 2, low: 0, close: 20, volume: 100 }, // short(2)=20, long(3)=20
        { open: 1, high: 2, low: 0, close: 5, volume: 100 },  // short(2)=12.5, long(3)=15 -> SELL
      ];
      expect(getCyclicalSuggestion(data, 2, 3)).toBe('SELL');
    });
  });
});

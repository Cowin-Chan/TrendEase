// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import App from './App';


vi.mock('lightweight-charts', () => ({
  createChart: () => ({
    addSeries: () => ({
      setData: vi.fn(),
      createPriceLine: vi.fn(),
    }),
    timeScale: () => ({
      fitContent: vi.fn(),
    }),
    applyOptions: vi.fn(),
    remove: vi.fn(),
  }),
  ColorType: { Solid: 'Solid' },
  CandlestickSeries: 'CandlestickSeries',
  LineSeries: 'LineSeries',
}));

vi.mock('./lib/api', () => ({
  fetchStockData: vi.fn().mockResolvedValue([])
}));

describe('App', () => {
  it('renders search bar', () => {
    render(<App />);
    expect(screen.getByPlaceholderText(/Search symbol/i)).toBeTruthy();
  });
});

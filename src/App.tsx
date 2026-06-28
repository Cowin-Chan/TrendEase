import { useEffect, useRef } from 'react';
import { createChart, ColorType } from 'lightweight-charts';
import './App.css';

export default function App() {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#1a1d24' },
        textColor: '#d1d4dc',
      },
      grid: {
        vertLines: { color: 'rgba(42, 46, 57, 0.5)' },
        horzLines: { color: 'rgba(42, 46, 57, 0.5)' },
      },
      width: chartContainerRef.current.clientWidth,
      height: 400,
    });

    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#00ff9d',
      downColor: '#ff006e',
      borderVisible: false,
      wickUpColor: '#00ff9d',
      wickDownColor: '#ff006e',
    });

    // Dummy data for candlestick chart
    candlestickSeries.setData([
      { time: '2026-06-01', open: 100.1, high: 102.3, low: 99.8, close: 101.5 },
      { time: '2026-06-02', open: 101.5, high: 104.2, low: 101.1, close: 103.8 },
      { time: '2026-06-03', open: 103.8, high: 105.0, low: 102.5, close: 102.9 },
      { time: '2026-06-04', open: 102.9, high: 103.2, low: 98.5, close: 99.2 },
      { time: '2026-06-05', open: 99.2, high: 101.0, low: 98.0, close: 100.5 },
      { time: '2026-06-06', open: 100.5, high: 106.0, low: 100.0, close: 105.2 },
      { time: '2026-06-07', open: 105.2, high: 108.5, low: 104.8, close: 108.1 },
      { time: '2026-06-08', open: 108.1, high: 110.0, low: 107.5, close: 109.2 },
      { time: '2026-06-09', open: 109.2, high: 109.5, low: 105.0, close: 106.1 },
      { time: '2026-06-10', open: 106.1, high: 107.0, low: 104.2, close: 106.8 },
      { time: '2026-06-11', open: 106.8, high: 112.5, low: 106.5, close: 111.4 },
      { time: '2026-06-12', open: 111.4, high: 113.2, low: 109.8, close: 110.5 },
      { time: '2026-06-13', open: 110.5, high: 115.0, low: 110.0, close: 114.2 },
      { time: '2026-06-14', open: 114.2, high: 116.5, low: 112.8, close: 115.8 },
    ]);

    chart.timeScale().fitContent();

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, []);

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1 className="logo">Trend<span className="logo-accent">Ease</span></h1>
        <nav className="nav-links">
          <button className="nav-btn active">Markets</button>
          <button className="nav-btn">Portfolio</button>
          <button className="nav-btn">Signals</button>
        </nav>
        <div className="user-profile">
          <div className="avatar"></div>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="chart-section card">
          <div className="chart-header">
            <div className="asset-info">
              <h2>BTC / USD</h2>
              <span className="price">$64,230.00</span>
              <span className="change positive">+2.4%</span>
            </div>
            <div className="chart-controls">
              <button className="control-btn">1D</button>
              <button className="control-btn active">1W</button>
              <button className="control-btn">1M</button>
            </div>
          </div>
          <div className="chart-container" ref={chartContainerRef} />
        </div>

        <div className="side-panel">
          <div className="market-stats card">
            <h3>Market Highlights</h3>
            <ul className="stats-list">
              <li>
                <span>24h Volume</span>
                <strong>$34.2B</strong>
              </li>
              <li>
                <span>Market Cap</span>
                <strong>$1.2T</strong>
              </li>
              <li>
                <span>Dominance</span>
                <strong>52.4%</strong>
              </li>
            </ul>
          </div>

          <div className="recent-signals card">
            <h3>Recent Signals</h3>
            <div className="signal-item buy">
              <div className="signal-icon"></div>
              <div className="signal-details">
                <span className="signal-asset">ETH / USD</span>
                <span className="signal-type">Strong Buy</span>
              </div>
              <span className="signal-time">2m ago</span>
            </div>
            <div className="signal-item sell">
              <div className="signal-icon"></div>
              <div className="signal-details">
                <span className="signal-asset">SOL / USD</span>
                <span className="signal-type">Sell</span>
              </div>
              <span className="signal-time">15m ago</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

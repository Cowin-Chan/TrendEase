import { useEffect, useRef, useState, type FormEvent } from 'react';
import { createChart, ColorType, CandlestickSeries, LineSeries, type Time } from 'lightweight-charts';
import { calculateSupportResistance, getCyclicalSuggestion, type OHLCV, calculateSMA, type TradingSignal } from './lib/financial';
import { fetchStockData } from './lib/api';
import './App.css';

type Timeframe = '1D' | '1W' | '1M';

export default function App() {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [signal, setSignal] = useState<TradingSignal>('HOLD');
  const [ticker, setTicker] = useState('AAPL');
  const [searchInput, setSearchInput] = useState('AAPL');
  const [timeframe, setTimeframe] = useState<Timeframe>('1M');
  const [ohlcvData, setOhlcvData] = useState<OHLCV[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let range = '1mo';
    let interval = '1d';
    if (timeframe === '1D') {
      range = '1d';
      interval = '5m';
    } else if (timeframe === '1W') {
      range = '5d';
      interval = '15m';
    } else if (timeframe === '1M') {
      range = '1mo';
      interval = '1d';
    }

    setIsLoading(true);
    fetchStockData(ticker, range, interval)
      .then((data) => {
        setOhlcvData(data);
      })
      .catch((err) => {
        console.error(err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [ticker, timeframe]);

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

    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#00ff9d',
      downColor: '#ff006e',
      borderVisible: false,
      wickUpColor: '#00ff9d',
      wickDownColor: '#ff006e',
    });

    const formattedData = ohlcvData.map(d => ({
      time: d.date as Time,
      open: d.open,
      high: d.high,
      low: d.low,
      close: d.close,
    }));
    
    candlestickSeries.setData(formattedData);

    if (ohlcvData.length >= 2) {
      const prevCandle = ohlcvData[ohlcvData.length - 2];
      const sr = calculateSupportResistance(prevCandle.high, prevCandle.low, prevCandle.close);

      candlestickSeries.createPriceLine({
        price: sr.resistance1,
        color: '#ff006e',
        lineWidth: 2,
        lineStyle: 2,
        axisLabelVisible: true,
        title: 'R1',
      });
      
      candlestickSeries.createPriceLine({
        price: sr.support1,
        color: '#00ff9d',
        lineWidth: 2,
        lineStyle: 2,
        axisLabelVisible: true,
        title: 'S1',
      });
    }

    const shortSMAValues = calculateSMA(ohlcvData, 3);
    const longSMAValues = calculateSMA(ohlcvData, 7);

    const shortSMASeries = chart.addSeries(LineSeries, {
      color: '#2962FF',
      lineWidth: 2,
      title: 'SMA(3)',
    });

    const longSMASeries = chart.addSeries(LineSeries, {
      color: '#FF6D00',
      lineWidth: 2,
      title: 'SMA(7)',
    });

    const shortSMAData = shortSMAValues
      .map((val, idx) => ({ time: ohlcvData[idx].date as Time, value: val }))
      .filter((d): d is { time: Time; value: number } => d.value !== null);

    const longSMAData = longSMAValues
      .map((val, idx) => ({ time: ohlcvData[idx].date as Time, value: val }))
      .filter((d): d is { time: Time; value: number } => d.value !== null);

    if (shortSMAData.length > 0) shortSMASeries.setData(shortSMAData);
    if (longSMAData.length > 0) longSMASeries.setData(longSMAData);

    const currentSignal = getCyclicalSuggestion(ohlcvData, 3, 7);
    setSignal(currentSignal);

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
  }, [ohlcvData]);

  const handleSearchSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      setTicker(searchInput.toUpperCase().trim());
    }
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1 className="logo">Trend<span className="logo-accent">Ease</span></h1>
        
        <form className="search-container" onSubmit={handleSearchSubmit}>
          <span className="search-icon">🔍</span>
          <input 
            type="text" 
            className="search-input"
            placeholder="Search symbol (e.g. AAPL)" 
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </form>

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
              <h2>{ticker} / USD</h2>
              {ohlcvData.length > 0 ? (
                <>
                  <span className="price">$\{ohlcvData[ohlcvData.length - 1].close.toFixed(2)}</span>
                  <span className={`change ${ohlcvData[ohlcvData.length - 1].close >= ohlcvData[ohlcvData.length - 1].open ? 'positive' : 'negative'}`}>
                    {((ohlcvData[ohlcvData.length - 1].close - ohlcvData[ohlcvData.length - 1].open) / ohlcvData[ohlcvData.length - 1].open * 100).toFixed(2)}%
                  </span>
                </>
              ) : (
                <span className="price">{isLoading ? 'Loading...' : 'No Data'}</span>
              )}
            </div>
            <div className="chart-controls">
              <button className={`control-btn ${timeframe === '1D' ? 'active' : ''}`} onClick={() => setTimeframe('1D')}>1D</button>
              <button className={`control-btn ${timeframe === '1W' ? 'active' : ''}`} onClick={() => setTimeframe('1W')}>1W</button>
              <button className={`control-btn ${timeframe === '1M' ? 'active' : ''}`} onClick={() => setTimeframe('1M')}>1M</button>
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
            <div className={`signal-item ${signal.toLowerCase() === 'buy' ? 'buy' : signal.toLowerCase() === 'sell' ? 'sell' : 'hold'}`}>
              <div className="signal-icon"></div>
              <div className="signal-details">
                <span className="signal-asset">{ticker} (Auto)</span>
                <span className="signal-type">{signal === 'BUY' ? 'Strong Buy' : signal === 'SELL' ? 'Sell' : 'Hold'}</span>
              </div>
              <span className="signal-time">Just now</span>
            </div>
            <div className="signal-item buy">
              <div className="signal-icon"></div>
              <div className="signal-details">
                <span className="signal-asset">ETH / USD</span>
                <span className="signal-type">Strong Buy</span>
              </div>
              <span className="signal-time">2m ago</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

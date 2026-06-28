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
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const formatVolume = (vol: number) => {
    if (vol >= 1e9) return (vol / 1e9).toFixed(2) + 'B';
    if (vol >= 1e6) return (vol / 1e6).toFixed(2) + 'M';
    if (vol >= 1e3) return (vol / 1e3).toFixed(2) + 'K';
    return vol.toString();
  };

  const periodHigh = ohlcvData.length > 0 ? Math.max(...ohlcvData.map(d => d.high)).toFixed(2) : 'N/A';
  const periodLow = ohlcvData.length > 0 ? Math.min(...ohlcvData.map(d => d.low)).toFixed(2) : 'N/A';
  const totalVolume = ohlcvData.length > 0 
    ? formatVolume(ohlcvData.reduce((acc, curr) => acc + curr.volume, 0))
    : 'N/A';

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
    setErrorMsg(null);
    fetchStockData(ticker, range, interval)
      .then((data) => {
        setOhlcvData(data);
      })
      .catch((err) => {
        console.error(err);
        setErrorMsg(err.message || 'Failed to fetch data');
        setOhlcvData([]);
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

    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        chart.applyOptions({ width: entry.contentRect.width });
      }
    });

    if (chartContainerRef.current) {
      resizeObserver.observe(chartContainerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
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
                  <span className="price">${ohlcvData[ohlcvData.length - 1].close.toFixed(2)}</span>
                  <span className={`change ${ohlcvData[ohlcvData.length - 1].close >= ohlcvData[0].open ? 'positive' : 'negative'}`}>
                    {((ohlcvData[ohlcvData.length - 1].close - ohlcvData[0].open) / ohlcvData[0].open * 100).toFixed(2)}%
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
          {errorMsg ? (
            <div className="error-message-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '400px', color: '#ff006e' }}>
              <h3>{errorMsg}</h3>
            </div>
          ) : (
            <div className="chart-container" ref={chartContainerRef} />
          )}
        </div>

        <div className="side-panel">
          <div className="market-stats card">
            <h3>Market Highlights</h3>
            <ul className="stats-list">
              <li>
                <span>Period High</span>
                <strong>${periodHigh}</strong>
              </li>
              <li>
                <span>Period Low</span>
                <strong>${periodLow}</strong>
              </li>
              <li>
                <span>Total Volume</span>
                <strong>{totalVolume}</strong>
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
          </div>

          <div className="legend-guide card">
            <h3>Legend & Guide</h3>
            <div style={{ fontSize: '0.85em', color: '#a0a5b1', marginTop: '15px', lineHeight: '1.5' }}>
              <p style={{ marginBottom: '12px' }}>
                <strong style={{ color: '#2962FF' }}>SMA(3)</strong> & <strong style={{ color: '#FF6D00' }}>SMA(7)</strong>: 
                These are short and long-term price averages. <br/>
                <strong style={{ color: '#fff' }}>Decision:</strong> When the blue SMA(3) crosses <em>above</em> the orange SMA(7), momentum is shifting upwards (<strong>Buy Signal</strong>). When it crosses <em>below</em>, momentum is shifting downwards (<strong>Sell Signal</strong>).
              </p>
              <p style={{ marginBottom: '12px' }}>
                <strong style={{ color: '#00ff9d' }}>S1 (Support)</strong>: 
                A short-term price "floor" projected from recent trading data. <br/>
                <strong style={{ color: '#fff' }}>Decision:</strong> Prices often bounce up from this line, making it a potentially safe zone to <strong>Buy</strong>.
              </p>
              <p>
                <strong style={{ color: '#ff006e' }}>R1 (Resistance)</strong>: 
                A short-term price "ceiling" projected from recent trading data. <br/>
                <strong style={{ color: '#fff' }}>Decision:</strong> Prices often struggle to break above this line, making it a good target to <strong>Sell / Take Profits</strong>.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

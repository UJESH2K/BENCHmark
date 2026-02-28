import React, { useMemo, useRef, useCallback } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement, LineElement,
  Tooltip, Legend, Filler,
} from 'chart.js';
import { motion } from 'framer-motion';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler);

/* ── custom plugin: draw buy/sell triangles on the chart ──────────── */
const tradeMarkerPlugin = {
  id: 'tradeMarkers',
  afterDatasetsDraw(chart) {
    const meta = chart?.config?._config?.options?._tradeMarkers;
    if (!meta?.length) return;
    const ctx = chart.ctx;
    const xScale = chart.scales.x;
    const yScale = chart.scales.yFighters;
    if (!xScale || !yScale) return;

    for (const m of meta) {
      const xPx = xScale.getPixelForValue(m.tick - 1);
      const yPx = yScale.getPixelForValue(m.value);
      if (isNaN(xPx) || isNaN(yPx)) continue;

      ctx.save();
      const isBuy = m.type === 'buy' || m.type === 'cover';
      ctx.fillStyle = isBuy ? '#22c55e' : m.type === 'short' ? '#f59e0b' : '#ef4444';
      ctx.globalAlpha = 0.85;

      const s = 5;
      ctx.beginPath();
      if (isBuy) {
        ctx.moveTo(xPx, yPx - s - 2);
        ctx.lineTo(xPx - s, yPx + s - 2);
        ctx.lineTo(xPx + s, yPx + s - 2);
      } else {
        ctx.moveTo(xPx, yPx + s + 2);
        ctx.lineTo(xPx - s, yPx - s + 2);
        ctx.lineTo(xPx + s, yPx - s + 2);
      }
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  },
};

ChartJS.register(tradeMarkerPlugin);

/* ── helper: build a vertical gradient for BNB price area fill ───── */
function makePriceGradient(ctx, chartArea, topColor, bottomColor) {
  if (!chartArea) return topColor;
  const g = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
  g.addColorStop(0, topColor);
  g.addColorStop(1, bottomColor);
  return g;
}

/* ====================================================================
   ArenaPortfolioChart — smooth BNB price (main) + thin fighter lines
   ==================================================================== */
export const ArenaPortfolioChart = ({ portfolios, priceHistory, fullscreen }) => {
  const chartRef = useRef(null);
  const entries  = Object.entries(portfolios || {});
  if (!entries.length) return null;

  const maxLen = Math.max(...entries.map(([, v]) => v.history?.length || 0));
  if (maxLen < 2) return null;

  const labels = Array.from({ length: maxLen }, (_, i) => i + 1);

  /* ── build datasets + trade markers ────────────────────────────── */
  const { datasets, tradeMarkers } = useMemo(() => {
    const ds = [];
    const markers = [];

    /* --- BNB price: main dataset with gradient fill --- */
    if (priceHistory?.length > 1) {
      const priceSlice = priceHistory.slice(-maxLen);
      ds.push({
        label: 'BNB Price',
        data: priceSlice,
        borderColor: '#f0b90b',
        borderWidth: 2.5,
        pointRadius: 0,
        pointHoverRadius: 4,
        pointHoverBackgroundColor: '#f0b90b',
        tension: 0.45,            // smooth curve
        fill: true,
        backgroundColor: (context) => {
          const chart = context.chart;
          const { ctx, chartArea } = chart;
          return makePriceGradient(ctx, chartArea, 'rgba(240,185,11,0.25)', 'rgba(240,185,11,0.01)');
        },
        yAxisID: 'yPrice',
        order: 10,                // draw behind fighter lines
      });
    }

    /* --- Fighter portfolio lines: thin, no fill --- */
    let fighterIdx = 0;
    for (const [wallet, { name, color, history, trades }] of entries) {
      const c = color || '#8b5cf6';
      const displayName = name || `Agent ${String.fromCharCode(65 + fighterIdx)}`;
      const values = (history || []).map(h => h.value);

      ds.push({
        label: displayName,
        data: values,
        borderColor: c,
        borderWidth: 1.8,
        pointRadius: 0,
        pointHoverRadius: 3,
        pointHoverBackgroundColor: c,
        tension: 0.45,            // smooth curve
        fill: false,              // NO area fill for fighters
        yAxisID: 'yFighters',
        order: 1,                 // draw on top
      });

      // build trade markers
      if (trades?.length) {
        const historyTicks = (history || []).map(h => h.tick);
        for (const t of trades) {
          const idx = historyTicks.indexOf(t.tick);
          if (idx >= 0 && values[idx] !== undefined) {
            markers.push({
              tick: idx + 1,
              value: values[idx],
              type: t.type,
              fighter: displayName,
              color: c,
            });
          }
        }
      }
      fighterIdx++;
    }

    return { datasets: ds, tradeMarkers: markers };
  }, [entries, priceHistory, maxLen]);

  /* ── compute stable y-axis bounds to prevent jitter ──────────── */
  const { priceMin, priceMax, fighterMin, fighterMax } = useMemo(() => {
    let pMin = Infinity, pMax = -Infinity;
    let fMin = Infinity, fMax = -Infinity;

    if (priceHistory?.length > 1) {
      const slice = priceHistory.slice(-maxLen);
      for (const v of slice) {
        if (v < pMin) pMin = v;
        if (v > pMax) pMax = v;
      }
    }
    for (const [, { history }] of entries) {
      for (const h of (history || [])) {
        const v = h.value;
        if (v < fMin) fMin = v;
        if (v > fMax) fMax = v;
      }
    }
    // Add 2% padding so axis doesn't jump on tiny changes
    const pPad = (pMax - pMin) * 0.02 || 1;
    const fPad = (fMax - fMin) * 0.02 || 50;
    return {
      priceMin:   isFinite(pMin) ? pMin - pPad : undefined,
      priceMax:   isFinite(pMax) ? pMax + pPad : undefined,
      fighterMin: isFinite(fMin) ? fMin - fPad : undefined,
      fighterMax: isFinite(fMax) ? fMax + fPad : undefined,
    };
  }, [entries, priceHistory, maxLen]);

  const chartData = { labels, datasets };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,               // ← no animation on data updates (kills jitter)
    transitions: {                   // only animate the very first draw
      active: { animation: { duration: 0 } },
    },
    interaction: { mode: 'index', intersect: false },
    _tradeMarkers: tradeMarkers,
    elements: {
      line: { capBezierPoints: true },
    },
    plugins: {
      legend: {
        labels: {
          color: '#aaa',
          font: { size: 11 },
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 16,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(15,15,30,0.95)',
        titleColor: '#fff',
        bodyColor: '#ccc',
        borderColor: '#333',
        borderWidth: 1,
        cornerRadius: 8,
        padding: 10,
        callbacks: {
          label: (ctx) => {
            const v = ctx.parsed.y;
            if (ctx.dataset.yAxisID === 'yPrice')
              return `  ${ctx.dataset.label}: $${v.toFixed(2)}`;
            return `  ${ctx.dataset.label}: $${v.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
          },
          afterBody: (ctxItems) => {
            const tick = ctxItems[0]?.dataIndex + 1;
            const matching = tradeMarkers.filter(m => m.tick === tick);
            if (!matching.length) return '';
            return '\n' + matching.map(m => {
              const tag = m.type === 'buy' ? '▲ BUY' : m.type === 'cover' ? '▲ COVER' : m.type === 'short' ? '▼ SHORT' : '▼ SELL';
              return `  ${tag}  ${m.fighter}`;
            }).join('\n');
          },
        },
      },
    },
    scales: {
      x: {
        ticks: { color: '#444', font: { size: 10 }, maxTicksLimit: 15, autoSkip: true },
        grid: { color: 'rgba(255,255,255,0.03)' },
        border: { color: 'rgba(255,255,255,0.06)' },
      },
      yPrice: {
        position: 'right',
        suggestedMin: priceMin,
        suggestedMax: priceMax,
        ticks: {
          color: '#f0b90b',
          font: { size: 10 },
          callback: v => '$' + v.toFixed(2),
          maxTicksLimit: 6,
        },
        grid: { color: 'rgba(240,185,11,0.06)' },
        border: { display: false },
        title: { display: true, text: 'BNB Price', color: '#f0b90b88', font: { size: 10 } },
      },
      yFighters: {
        position: 'left',
        suggestedMin: fighterMin,
        suggestedMax: fighterMax,
        ticks: {
          color: '#888',
          font: { size: 10 },
          callback: v => '$' + v.toLocaleString(),
          maxTicksLimit: 6,
        },
        grid: { color: 'rgba(255,255,255,0.03)' },
        border: { display: false },
        title: { display: true, text: 'Portfolio Value', color: '#88888888', font: { size: 10 } },
      },
    },
  };

  const chartHeight = fullscreen ? 'h-[500px]' : 'h-[360px]';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="bg-dark/80 rounded-2xl border border-gray-700/50 p-5"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold">Portfolio Performance</h3>
        <div className="flex gap-4 text-[10px] text-gray-500">
          <span className="flex items-center gap-1">
            <span className="inline-block w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-b-[6px] border-b-green-500" />
            Buy
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[6px] border-t-red-500" />
            Sell
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[6px] border-t-amber-500" />
            Short
          </span>
        </div>
      </div>
      <div className={chartHeight}>
        <Line ref={chartRef} data={chartData} options={options} />
      </div>
    </motion.div>
  );
};

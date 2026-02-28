import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { motion } from 'framer-motion';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler);

/* ─── Portfolio Value Comparison ───────────────────────────────────── */

export const PortfolioChart = ({ agents }) => {
  // agents: [{ model, portfolioHistory: [{time, value}] }]
  if (!agents?.length || agents.every(a => a.portfolioHistory.length < 2)) return null;

  const maxLen = Math.max(...agents.map(a => a.portfolioHistory.length));
  const labels = agents[0].portfolioHistory.map((_, i) => i + 1);

  const datasets = agents.map((a) => ({
    label: a.model.name,
    data: a.portfolioHistory.map(h => h.value),
    borderColor: a.model.color || '#fff',
    backgroundColor: (a.model.color || '#fff') + '18',
    tension: 0.3,
    pointRadius: 0,
    borderWidth: 2.5,
    fill: false,
  }));

  const data = { labels, datasets };

  const options = {
    responsive: true,
    interaction: { mode: 'index', intersect: false },
    scales: {
      x: {
        title: { display: true, text: 'Tick', color: '#888' },
        ticks: { color: '#888', maxTicksLimit: 20 },
        grid: { color: 'rgba(255,255,255,0.04)' },
      },
      y: {
        title: { display: true, text: 'Portfolio ($)', color: '#888' },
        ticks: { color: '#888', callback: v => '$' + v.toFixed(0) },
        grid: { color: 'rgba(255,255,255,0.04)' },
      },
    },
    plugins: {
      legend: { labels: { color: '#ccc', usePointStyle: true, pointStyle: 'circle' } },
      tooltip: {
        callbacks: { label: ctx => `${ctx.dataset.label}: $${ctx.parsed.y.toFixed(2)}` },
      },
    },
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-6">
      <h3 className="text-lg font-bold text-white mb-4">📈 Portfolio Value</h3>
      <Line data={data} options={options} />
    </motion.div>
  );
};

/* ─── BNB Price with Signal Markers ────────────────────────────────── */

export const PriceSignalChart = ({ priceHistory, agents }) => {
  if (!priceHistory || priceHistory.length < 2) return null;

  const labels = priceHistory.map((_, i) => i + 1);

  // Price line
  const datasets = [
    {
      label: 'BNB Price',
      data: priceHistory,
      borderColor: '#f0b90b',
      backgroundColor: 'rgba(240,185,16,0.08)',
      tension: 0.3,
      borderWidth: 2,
      pointRadius: 0,
      fill: true,
      yAxisID: 'y',
    },
  ];

  // Add buy/sell markers per agent
  agents.forEach((a) => {
    const buyPts  = new Array(priceHistory.length).fill(null);
    const sellPts = new Array(priceHistory.length).fill(null);

    a.signals.forEach((sig, i) => {
      if (i < priceHistory.length) {
        if (sig === 'buy')  buyPts[i]  = priceHistory[i];
        if (sig === 'sell') sellPts[i] = priceHistory[i];
      }
    });

    datasets.push({
      label: `${a.model.name} Buy`,
      data: buyPts,
      borderColor: a.model.color || '#0f0',
      backgroundColor: a.model.color || '#0f0',
      pointRadius: 5,
      pointStyle: 'triangle',
      showLine: false,
      yAxisID: 'y',
    });
    datasets.push({
      label: `${a.model.name} Sell`,
      data: sellPts,
      borderColor: '#ef4444',
      backgroundColor: '#ef4444',
      pointRadius: 5,
      pointStyle: 'crossRot',
      showLine: false,
      yAxisID: 'y',
    });
  });

  const options = {
    responsive: true,
    interaction: { mode: 'index', intersect: false },
    scales: {
      x: {
        ticks: { color: '#888', maxTicksLimit: 20 },
        grid: { color: 'rgba(255,255,255,0.04)' },
      },
      y: {
        ticks: { color: '#f0b90b', callback: v => '$' + v.toFixed(2) },
        grid: { color: 'rgba(255,255,255,0.04)' },
      },
    },
    plugins: {
      legend: { labels: { color: '#ccc', usePointStyle: true, font: { size: 10 } } },
    },
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-6">
      <h3 className="text-lg font-bold text-white mb-4">💹 BNB Price &amp; Signals</h3>
      <Line data={{ labels, datasets }} options={options} />
    </motion.div>
  );
};

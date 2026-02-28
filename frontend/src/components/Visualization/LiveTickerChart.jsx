import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

export const LiveTickerChart = ({ title, dataPoints }) => {
  // dataPoints: [{time: Date, price: number}]
  const labels = dataPoints.map(d => new Date(d.time).toLocaleTimeString());
  const prices = dataPoints.map(d => d.price);

  const chartData = {
    labels,
    datasets: [
      {
        label: title || 'Price',
        data: prices,
        borderColor: '#f0b90b',
        backgroundColor: 'rgba(240,185,16,0.2)',
        tension: 0.3,
      }
    ]
  };

  const options = {
    scales: {
      x: {
        ticks: { color: '#ccc' }
      },
      y: {
        ticks: { color: '#ccc' }
      }
    },
    plugins: {
      legend: { display: false }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-6"
    >
      <h3 className="text-lg font-bold text-white mb-2">{title || 'Live Price'}</h3>
      <Line data={chartData} options={options} />
    </motion.div>
  );
};

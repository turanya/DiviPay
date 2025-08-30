import React, { useEffect, useRef } from 'react';

declare const Chart: any;

interface PieChartProps {
  data: number[];
  labels: string[];
}

const PieChart: React.FC<PieChartProps> = ({ data, labels }) => {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<any>(null);

  useEffect(() => {
    if (!chartRef.current) return;
    const ctx = chartRef.current.getContext('2d');
    if (!ctx) return;

    // Destroy previous chart instance if it exists
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }
    
    const labelColor = 'rgba(255, 255, 255, 0.8)';
    const borderColor = 'rgba(255, 255, 255, 0.1)';

    chartInstance.current = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          label: 'Expenses',
          data: data,
          backgroundColor: [
            'rgba(32, 201, 151, 0.8)',
            'rgba(44, 83, 100, 0.8)',
            'rgba(15, 32, 39, 0.8)',
            'rgba(107, 114, 128, 0.8)',
            'rgba(27, 171, 130, 0.8)',
            'rgba(60, 100, 120, 0.8)',
          ],
          borderColor: borderColor,
          borderWidth: 1,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
                color: labelColor,
                font: {
                    family: "'Poppins', sans-serif"
                }
            }
          }
        }
      }
    });

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [data, labels]);

  return <canvas ref={chartRef}></canvas>;
};

export default PieChart;
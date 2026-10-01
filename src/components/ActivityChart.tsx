'use client';

import { useState } from 'react';
import { TrendingUp } from 'lucide-react';

interface ActivityChartProps {
  data: { date: string; displayDate: string; count: number }[];
}

export default function ActivityChart({ data }: ActivityChartProps) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  if (!data || data.length === 0) return null;

  const maxCount = Math.max(...data.map((d) => d.count), 4);
  const chartHeight = 130;
  const chartWidth = 520;
  const paddingX = 25;
  const paddingY = 20;

  const innerWidth = chartWidth - paddingX * 2;
  const innerHeight = chartHeight - paddingY * 2;

  // Calculate coordinates for each of the 30 points
  const points = data.map((item, idx) => {
    const x = paddingX + (idx / (data.length - 1)) * innerWidth;
    const y = chartHeight - paddingY - (item.count / maxCount) * innerHeight;
    return { x, y, ...item };
  });

  // Build smooth bezier curve path
  const linePath = points.reduce((acc, point, i, arr) => {
    if (i === 0) return `M ${point.x} ${point.y}`;
    const prev = arr[i - 1];
    const cx = (prev.x + point.x) / 2;
    return `${acc} C ${cx} ${prev.y}, ${cx} ${point.y}, ${point.x} ${point.y}`;
  }, '');

  // Fill path closing at bottom
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${chartHeight - paddingY} L ${points[0].x} ${chartHeight - paddingY} Z`;

  const hoveredPoint = hoverIndex !== null ? points[hoverIndex] : null;

  // Select 6 evenly spaced labels for X axis
  const labelIndices = [0, 6, 12, 18, 24, 29];

  return (
    <div className="card p-5">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border pb-3 mb-3">
        <div>
          <div className="flex items-center gap-1.5">
            <TrendingUp size={16} className="text-[#8B6F47]" />
            <h3 className="text-sm font-bold text-text">Revision Activity</h3>
          </div>
          <p className="text-xs text-text-muted mt-0.5">
            Completed revisions over the last 30 days
          </p>
        </div>

        <span className="rounded bg-surface-secondary border border-border px-2 py-0.5 text-xs font-semibold text-text-secondary">
          Last 30 days
        </span>
      </div>

      {/* SVG Chart */}
      <div className="relative pt-2">
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="w-full h-auto overflow-visible select-none"
        >
          <defs>
            <linearGradient id="warmBeigeFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8B6F47" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#8B6F47" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0, 0.33, 0.66, 1].map((ratio) => {
            const y = chartHeight - paddingY - ratio * innerHeight;
            return (
              <line
                key={ratio}
                x1={paddingX}
                y1={y}
                x2={chartWidth - paddingX}
                y2={y}
                stroke="#E8E1D7"
                strokeWidth="1"
                strokeDasharray="3 3"
              />
            );
          })}

          {/* Area Fill */}
          <path d={areaPath} fill="url(#warmBeigeFill)" />

          {/* Main Stroke Line */}
          <path
            d={linePath}
            fill="none"
            stroke="#8B6F47"
            strokeWidth="2.25"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data Points */}
          {points.map((p, idx) => (
            <circle
              key={idx}
              cx={p.x}
              cy={p.y}
              r={hoverIndex === idx ? 4.5 : 2}
              fill={hoverIndex === idx ? '#5F4930' : '#8B6F47'}
              stroke="#FFFDF9"
              strokeWidth="1.5"
              className="transition-all cursor-pointer"
              onMouseEnter={() => setHoverIndex(idx)}
              onMouseLeave={() => setHoverIndex(null)}
            />
          ))}

          {/* Active Hover Marker */}
          {hoveredPoint && (
            <g>
              <line
                x1={hoveredPoint.x}
                y1={paddingY}
                x2={hoveredPoint.x}
                y2={chartHeight - paddingY}
                stroke="#8B6F47"
                strokeWidth="1"
                strokeDasharray="2 2"
              />
              <circle
                cx={hoveredPoint.x}
                cy={hoveredPoint.y}
                r="5"
                fill="#5F4930"
                stroke="#FFFDF9"
                strokeWidth="2"
              />
            </g>
          )}
        </svg>

        {/* Floating Tooltip */}
        {hoveredPoint && (
          <div
            className="absolute -top-3 z-20 pointer-events-none -translate-x-1/2 rounded bg-[#2F2922] px-2.5 py-1 text-center text-xs text-white shadow-md animate-in fade-in zoom-in-95"
            style={{
              left: `${(hoveredPoint.x / chartWidth) * 100}%`,
            }}
          >
            <p className="font-bold text-[0.6875rem]">{hoveredPoint.displayDate}</p>
            <p className="text-[0.625rem] text-[#D8C5AA]">
              {hoveredPoint.count} revision{hoveredPoint.count !== 1 ? 's' : ''}
            </p>
          </div>
        )}

        {/* X-axis date labels */}
        <div className="flex justify-between px-3 pt-1 text-[0.6875rem] font-semibold text-text-muted">
          {labelIndices.map((i) => (
            <span key={i}>{data[i]?.displayDate}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

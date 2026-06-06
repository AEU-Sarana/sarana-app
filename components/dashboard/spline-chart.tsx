'use client';

import React, { useState } from 'react';

export interface YTick {
  label: string;
  value: number;
}

export interface SplineChartProps {
  title: string;
  subtitle: string;
  badgeText: string;
  badgeAccentColor: 'emerald' | 'sky';
  labels: string[];
  values: number[];
  maxValue: number;
  yTicks: YTick[];
  peakLabelFormatter: (value: number) => string;
  lineColor: string;
  areaGradientId: string;
  areaGradientColor: string;
  valueFormatter?: (value: number) => string;
  displayValueThreshold?: number;
  fillClassName?: string;
}

export default function SplineChart({
  title,
  subtitle,
  badgeText,
  badgeAccentColor,
  labels,
  values,
  maxValue,
  yTicks,
  peakLabelFormatter,
  lineColor,
  areaGradientId,
  areaGradientColor,
  valueFormatter,
  displayValueThreshold,
  fillClassName = 'fill-emerald-500 dark:fill-emerald-400',
}: SplineChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [isChartHovered, setIsChartHovered] = useState(false);

  const leftPadding = 58;
  const gridWidth = 902; 
  const gridHeight = 270;
  const gridBottom = 330;
  const topPad = 50;

  const points = labels.map((label, i) => {
    const x = leftPadding + i * (gridWidth / (labels.length - 1));
    const v = values[i] || 0;
    const y = gridBottom - (v / maxValue) * gridHeight;
    return { x, y, value: v, label };
  });

  const linePath = (() => {
    if (points.length === 0) return '';
    let d = `M ${points[0].x},${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const cpx = (prev.x + curr.x) / 2;
      d += ` C ${cpx},${prev.y} ${cpx},${curr.y} ${curr.x},${curr.y}`;
    }
    return d;
  })();

  const last = points[points.length - 1];
  const first = points[0];
  const areaPath = linePath ? `${linePath} L ${last.x},${gridBottom} L ${first.x},${gridBottom} Z` : '';

  const computedYTicks = yTicks.map((tick) => ({
    label: tick.label,
    y: gridBottom - (tick.value / maxValue) * gridHeight,
  }));

  const peakIdx = values.indexOf(Math.max(...values));
  const activeIdx = hoveredIndex !== null ? hoveredIndex : peakIdx;
  const activePoint = points[activeIdx];

  const badgeColorMap = {
    emerald: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/10',
    sky: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/10',
  };

  return (
    <div className="bg-card border border-border/40 rounded-3xl p-6 shadow-sm flex flex-col space-y-4 select-none h-full">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-base font-black text-foreground tracking-tight">{title}</h2>
          <p className="text-[10px] font-bold text-foreground/45 uppercase tracking-widest mt-0.5">{subtitle}</p>
        </div>
        <span className={`px-3 py-1 border rounded-full text-[10px] font-black uppercase tracking-wide ${badgeColorMap[badgeAccentColor]}`}>
          {badgeText}
        </span>
      </div>

      <div className="w-full overflow-x-auto">
        <div 
          className="min-w-[500px] w-full"
          onMouseEnter={() => setIsChartHovered(true)}
          onMouseLeave={() => {
            setIsChartHovered(false);
            setHoveredIndex(null);
          }}
        >
          <svg viewBox="0 0 1000 390" width="100%" height="100%" className="overflow-visible">
            <defs>
              <linearGradient id={areaGradientId} x1="0" y1="0" x2="0" y2="1">
                <stop 
                  offset="0%" 
                  stopColor={areaGradientColor} 
                  stopOpacity={isChartHovered ? 0.25 : 0.18} 
                  style={{ transition: 'stop-opacity 0.3s ease' }} 
                />
                <stop offset="100%" stopColor={areaGradientColor} stopOpacity="0.00" />
              </linearGradient>
            </defs>

            {/* Y-axis grid lines + Labels */}
            {computedYTicks.map((tick) => (
              <g key={tick.label}>
                <line
                  x1={leftPadding} y1={tick.y} x2="960" y2={tick.y}
                  stroke="currentColor" strokeWidth="1"
                  className="text-foreground/10"
                />
                <text
                  x={leftPadding - 8} y={tick.y + 4}
                  textAnchor="end"
                  className="text-[11px] font-bold fill-foreground/40 select-none"
                >
                  {tick.label}
                </text>
              </g>
            ))}

            {/* Active guide line (hovered point or defaults to peak month/hour) */}
            {activePoint && (
              <line
                x1={activePoint.x} y1={topPad} x2={activePoint.x} y2={gridBottom}
                stroke={lineColor} strokeWidth="1.5" strokeDasharray="4 4"
                className="opacity-40 transition-all duration-300 ease-out"
              />
            )}

            {/* Gradient area fill */}
            {areaPath && <path d={areaPath} fill={`url(#${areaGradientId})`} />}

            {/* Smooth spline curve */}
            {linePath && (
              <path
                d={linePath}
                fill="none"
                stroke={lineColor}
                strokeWidth={isChartHovered ? "3.5" : "3"}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="transition-[stroke-width] duration-300 ease-out"
              />
            )}

            {/* Data point dots */}
            {points.map((p, i) => {
              const isActive = i === activeIdx;
              return (
                <g key={i}>
                  <circle
                    cx={p.x} cy={p.y}
                    r={isActive ? 6 : 4}
                    fill={isActive ? '#ffffff' : lineColor}
                    stroke={lineColor}
                    strokeWidth={isActive ? 3 : 1.5}
                    style={{
                      transformOrigin: `${p.x}px ${p.y}px`,
                      transition: 'all 0.15s ease-out',
                    }}
                    className="cursor-pointer"
                  />
                  {!isActive && displayValueThreshold !== undefined && p.value >= displayValueThreshold && valueFormatter && (
                    <text
                      x={p.x} y={p.y - 11}
                      textAnchor="middle"
                      className={`text-[10px] font-bold ${fillClassName} select-none transition-opacity duration-200 ${isChartHovered ? 'opacity-30' : 'opacity-100'}`}
                    >
                      {valueFormatter(p.value)}
                    </text>
                  )}
                </g>
              );
            })}

            {/* Tooltip bubble (slides to hovered point, defaults to peak) */}
            {activePoint && (
              <g className="transition-all duration-300 ease-out" style={{ transform: 'translate(0px, 0px)' }}>
                <rect
                  x={activePoint.x - 38} y={activePoint.y - 46}
                  width={76} height={28}
                  rx="7" fill={lineColor}
                  className="shadow-lg"
                />
                <polygon
                  points={`${activePoint.x - 7},${activePoint.y - 18} ${activePoint.x + 7},${activePoint.y - 18} ${activePoint.x},${activePoint.y - 8}`}
                  fill={lineColor}
                />
                <text
                  x={activePoint.x} y={activePoint.y - 26}
                  textAnchor="middle"
                  fill="#ffffff"
                  className="text-[11px] font-black select-none"
                >
                  {peakLabelFormatter(activePoint.value)}
                </text>
              </g>
            )}

            {/* X-axis labels */}
            {points.map((p, i) => (
              <text
                key={i}
                x={p.x} y="368"
                textAnchor="middle"
                className="text-[11px] font-bold fill-foreground/40 select-none"
              >
                {p.label}
              </text>
            ))}

            {/* Invisible hover hitboxes to trigger mouse interactions on nearest points */}
            {points.map((p, i) => {
              const halfStep = gridWidth / (2 * (labels.length - 1));
              const startX = p.x - halfStep;
              const width = halfStep * 2;
              return (
                <rect
                  key={i}
                  x={startX}
                  y={topPad}
                  width={width}
                  height={gridBottom - topPad}
                  fill="transparent"
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredIndex(i)}
                />
              );
            })}
          </svg>
        </div>
      </div>
    </div>
  );
}

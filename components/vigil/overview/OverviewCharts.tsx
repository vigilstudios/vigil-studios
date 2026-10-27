"use client";

import { useId, useState } from "react";
import { BarChart3, LineChart, Table2 } from "lucide-react";
import type { ChartView, SeriesPoint } from "@/lib/vigil/overview/model";

export function ChartSwitcher({
  value,
  onChange,
  label,
}: {
  value: ChartView;
  onChange: (view: ChartView) => void;
  label: string;
}) {
  return (
    <div
      className="ov-segments ov-chart-switch"
      role="group"
      aria-label={label}
    >
      {(
        [
          { key: "area", label: "Area chart", icon: LineChart },
          { key: "bars", label: "Bar chart", icon: BarChart3 },
          { key: "table", label: "Data table", icon: Table2 },
        ] as const
      ).map((item) => (
        <button
          type="button"
          key={item.key}
          aria-label={`${label}: ${item.label}`}
          title={item.label}
          aria-pressed={value === item.key}
          onClick={() => onChange(item.key)}
        >
          <item.icon size={15} aria-hidden="true" />
        </button>
      ))}
    </div>
  );
}

/** One truthful dataset, three representations. Point values work with pointer and keyboard. */
export function TrendChart({
  points,
  view,
  label,
  color = "var(--accent)",
}: {
  points: SeriesPoint[];
  view: ChartView;
  label: string;
  color?: string;
}) {
  const gradient = useId().replace(/:/g, "");
  const [selected, setSelected] = useState<number | null>(null);
  const active =
    selected !== null && selected < points.length ? selected : null;
  const point = active === null ? null : points[active];
  if (view === "table")
    return (
      <div className="ov-chart-table">
        <table>
          <caption className="ov-sr-only">{label}</caption>
          <thead>
            <tr>
              <th scope="col">Date (UTC)</th>
              <th scope="col">{label}</th>
            </tr>
          </thead>
          <tbody>
            {points.map((row) => (
              <tr key={row.date}>
                <td>{row.label}</td>
                <td>{row.value.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  const width = 300,
    height = 170,
    left = 30,
    right = 12,
    top = 16,
    bottom = 26;
  const plotWidth = width - left - right,
    plotHeight = height - top - bottom;
  const maximum = Math.max(
    4,
    Math.ceil(Math.max(...points.map((p) => p.value), 0) / 4) * 4,
  );
  const x = (i: number) =>
    left + ((i + 0.5) / Math.max(1, points.length)) * plotWidth;
  const y = (value: number) =>
    top + plotHeight - (value / maximum) * plotHeight;
  const line = points
    .map((p, i) => `${i ? "L" : "M"}${x(i)},${y(p.value)}`)
    .join(" ");
  const area = points.length
    ? `${line} L${x(points.length - 1)},${y(0)} L${x(0)},${y(0)} Z`
    : "";
  const indices = [
    ...new Set([
      0,
      Math.floor(points.length / 3),
      Math.floor((points.length * 2) / 3),
      points.length - 1,
    ]),
  ].filter((i) => i >= 0 && i < points.length);
  return (
    <div className="ov-trend">
      <div className="ov-chart-readout" aria-live="polite">
        {point ? (
          <>
            <strong>{point.value.toLocaleString()}</strong>{" "}
            {label.toLowerCase()} · {point.label}
          </>
        ) : (
          <span>Hover or focus a point to explore</span>
        )}
      </div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="group"
        aria-label={`${label}, ${points[0]?.label ?? ""} to ${points.at(-1)?.label ?? ""}`}
      >
        <defs>
          <linearGradient id={`${gradient}-area`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity=".3" />
            <stop offset="100%" stopColor={color} stopOpacity=".015" />
          </linearGradient>
          <linearGradient id={`${gradient}-bar`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} />
            <stop offset="100%" stopColor={color} stopOpacity=".35" />
          </linearGradient>
        </defs>
        {[0, 1, 2, 3, 4].map((tick) => (
          <g key={tick}>
            <line
              x1={left}
              x2={width - right}
              y1={y((maximum * tick) / 4)}
              y2={y((maximum * tick) / 4)}
              stroke="var(--ov-grid)"
              strokeDasharray="3 5"
            />
            <text
              x={left - 10}
              y={y((maximum * tick) / 4) + 4}
              textAnchor="end"
              fill="var(--text-secondary)"
              fontSize="14"
            >
              {(maximum * tick) / 4}
            </text>
          </g>
        ))}
        {view === "area" && (
          <>
            <path d={area} fill={`url(#${gradient}-area)`} />
            <path
              d={line}
              fill="none"
              stroke={color}
              strokeWidth="2.5"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          </>
        )}
        {points.map((p, i) => (
          <g key={p.date}>
            {view === "bars" && (
              <rect
                x={x(i) - (plotWidth / Math.max(1, points.length)) * 0.31}
                y={y(p.value)}
                width={(plotWidth / Math.max(1, points.length)) * 0.62}
                height={y(0) - y(p.value)}
                rx="3"
                fill={`url(#${gradient}-bar)`}
              />
            )}
            {active === i && (
              <line
                x1={x(i)}
                x2={x(i)}
                y1={top}
                y2={y(0)}
                stroke={color}
                strokeOpacity=".3"
                strokeDasharray="3 3"
              />
            )}
            <rect
              x={x(i) - plotWidth / Math.max(1, points.length) / 2}
              y={top}
              width={plotWidth / Math.max(1, points.length)}
              height={plotHeight}
              fill="transparent"
              data-point
              tabIndex={active === i || (active === null && i === 0) ? 0 : -1}
              role="button"
              onKeyDown={(event) => {
                const next =
                  event.key === "ArrowRight"
                    ? Math.min(points.length - 1, i + 1)
                    : event.key === "ArrowLeft"
                      ? Math.max(0, i - 1)
                      : event.key === "Home"
                        ? 0
                        : event.key === "End"
                          ? points.length - 1
                          : null;
                if (next !== null) {
                  event.preventDefault();
                  event.currentTarget.parentElement?.parentElement
                    ?.querySelectorAll<SVGRectElement>("[data-point]")
                    [next]?.focus();
                }
              }}
              aria-label={`${p.label}: ${p.value} ${label.toLowerCase()}`}
              onFocus={() => setSelected(i)}
              onBlur={() => setSelected(null)}
              onMouseEnter={() => setSelected(i)}
              onMouseLeave={() => setSelected(null)}
            />
          </g>
        ))}
        {indices.map((i) => (
          <text
            key={i}
            x={x(i)}
            y={height - 4}
            textAnchor={
              i === 0 ? "start" : i === points.length - 1 ? "end" : "middle"
            }
            fill="var(--text-secondary)"
            fontSize="14"
          >
            {points[i].label}
          </text>
        ))}
      </svg>
    </div>
  );
}

export function RingChart({
  parts,
  center,
  caption,
  label,
}: {
  parts: { value: number; color: string; label: string }[];
  center: string;
  caption: string;
  label: string;
}) {
  const total = parts.reduce((sum, item) => sum + item.value, 0);
  const circumference = 301.59;
  return (
    <div className="ov-ring">
      <svg viewBox="0 0 120 120" role="img" aria-label={label}>
        <circle
          cx="60"
          cy="60"
          r="48"
          fill="none"
          stroke="var(--ov-ring-track)"
          strokeWidth="9"
        />
        {parts.map((part, i) => {
          const length = total ? (part.value / total) * circumference : 0;
          const offset =
            (parts.slice(0, i).reduce((sum, item) => sum + item.value, 0) /
              (total || 1)) *
            circumference;
          return (
            length > 0 && (
              <circle
                key={part.label}
                cx="60"
                cy="60"
                r="48"
                fill="none"
                transform="rotate(-90 60 60)"
                stroke={part.color}
                strokeWidth="9"
                strokeDasharray={`${Math.max(0, length - 2)} ${circumference - Math.max(0, length - 2)}`}
                strokeDashoffset={-offset}
                strokeLinecap="butt"
              />
            )
          );
        })}
      </svg>
      <div>
        <strong>{center}</strong>
        <span>{caption}</span>
      </div>
    </div>
  );
}

export function RankedBars({
  items,
  label,
  total,
  color = "var(--accent)",
}: {
  items: { label: string; value: number; color?: string }[];
  label: string;
  total?: number;
  color?: string;
}) {
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <ul className="ov-ranked" aria-label={label}>
      {items.map((item) => (
        <li key={item.label}>
          <div>
            <span>{item.label}</span>
            <strong>
              {item.value.toLocaleString()}
              {typeof total === "number" && (
                <small>
                  {" "}
                  · {total ? Math.round((item.value / total) * 100) : 0}%
                </small>
              )}
            </strong>
          </div>
          <span className="ov-bar-track" aria-hidden="true">
            <i
              style={{
                width: `${(item.value / max) * 100}%`,
                background: `linear-gradient(180deg, color-mix(in srgb, ${item.color || color} 45%, transparent), ${item.color || color})`,
              }}
            />
          </span>
        </li>
      ))}
    </ul>
  );
}

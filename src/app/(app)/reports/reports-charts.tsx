"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CHART_PALETTE, STATUS_PALETTE } from "@/lib/chart-palette";

type AxisStyle = {
  axisLine: false;
  tickLine: false;
  tick: { fill: string; fontSize: number; fontFamily: string };
};

const axis: AxisStyle = {
  axisLine: false,
  tickLine: false,
  tick: {
    fill: "currentColor",
    fontSize: 11,
    fontFamily: "var(--font-mono)",
  },
};

const tooltipStyle = {
  background: "rgb(var(--surface-2))",
  border: "1px solid rgb(var(--border) / 0.4)",
  borderRadius: "0.5rem",
  fontSize: "12px",
  color: "rgb(var(--text))",
};

export type CategoryDatum = { category: string; count: number };
export type WeekDatum = { week: string; count: number };
export type StatusByMonthDatum = {
  month: string;
  draft: number;
  sent: number;
  accepted: number;
  declined: number;
  expired: number;
};

export function CategoryBarChart({ data }: { data: CategoryDatum[] }) {
  return (
    <div className="h-[260px] text-text-muted">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid
            strokeDasharray="2 4"
            stroke="rgb(var(--border) / 0.4)"
            vertical={false}
          />
          <XAxis dataKey="category" {...axis} interval={0} angle={-12} dy={6} height={48} />
          <YAxis allowDecimals={false} {...axis} width={36} />
          <Tooltip
            cursor={{ fill: "rgb(var(--surface-3))", opacity: 0.4 }}
            contentStyle={tooltipStyle}
            formatter={(value) => [`${value} quotes`, ""]}
          />
          <Bar dataKey="count" radius={[4, 4, 0, 0]} fill={CHART_PALETTE.accent} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function WeeklyLineChart({ data }: { data: WeekDatum[] }) {
  return (
    <div className="h-[260px] text-text-muted">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
          <CartesianGrid
            strokeDasharray="2 4"
            stroke="rgb(var(--border) / 0.4)"
            vertical={false}
          />
          <XAxis dataKey="week" {...axis} />
          <YAxis allowDecimals={false} {...axis} width={36} />
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(value) => [`${value} quotes`, ""]}
          />
          <Line
            type="monotone"
            dataKey="count"
            stroke={CHART_PALETTE.primary}
            strokeWidth={2}
            dot={{ r: 3, fill: CHART_PALETTE.accent, strokeWidth: 0 }}
            activeDot={{ r: 5, fill: CHART_PALETTE.accent }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function StatusDistributionChart({ data }: { data: StatusByMonthDatum[] }) {
  return (
    <div className="h-[280px] text-text-muted">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid
            strokeDasharray="2 4"
            stroke="rgb(var(--border) / 0.4)"
            vertical={false}
          />
          <XAxis dataKey="month" {...axis} />
          <YAxis allowDecimals={false} {...axis} width={36} />
          <Tooltip
            contentStyle={tooltipStyle}
            cursor={{ fill: "rgb(var(--surface-3))", opacity: 0.4 }}
          />
          <Bar dataKey="draft" stackId="a" fill={STATUS_PALETTE.draft} />
          <Bar dataKey="sent" stackId="a" fill={STATUS_PALETTE.sent} />
          <Bar dataKey="accepted" stackId="a" fill={STATUS_PALETTE.accepted} />
          <Bar dataKey="declined" stackId="a" fill={STATUS_PALETTE.declined} />
          <Bar dataKey="expired" stackId="a" fill={STATUS_PALETTE.expired} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function StatusLegend() {
  const items: { key: keyof typeof STATUS_PALETTE; label: string }[] = [
    { key: "draft", label: "Draft" },
    { key: "sent", label: "Sent" },
    { key: "accepted", label: "Accepted" },
    { key: "declined", label: "Declined" },
    { key: "expired", label: "Expired" },
  ];
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-text-secondary">
      {items.map((it) => (
        <span key={it.key} className="inline-flex items-center gap-1.5">
          <span
            className="size-2.5 rounded-sm"
            style={{ background: STATUS_PALETTE[it.key] }}
            aria-hidden
          />
          {it.label}
        </span>
      ))}
    </div>
  );
}

import { useQuery } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { api } from "../lib/api.js";
import { formatHours, formatMoney } from "../lib/format.js";

// Shared categorical palette for charts.
const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#3b82f6", "#8b5cf6", "#ec4899", "#14b8a6"];

const STAT_CARDS = [
  { key: "total", label: "Total tracked", icon: "⏱️", border: "border-t-blue-500", chip: "bg-blue-50 text-blue-600" },
  { key: "billable", label: "Billable", icon: "✅", border: "border-t-emerald-500", chip: "bg-emerald-50 text-emerald-600" },
  { key: "nonbillable", label: "Non-billable", icon: "🚫", border: "border-t-amber-500", chip: "bg-amber-50 text-amber-600" },
  { key: "revenue", label: "Billable revenue", icon: "💰", border: "border-t-violet-500", chip: "bg-violet-50 text-violet-600" },
];

function StatCard({ card, value }) {
  return (
    <div className={`rounded-lg border border-slate-200 border-t-4 bg-white p-4 ${card.border}`}>
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-500">{card.label}</span>
        <span className={`flex h-8 w-8 items-center justify-center rounded-full text-base ${card.chip}`}>
          {card.icon}
        </span>
      </div>
      <div className="mt-2 text-2xl font-semibold">{value}</div>
    </div>
  );
}

function ChartCard({ title, hasData, children }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <h2 className="mb-4 font-semibold">{title}</h2>
      {hasData ? children : <p className="py-12 text-center text-slate-400">No data yet.</p>}
    </div>
  );
}

const tooltipStyle = {
  borderRadius: 8,
  border: "1px solid #e2e8f0",
  fontSize: 13,
};

export default function Dashboard() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => api.getDashboard(),
  });

  if (isLoading) return <p className="text-slate-500">Loading…</p>;
  if (error) return <p className="text-red-600">{error.message}</p>;

  const { totals, byClient, byProject } = data;

  const values = {
    total: formatHours(totals.totalMinutes),
    billable: formatHours(totals.billableMinutes),
    nonbillable: formatHours(totals.nonBillableMinutes),
    revenue: formatMoney(totals.billableRevenue),
  };

  const splitData = [
    { name: "Billable", value: totals.billableMinutes },
    { name: "Non-billable", value: totals.nonBillableMinutes },
  ];
  const SPLIT_COLORS = ["#10b981", "#94a3b8"];
  const hasSplit = totals.billableMinutes + totals.nonBillableMinutes > 0;

  return (
    <div className="space-y-6">
      {/* Colorful stat cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {STAT_CARDS.map((card) => (
          <StatCard key={card.key} card={card} value={values[card.key]} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Billable vs non-billable donut */}
        <ChartCard title="Billable vs non-billable" hasData={hasSplit}>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={splitData}
                dataKey="value"
                nameKey="name"
                innerRadius={70}
                outerRadius={100}
                paddingAngle={3}
              >
                {splitData.map((_, i) => (
                  <Cell key={i} fill={SPLIT_COLORS[i]} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} formatter={(v) => formatHours(v)} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Revenue by client */}
        <ChartCard title="Revenue by client" hasData={byClient.length > 0}>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={byClient}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v) => formatMoney(v)} cursor={{ fill: "#f1f5f9" }} />
              <Bar dataKey="revenue" radius={[6, 6, 0, 0]}>
                {byClient.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Revenue by project (full width) */}
      <ChartCard title="Revenue by project" hasData={byProject.length > 0}>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={byProject} layout="vertical" margin={{ left: 24 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 12 }} />
            <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 12 }} />
            <Tooltip contentStyle={tooltipStyle} formatter={(v) => formatMoney(v)} cursor={{ fill: "#f1f5f9" }} />
            <Bar dataKey="revenue" radius={[0, 6, 6, 0]}>
              {byProject.map((_, i) => (
                <Cell key={i} fill={COLORS[(i + 2) % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}

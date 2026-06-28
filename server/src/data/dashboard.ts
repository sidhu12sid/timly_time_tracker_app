import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";

// All dashboard aggregation runs in Postgres. We never fetch rows and sum in JS.
// Revenue = sum(duration_minutes / 60 * hourly_rate) is a per-row product, so
// it needs SQL (Prisma groupBy can't multiply two columns). Only completed
// entries (duration_minutes not null) count.

export interface Totals {
  totalMinutes: number;
  billableMinutes: number;
  nonBillableMinutes: number;
  billableRevenue: number;
}

export interface GroupedRevenue {
  id: string;
  name: string;
  minutes: number;
  revenue: number;
}

function dateRange(from?: Date, to?: Date) {
  const clauses: Prisma.Sql[] = [];
  if (from) clauses.push(Prisma.sql`AND te.start_time >= ${from}`);
  if (to) clauses.push(Prisma.sql`AND te.start_time <= ${to}`);
  return clauses.length ? Prisma.join(clauses, " ") : Prisma.empty;
}

export async function getTotals(userId: string, from?: Date, to?: Date): Promise<Totals> {
  const rows = await prisma.$queryRaw<
    Array<{
      total_minutes: bigint | null;
      billable_minutes: bigint | null;
      non_billable_minutes: bigint | null;
      billable_revenue: Prisma.Decimal | null;
    }>
  >(Prisma.sql`
    SELECT
      COALESCE(SUM(te.duration_minutes), 0) AS total_minutes,
      COALESCE(SUM(te.duration_minutes) FILTER (WHERE te.is_billable), 0) AS billable_minutes,
      COALESCE(SUM(te.duration_minutes) FILTER (WHERE NOT te.is_billable), 0) AS non_billable_minutes,
      COALESCE(SUM((te.duration_minutes / 60.0) * COALESCE(te.hourly_rate, 0))
        FILTER (WHERE te.is_billable), 0) AS billable_revenue
    FROM time_entries te
    WHERE te.user_id = ${userId}
      AND te.duration_minutes IS NOT NULL
      ${dateRange(from, to)}
  `);

  const r = rows[0];
  return {
    totalMinutes: Number(r?.total_minutes ?? 0),
    billableMinutes: Number(r?.billable_minutes ?? 0),
    nonBillableMinutes: Number(r?.non_billable_minutes ?? 0),
    billableRevenue: Number(r?.billable_revenue ?? 0),
  };
}

export async function getRevenueByClient(userId: string, from?: Date, to?: Date): Promise<GroupedRevenue[]> {
  const rows = await prisma.$queryRaw<
    Array<{ id: string; name: string; minutes: bigint | null; revenue: Prisma.Decimal | null }>
  >(Prisma.sql`
    SELECT c.id AS id, c.name AS name,
      COALESCE(SUM(te.duration_minutes), 0) AS minutes,
      COALESCE(SUM((te.duration_minutes / 60.0) * COALESCE(te.hourly_rate, 0))
        FILTER (WHERE te.is_billable), 0) AS revenue
    FROM clients c
    JOIN projects p ON p.client_id = c.id
    JOIN time_entries te ON te.project_id = p.id
    WHERE c.user_id = ${userId}
      AND te.duration_minutes IS NOT NULL
      ${dateRange(from, to)}
    GROUP BY c.id, c.name
    ORDER BY revenue DESC
  `);

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    minutes: Number(r.minutes ?? 0),
    revenue: Number(r.revenue ?? 0),
  }));
}

export async function getRevenueByProject(userId: string, from?: Date, to?: Date): Promise<GroupedRevenue[]> {
  const rows = await prisma.$queryRaw<
    Array<{ id: string; name: string; minutes: bigint | null; revenue: Prisma.Decimal | null }>
  >(Prisma.sql`
    SELECT p.id AS id, p.name AS name,
      COALESCE(SUM(te.duration_minutes), 0) AS minutes,
      COALESCE(SUM((te.duration_minutes / 60.0) * COALESCE(te.hourly_rate, 0))
        FILTER (WHERE te.is_billable), 0) AS revenue
    FROM projects p
    JOIN clients c ON c.id = p.client_id
    JOIN time_entries te ON te.project_id = p.id
    WHERE c.user_id = ${userId}
      AND te.duration_minutes IS NOT NULL
      ${dateRange(from, to)}
    GROUP BY p.id, p.name
    ORDER BY revenue DESC
  `);

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    minutes: Number(r.minutes ?? 0),
    revenue: Number(r.revenue ?? 0),
  }));
}

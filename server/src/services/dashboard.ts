import * as dashboardData from "../data/dashboard.js";
import type { DashboardQuery } from "../schemas/index.js";

// Orchestrates the Postgres-side aggregations into one dashboard payload.
export async function getDashboard(userId: string, query: DashboardQuery) {
  const [totals, byClient, byProject] = await Promise.all([
    dashboardData.getTotals(userId, query.from, query.to),
    dashboardData.getRevenueByClient(userId, query.from, query.to),
    dashboardData.getRevenueByProject(userId, query.from, query.to),
  ]);

  return { totals, byClient, byProject };
}

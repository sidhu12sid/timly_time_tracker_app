import { Router } from "express";
import { getUserId } from "../middleware/currentUser.js";
import { dashboardQuerySchema } from "../schemas/index.js";
import * as dashboard from "../services/dashboard.js";

export const dashboardRouter = Router();

dashboardRouter.get("/", async (req, res) => {
  const query = dashboardQuerySchema.parse(req.query);
  res.json(await dashboard.getDashboard(getUserId(res), query));
});

import { Router } from "express";
import { getUserId } from "../middleware/currentUser.js";
import { HttpError } from "../lib/httpError.js";
import { createProjectSchema, updateProjectSchema } from "../schemas/index.js";
import * as projects from "../services/projects.js";

export const projectsRouter = Router();

projectsRouter.get("/", async (_req, res) => {
  res.json(await projects.listProjects(getUserId(res)));
});

projectsRouter.post("/", async (req, res) => {
  const input = createProjectSchema.parse(req.body);
  const created = await projects.createProject(input);
  res.status(201).json(created);
});

projectsRouter.patch("/:id", async (req, res) => {
  const { id } = req.params;
  if (!id) throw new HttpError(400, "Missing project id");
  const input = updateProjectSchema.parse(req.body);
  res.json(await projects.updateProject(getUserId(res), id, input));
});

projectsRouter.delete("/:id", async (req, res) => {
  const { id } = req.params;
  if (!id) throw new HttpError(400, "Missing project id");
  await projects.deleteProject(getUserId(res), id);
  res.status(204).end();
});

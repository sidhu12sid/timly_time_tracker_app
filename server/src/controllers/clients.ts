import { Router } from "express";
import { getUserId } from "../middleware/currentUser.js";
import { HttpError } from "../lib/httpError.js";
import { createClientSchema, updateClientSchema } from "../schemas/index.js";
import * as clients from "../services/clients.js";

export const clientsRouter = Router();

clientsRouter.get("/", async (_req, res) => {
  res.json(await clients.listClients(getUserId(res)));
});

clientsRouter.post("/", async (req, res) => {
  const input = createClientSchema.parse(req.body);
  const created = await clients.createClient(getUserId(res), input);
  res.status(201).json(created);
});

clientsRouter.patch("/:id", async (req, res) => {
  const { id } = req.params;
  if (!id) throw new HttpError(400, "Missing client id");
  const input = updateClientSchema.parse(req.body);
  res.json(await clients.updateClient(getUserId(res), id, input));
});

clientsRouter.delete("/:id", async (req, res) => {
  const { id } = req.params;
  if (!id) throw new HttpError(400, "Missing client id");
  await clients.deleteClient(getUserId(res), id);
  res.status(204).end();
});

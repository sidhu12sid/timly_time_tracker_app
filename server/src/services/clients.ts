import * as clientsData from "../data/clients.js";
import { toDecimal } from "./rates.js";
import { HttpError } from "../lib/httpError.js";
import type { CreateClientInput, UpdateClientInput } from "../schemas/index.js";

export function listClients(userId: string) {
  return clientsData.listClients(userId);
}

export function createClient(userId: string, input: CreateClientInput) {
  return clientsData.createClient(userId, {
    name: input.name,
    defaultHourlyRate: toDecimal(input.defaultHourlyRate),
  });
}

export async function updateClient(userId: string, id: string, input: UpdateClientInput) {
  const updated = await clientsData.updateClient(userId, id, {
    name: input.name,
    defaultHourlyRate: toDecimal(input.defaultHourlyRate),
  });
  if (!updated) throw new HttpError(404, "Client not found");
  return updated;
}

export async function deleteClient(userId: string, id: string) {
  const count = await clientsData.deleteClient(userId, id);
  if (count === 0) throw new HttpError(404, "Client not found");
}

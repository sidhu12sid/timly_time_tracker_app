import { Router } from "express";
import * as currencies from "../data/currencies.js";

// Public reference data — the full ISO 4217 currency list.
export const currenciesRouter = Router();

currenciesRouter.get("/", async (_req, res) => {
  res.json(await currencies.listCurrencies());
});

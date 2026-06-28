// Client-side app settings, persisted in localStorage. Currency is the first;
// add more keys here as settings grow. The list of selectable currencies now
// comes from the server (GET /api/currencies), not a hardcoded array.
const CURRENCY_KEY = "tt_currency";
const DEFAULT_CURRENCY = "USD";

export function getCurrency() {
  return localStorage.getItem(CURRENCY_KEY) || DEFAULT_CURRENCY;
}

export function setCurrency(code) {
  localStorage.setItem(CURRENCY_KEY, code);
}

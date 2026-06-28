import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api.js";
import { getCurrency, setCurrency } from "../lib/settings.js";
import { formatMoney } from "../lib/format.js";

export default function Settings() {
  const [currency, setCurrencyState] = useState(getCurrency());
  const [saved, setSaved] = useState(false);

  const { data: currencies = [], isLoading, error } = useQuery({
    queryKey: ["currencies"],
    queryFn: api.listCurrencies,
    staleTime: Infinity, // reference data — rarely changes
  });

  function onChangeCurrency(e) {
    const code = e.target.value;
    setCurrency(code); // persist first so formatMoney picks it up on re-render
    setCurrencyState(code);
    setSaved(true);
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="mb-1 font-semibold">Billing</h2>
        <p className="mb-4 text-sm text-slate-500">
          Currency used to display rates and revenue across the app.
        </p>

        <label className="block max-w-xs">
          <span className="mb-1 block text-sm font-medium text-slate-700">Billing currency</span>
          <select
            className="w-full rounded-md border border-slate-300 px-3 py-2 disabled:opacity-50"
            value={currency}
            onChange={onChangeCurrency}
            disabled={isLoading || !!error}
          >
            {/* Keep the saved value selectable even before the list loads. */}
            {(isLoading || error) && <option value={currency}>{currency}</option>}
            {currencies.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name} ({c.code})
              </option>
            ))}
          </select>
        </label>

        {error && <p className="mt-2 text-sm text-red-600">Couldn't load currencies: {error.message}</p>}

        <p className="mt-3 text-sm text-slate-500">
          Example: <span className="font-medium text-slate-900">{formatMoney(1234.5)}</span>
          {saved && <span className="ml-3 text-green-600">Saved ✓</span>}
        </p>
      </div>

      <p className="text-sm text-slate-400">More settings coming later.</p>
    </div>
  );
}

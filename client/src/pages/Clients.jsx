import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api.js";
import { createClientSchema } from "../schemas.js";

export default function Clients() {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [formError, setFormError] = useState(null);

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ["clients"],
    queryFn: api.listClients,
  });

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["clients"] });
    qc.invalidateQueries({ queryKey: ["projects"] });
  };

  function resetForm() {
    setName("");
    setEditingId(null);
    setFormError(null);
  }

  const saveMutation = useMutation({
    mutationFn: ({ id, body }) => (id ? api.updateClient(id, body) : api.createClient(body)),
    onSuccess: () => {
      refresh();
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: api.deleteClient,
    onSuccess: () => {
      // Cascades to projects + time entries, so refresh those too.
      refresh();
      qc.invalidateQueries({ queryKey: ["time-entries"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  function startEdit(client) {
    setEditingId(client.id);
    setName(client.name);
    setFormError(null);
  }

  function handleDelete(client) {
    const ok = window.confirm(
      `Delete "${client.name}"?\n\nThis also permanently deletes its projects and all their time entries.`,
    );
    if (ok) deleteMutation.mutate(client.id);
  }

  function handleSubmit(e) {
    e.preventDefault();
    setFormError(null);
    const parsed = createClientSchema.safeParse({ name });
    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message ?? "Invalid input");
      return;
    }
    saveMutation.mutate({ id: editingId, body: parsed.data });
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="mb-4 font-semibold">{editingId ? "Edit client" : "Add client"}</h2>
        <div className="flex flex-wrap gap-3">
          <input
            className="flex-1 rounded-md border border-slate-300 px-3 py-2"
            placeholder="Client name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <button
            type="submit"
            disabled={saveMutation.isPending}
            className="rounded-md bg-slate-900 px-4 py-2 text-white disabled:opacity-50"
          >
            {editingId ? "Save" : "Add"}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="rounded-md border border-slate-300 px-4 py-2"
            >
              Cancel
            </button>
          )}
        </div>
        {formError && <p className="mt-2 text-sm text-red-600">{formError}</p>}
        {saveMutation.isError && (
          <p className="mt-2 text-sm text-red-600">{saveMutation.error.message}</p>
        )}
      </form>

      <div className="rounded-lg border border-slate-200 bg-white">
        {isLoading ? (
          <p className="p-4 text-slate-500">Loading…</p>
        ) : clients.length === 0 ? (
          <p className="p-4 text-slate-500">No clients yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 text-left text-slate-500">
              <tr>
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Projects</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {clients.map((c) => (
                <tr key={c.id}>
                  <td className="px-4 py-2 font-medium">{c.name}</td>
                  <td className="px-4 py-2 text-slate-500">{c.projects?.length ?? 0}</td>
                  <td className="px-4 py-2 text-right whitespace-nowrap">
                    <button
                      onClick={() => startEdit(c)}
                      className="mr-2 rounded-md px-2 py-1 text-sm font-medium text-slate-700 hover:bg-slate-100"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(c)}
                      disabled={deleteMutation.isPending}
                      className="rounded-md px-2 py-1 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

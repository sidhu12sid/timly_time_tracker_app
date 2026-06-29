import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api.js";
import { createProjectSchema, updateProjectSchema } from "../schemas.js";
import { formatMoney } from "../lib/format.js";

const EMPTY = { clientId: "", name: "", hourlyRate: "", isBillableDefault: true };

export default function Projects() {
  const qc = useQueryClient();
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [formError, setFormError] = useState(null);

  const { data: clients = [] } = useQuery({ queryKey: ["clients"], queryFn: api.listClients });
  const { data: projects = [], isLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: api.listProjects,
  });

  function resetForm() {
    setForm(EMPTY);
    setEditingId(null);
    setFormError(null);
  }

  const saveMutation = useMutation({
    mutationFn: ({ id, body }) => (id ? api.updateProject(id, body) : api.createProject(body)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projects"] });
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: api.deleteProject,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projects"] });
      qc.invalidateQueries({ queryKey: ["time-entries"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  function update(key) {
    return (e) => {
      const value = e.target.type === "checkbox" ? e.target.checked : e.target.value;
      setForm((f) => ({ ...f, [key]: value }));
    };
  }

  function startEdit(project) {
    setEditingId(project.id);
    setForm({
      clientId: project.clientId,
      name: project.name,
      hourlyRate: project.hourlyRate != null ? String(project.hourlyRate) : "",
      isBillableDefault: project.isBillableDefault,
    });
    setFormError(null);
  }

  function handleDelete(project) {
    const ok = window.confirm(
      `Delete "${project.name}"?\n\nThis also permanently deletes all of its time entries.`,
    );
    if (ok) deleteMutation.mutate(project.id);
  }

  function handleSubmit(e) {
    e.preventDefault();
    setFormError(null);
    // Editing keeps the same client; rate / name / billable default can change.
    const rate = form.hourlyRate === "" ? null : Number(form.hourlyRate);
    const parsed = editingId
      ? updateProjectSchema.safeParse({
          name: form.name,
          hourlyRate: rate,
          isBillableDefault: form.isBillableDefault,
        })
      : createProjectSchema.safeParse({
          clientId: form.clientId,
          name: form.name,
          hourlyRate: rate,
          isBillableDefault: form.isBillableDefault,
        });
    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message ?? "Invalid input");
      return;
    }
    saveMutation.mutate({ id: editingId, body: parsed.data });
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="mb-4 font-semibold">{editingId ? "Edit project" : "Add project"}</h2>
        <div className="flex flex-wrap items-center gap-3">
          <select
            className="rounded-md border border-slate-300 px-3 py-2 disabled:bg-slate-100"
            value={form.clientId}
            onChange={update("clientId")}
            disabled={!!editingId} // client can't be changed when editing
          >
            <option value="">Select client…</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <input
            className="flex-1 rounded-md border border-slate-300 px-3 py-2"
            placeholder="Project name"
            value={form.name}
            onChange={update("name")}
          />
          <input
            className="w-40 rounded-md border border-slate-300 px-3 py-2"
            placeholder="Hourly rate"
            type="number"
            min="0"
            step="0.01"
            value={form.hourlyRate}
            onChange={update("hourlyRate")}
          />
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input type="checkbox" checked={form.isBillableDefault} onChange={update("isBillableDefault")} />
            Billable by default
          </label>
          <button
            type="submit"
            disabled={saveMutation.isPending}
            className="rounded-md bg-slate-900 px-4 py-2 text-white disabled:opacity-50"
          >
            {editingId ? "Save" : "Add"}
          </button>
          {editingId && (
            <button type="button" onClick={resetForm} className="rounded-md border border-slate-300 px-4 py-2">
              Cancel
            </button>
          )}
        </div>
        <p className="mt-2 text-xs text-slate-400">
          Set the project's hourly rate used to bill its time entries.
        </p>
        {formError && <p className="mt-2 text-sm text-red-600">{formError}</p>}
        {saveMutation.isError && (
          <p className="mt-2 text-sm text-red-600">{saveMutation.error.message}</p>
        )}
      </form>

      <div className="rounded-lg border border-slate-200 bg-white">
        {isLoading ? (
          <p className="p-4 text-slate-500">Loading…</p>
        ) : projects.length === 0 ? (
          <p className="p-4 text-slate-500">No projects yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 text-left text-slate-500">
              <tr>
                <th className="px-4 py-2">Project</th>
                <th className="px-4 py-2">Client</th>
                <th className="px-4 py-2">Rate</th>
                <th className="px-4 py-2">Billable default</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {projects.map((p) => (
                <tr key={p.id}>
                  <td className="px-4 py-2 font-medium">{p.name}</td>
                  <td className="px-4 py-2">{p.client?.name ?? "—"}</td>
                  <td className="px-4 py-2">
                    {p.hourlyRate != null ? `${formatMoney(Number(p.hourlyRate))}/h` : "—"}
                  </td>
                  <td className="px-4 py-2">{p.isBillableDefault ? "Yes" : "No"}</td>
                  <td className="px-4 py-2 text-right">
                    <button
                      onClick={() => startEdit(p)}
                      className="mr-2 rounded-md px-2 py-1 text-sm font-medium text-slate-700 hover:bg-slate-100"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(p)}
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

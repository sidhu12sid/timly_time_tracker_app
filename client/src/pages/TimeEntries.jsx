import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api.js";
import { formatDuration, formatMoney } from "../lib/format.js";

// Total elapsed seconds for an entry, including the current live segment.
function elapsedSeconds(entry, nowMs) {
  let total = entry.accumulatedSeconds ?? 0;
  if (entry.status === "running" && entry.segmentStartedAt) {
    total += Math.max(0, (nowMs - new Date(entry.segmentStartedAt).getTime()) / 1000);
  }
  return total;
}

const STATUS_STYLES = {
  running: "bg-green-100 text-green-700",
  paused: "bg-amber-100 text-amber-700",
  stopped: "bg-slate-100 text-slate-500",
};

export default function TimeEntries() {
  const qc = useQueryClient();
  const [projectId, setProjectId] = useState("");
  const [description, setDescription] = useState("");
  const [now, setNow] = useState(() => Date.now());

  // Tick every second so running timers count up live.
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const { data: projects = [] } = useQuery({ queryKey: ["projects"], queryFn: api.listProjects });
  const { data: entries = [], isLoading } = useQuery({
    queryKey: ["time-entries"],
    queryFn: api.listTimeEntries,
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["time-entries"] });
    qc.invalidateQueries({ queryKey: ["dashboard"] });
  };

  const startMutation = useMutation({
    mutationFn: () =>
      api.createTimeEntry({ projectId, description, startTime: new Date().toISOString() }),
    onSuccess: () => {
      invalidate();
      setDescription("");
    },
  });

  const pauseMutation = useMutation({ mutationFn: (id) => api.pauseTimer(id), onSuccess: invalidate });
  const resumeMutation = useMutation({ mutationFn: (id) => api.resumeTimer(id), onSuccess: invalidate });
  const stopMutation = useMutation({ mutationFn: (id) => api.stopTimer(id), onSuccess: invalidate });
  const deleteMutation = useMutation({ mutationFn: (id) => api.deleteTimeEntry(id), onSuccess: invalidate });

  const busy =
    pauseMutation.isPending || resumeMutation.isPending || stopMutation.isPending;
  const hasRunning = entries.some((e) => e.status === "running");

  function handleDelete(entry) {
    if (window.confirm("Delete this time entry? This can't be undone.")) {
      deleteMutation.mutate(entry.id);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="mb-4 font-semibold">Start a timer</h2>
        <div className="flex flex-wrap gap-3">
          <select
            className="rounded-md border border-slate-300 px-3 py-2"
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
          >
            <option value="">Select project…</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.client?.name ? `${p.client.name} — ` : ""}
                {p.name}
              </option>
            ))}
          </select>
          <input
            className="flex-1 rounded-md border border-slate-300 px-3 py-2"
            placeholder="What are you working on?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <button
            disabled={!projectId || hasRunning || startMutation.isPending}
            onClick={() => startMutation.mutate()}
            className="rounded-md bg-slate-900 px-4 py-2 text-white disabled:opacity-50"
          >
            Start
          </button>
        </div>
        {hasRunning && (
          <p className="mt-2 text-sm text-amber-700">
            A timer is running. Pause or stop it before starting another.
          </p>
        )}
        {startMutation.isError && (
          <p className="mt-2 text-sm text-red-600">{startMutation.error.message}</p>
        )}
      </div>

      <div className="rounded-lg border border-slate-200 bg-white">
        {isLoading ? (
          <p className="p-4 text-slate-500">Loading…</p>
        ) : entries.length === 0 ? (
          <p className="p-4 text-slate-500">No time entries yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 text-left text-slate-500">
              <tr>
                <th className="px-4 py-2">Description</th>
                <th className="px-4 py-2">Project</th>
                <th className="px-4 py-2">Time</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Rate</th>
                <th className="px-4 py-2">Billable</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {entries.map((e) => (
                <tr key={e.id}>
                  <td className="px-4 py-2">{e.description || "—"}</td>
                  <td className="px-4 py-2">{e.project?.name ?? "—"}</td>
                  <td className="px-4 py-2 font-mono tabular-nums">
                    {formatDuration(elapsedSeconds(e, now))}
                  </td>
                  <td className="px-4 py-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        STATUS_STYLES[e.status] ?? STATUS_STYLES.stopped
                      }`}
                    >
                      {e.status}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    {e.hourlyRate != null ? `${formatMoney(Number(e.hourlyRate))}/h` : "—"}
                  </td>
                  <td className="px-4 py-2">{e.isBillable ? "Yes" : "No"}</td>
                  <td className="px-4 py-2 text-right whitespace-nowrap">
                    {/* Start: resume a paused entry or reopen a stopped one. */}
                    <button
                      onClick={() => resumeMutation.mutate(e.id)}
                      disabled={busy || e.status === "running" || hasRunning}
                      title={
                        hasRunning && e.status !== "running"
                          ? "Pause or stop the running timer first"
                          : ""
                      }
                      className="mr-2 rounded-md px-2 py-1 text-sm font-medium text-green-700 hover:bg-green-50 disabled:opacity-40"
                    >
                      Start
                    </button>
                    <button
                      onClick={() => pauseMutation.mutate(e.id)}
                      disabled={busy || e.status !== "running"}
                      className="mr-2 rounded-md px-2 py-1 text-sm font-medium text-amber-700 hover:bg-amber-50 disabled:opacity-40"
                    >
                      Pause
                    </button>
                    <button
                      onClick={() => stopMutation.mutate(e.id)}
                      disabled={busy || e.status === "stopped"}
                      className="mr-2 rounded-md px-2 py-1 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-40"
                    >
                      Stop
                    </button>
                    <button
                      onClick={() => handleDelete(e)}
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

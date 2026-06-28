import { getUser } from "../lib/auth.js";

// Shows the session user from localStorage. The profile API was removed, so
// there's no server fetch yet — wire one up when the endpoint returns.
export default function Profile() {
  const user = getUser();

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-900 text-xl text-white">
            {user?.name?.[0]?.toUpperCase() ?? "?"}
          </div>
          <div>
            <h2 className="text-lg font-semibold">{user?.name ?? "Unknown"}</h2>
            <p className="text-sm text-slate-500">{user?.email ?? "—"}</p>
          </div>
        </div>

        <dl className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-sm text-slate-500">Name</dt>
            <dd className="font-medium">{user?.name ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-sm text-slate-500">Email</dt>
            <dd className="font-medium">{user?.email ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-sm text-slate-500">Email verified</dt>
            <dd className="font-medium">{user?.isVerified ? "Yes" : "No"}</dd>
          </div>
        </dl>

        <p className="mt-6 text-sm text-slate-400">
          Profile details are read from your current session. Server-side profile
          fetching and editing will be added later.
        </p>
      </div>
    </div>
  );
}

// Centered card shell shared by the auth pages.
export default function AuthCard({ title, subtitle, children, footer }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <div className="text-2xl font-bold">⏱️ Time Tracker</div>
          {title && <h1 className="mt-4 text-xl font-semibold">{title}</h1>}
          {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">{children}</div>
        {footer && <div className="mt-4 text-center text-sm text-slate-500">{footer}</div>}
      </div>
    </div>
  );
}

// Shared field + button styles.
export function Field({ label, error, ...props }) {
  return (
    <label className="mb-4 block">
      <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
      <input
        className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-slate-500"
        {...props}
      />
      {error && <span className="mt-1 block text-sm text-red-600">{error}</span>}
    </label>
  );
}

export function SubmitButton({ children, ...props }) {
  return (
    <button
      type="submit"
      className="w-full rounded-md bg-slate-900 px-4 py-2 font-medium text-white disabled:opacity-50"
      {...props}
    >
      {children}
    </button>
  );
}

export function FormError({ message }) {
  if (!message) return null;
  return <p className="mb-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{message}</p>;
}

export function FormSuccess({ message }) {
  if (!message) return null;
  return <p className="mb-3 rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">{message}</p>;
}

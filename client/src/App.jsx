import { useState } from "react";
import { NavLink, Navigate, Outlet, Route, Routes, useNavigate } from "react-router-dom";
import Dashboard from "./pages/Dashboard.jsx";
import TimeEntries from "./pages/TimeEntries.jsx";
import Clients from "./pages/Clients.jsx";
import Projects from "./pages/Projects.jsx";
import Profile from "./pages/Profile.jsx";
import Settings from "./pages/Settings.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import VerifyOtp from "./pages/VerifyOtp.jsx";
import ForgotPassword from "./pages/ForgotPassword.jsx";
import ResetOtp from "./pages/ResetOtp.jsx";
import ResetPassword from "./pages/ResetPassword.jsx";
import { clearSession, getUser, isLoggedIn } from "./lib/auth.js";

const NAV_ITEMS = [
  { to: "/", label: "Dashboard", icon: "📊" },
  { to: "/clients", label: "Clients", icon: "👥" },
  { to: "/projects", label: "Projects", icon: "📁" },
  { to: "/time", label: "Time Entries", icon: "⏱️" },
  { to: "/profile", label: "Profile", icon: "👤" },
  { to: "/settings", label: "Settings", icon: "⚙️" },
];

function Sidebar() {
  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-slate-200 bg-white">
      <div className="px-5 py-4 text-lg font-bold">⏱️ Time Tracker</div>

      <nav className="flex flex-1 flex-col gap-1 px-3">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium ${
                isActive ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
              }`
            }
          >
            <span aria-hidden>{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}

function Topbar({ onToggleSidebar, sidebarOpen }) {
  const navigate = useNavigate();
  const user = getUser();

  function logout() {
    clearSession();
    navigate("/login");
  }

  return (
    <header className="flex items-center gap-3 border-b border-slate-200 bg-white px-6 py-3">
      {/* Toggle button hides/shows the sidebar. */}
      <button
        onClick={onToggleSidebar}
        aria-label={sidebarOpen ? "Hide sidebar" : "Show sidebar"}
        className="rounded-md p-1.5 text-lg leading-none text-slate-600 hover:bg-slate-100"
      >
        ☰
      </button>
      {/* User name on the left. */}
      <div className="text-sm">
        <span className="text-slate-500">Signed in as </span>
        <span className="font-semibold text-slate-900">{user?.name ?? "User"}</span>
      </div>
      {/* Log out on the right. */}
      <button
        onClick={logout}
        className="ml-auto flex items-center gap-2 rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
      >
        <span aria-hidden>🚪</span>
        Log out
      </button>
    </header>
  );
}

// Protected shell: redirect to login if no session, else render the sidebar +
// topbar layout with the routed page in the content area.
function ProtectedLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  if (!isLoggedIn()) return <Navigate to="/login" replace />;

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      {sidebarOpen && <Sidebar />}
      <div className="flex flex-1 flex-col">
        <Topbar onToggleSidebar={() => setSidebarOpen((open) => !open)} sidebarOpen={sidebarOpen} />
        <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      {/* Public auth routes (standalone, no app chrome). */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/verify-otp" element={<VerifyOtp />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-otp" element={<ResetOtp />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Protected app routes share the sidebar layout. */}
      <Route element={<ProtectedLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/time" element={<TimeEntries />} />
        <Route path="/clients" element={<Clients />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
    </Routes>
  );
}

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { api } from "../lib/api.js";
import { setSession } from "../lib/auth.js";
import { loginSchema } from "../schemas.js";
import AuthCard, { Field, SubmitButton, FormError } from "../components/AuthCard.jsx";

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [fieldErrors, setFieldErrors] = useState({});
  const [needsVerify, setNeedsVerify] = useState(false);

  const mutation = useMutation({
    mutationFn: (body) => api.login(body),
    onSuccess: (data) => {
      setSession(data);
      navigate("/");
    },
    onError: (err) => {
      // 403 = email not verified — offer to finish verification.
      setNeedsVerify(err.status === 403);
    },
  });

  function update(key) {
    return (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    setFieldErrors({});
    setNeedsVerify(false);
    const parsed = loginSchema.safeParse(form);
    if (!parsed.success) {
      setFieldErrors(parsed.error.flatten().fieldErrors);
      return;
    }
    mutation.mutate(parsed.data);
  }

  return (
    <AuthCard
      title="Log in"
      footer={
        <>
          Need an account?{" "}
          <Link to="/register" className="font-medium text-slate-900 underline">
            Sign up
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit}>
        <FormError message={mutation.isError ? mutation.error.message : null} />
        {needsVerify && (
          <p className="mb-3 text-sm">
            <Link
              to={`/verify-otp?email=${encodeURIComponent(form.email)}`}
              className="font-medium text-slate-900 underline"
            >
              Verify your email
            </Link>{" "}
            to continue.
          </p>
        )}
        <Field
          label="Email"
          type="email"
          placeholder="Enter your email."
          value={form.email}
          onChange={update("email")}
          error={fieldErrors.email?.[0]}
        />
        <Field
          label="Password"
          type="password"
          placeholder="Enter your password."
          value={form.password}
          onChange={update("password")}
          error={fieldErrors.password?.[0]}
        />
        <div className="mb-4 text-right text-sm">
          <Link to="/forgot-password" className="text-slate-600 underline">
            Forgot password?
          </Link>
        </div>
        <SubmitButton disabled={mutation.isPending}>
          {mutation.isPending ? "Logging in…" : "Log in"}
        </SubmitButton>
      </form>
    </AuthCard>
  );
}

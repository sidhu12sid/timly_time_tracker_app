import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { api } from "../lib/api.js";
import { registerSchema } from "../schemas.js";
import AuthCard, { Field, SubmitButton, FormError } from "../components/AuthCard.jsx";

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [fieldErrors, setFieldErrors] = useState({});

  const mutation = useMutation({
    mutationFn: (body) => api.register(body),
    onSuccess: () => {
      // Move to OTP verification, carrying the email along.
      navigate(`/verify-otp?email=${encodeURIComponent(form.email)}`);
    },
  });

  function update(key) {
    return (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    setFieldErrors({});
    const parsed = registerSchema.safeParse(form);
    if (!parsed.success) {
      setFieldErrors(parsed.error.flatten().fieldErrors);
      return;
    }
    // confirmPassword is client-only — the API takes name/email/password.
    const { name, email, password } = parsed.data;
    mutation.mutate({ name, email, password });
  }

  return (
    <AuthCard
      title="Create your account"
      footer={
        <>
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-slate-900 underline">
            Log in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit}>
        <FormError message={mutation.isError ? mutation.error.message : null} />
        <Field
          label="Name"
          placeholder="Enter your name."
          value={form.name}
          onChange={update("name")}
          error={fieldErrors.name?.[0]}
        />
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
          placeholder="At least 8 characters"
          value={form.password}
          onChange={update("password")}
          error={fieldErrors.password?.[0]}
        />
        <Field
          label="Re-enter password"
          type="password"
          placeholder="Re-enter your password"
          value={form.confirmPassword}
          onChange={update("confirmPassword")}
          error={fieldErrors.confirmPassword?.[0]}
        />
        <SubmitButton disabled={mutation.isPending}>
          {mutation.isPending ? "Creating…" : "Create account"}
        </SubmitButton>
      </form>
    </AuthCard>
  );
}

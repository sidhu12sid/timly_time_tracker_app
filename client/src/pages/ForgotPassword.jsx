import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { api } from "../lib/api.js";
import { forgotPasswordSchema } from "../schemas.js";
import AuthCard, { Field, SubmitButton, FormError } from "../components/AuthCard.jsx";

// Step 1 of password reset: request a code by email.
export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [fieldError, setFieldError] = useState(null);

  const mutation = useMutation({
    mutationFn: (body) => api.forgotPassword(body),
    // Proceed to the OTP step regardless (we don't reveal if the email exists).
    onSuccess: () => navigate(`/reset-otp?email=${encodeURIComponent(email)}`),
  });

  function handleSubmit(e) {
    e.preventDefault();
    setFieldError(null);
    const parsed = forgotPasswordSchema.safeParse({ email });
    if (!parsed.success) {
      setFieldError(parsed.error.flatten().fieldErrors.email?.[0] ?? "Invalid email");
      return;
    }
    mutation.mutate(parsed.data);
  }

  return (
    <AuthCard
      title="Reset password"
      subtitle="We'll email you a reset code."
      footer={
        <Link to="/login" className="font-medium text-slate-900 underline">
          Back to log in
        </Link>
      }
    >
      <form onSubmit={handleSubmit}>
        <FormError message={mutation.isError ? mutation.error.message : null} />
        <Field
          label="Email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={fieldError}
        />
        <SubmitButton disabled={mutation.isPending}>
          {mutation.isPending ? "Sending…" : "Send reset code"}
        </SubmitButton>
      </form>
    </AuthCard>
  );
}

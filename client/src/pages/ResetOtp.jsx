import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { api } from "../lib/api.js";
import { verifyOtpSchema } from "../schemas.js";
import AuthCard, { Field, SubmitButton, FormError } from "../components/AuthCard.jsx";

// Step 2 of password reset: validate the code (without consuming it). Only on
// success do we advance to the new-password step.
export default function ResetOtp() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const email = params.get("email") ?? "";
  const [otp, setOtp] = useState("");
  const [fieldError, setFieldError] = useState(null);

  const mutation = useMutation({
    mutationFn: (body) => api.verifyResetOtp(body),
    onSuccess: () =>
      navigate(`/reset-password?email=${encodeURIComponent(email)}&otp=${encodeURIComponent(otp)}`),
  });

  function handleSubmit(e) {
    e.preventDefault();
    setFieldError(null);
    const parsed = verifyOtpSchema.safeParse({ email, otp });
    if (!parsed.success) {
      setFieldError(parsed.error.flatten().fieldErrors.otp?.[0] ?? "Invalid input");
      return;
    }
    mutation.mutate(parsed.data);
  }

  return (
    <AuthCard
      title="Enter reset code"
      subtitle={`Code sent to ${email || "your email"}`}
      footer={
        <Link to="/forgot-password" className="font-medium text-slate-900 underline">
          Start over
        </Link>
      }
    >
      <form onSubmit={handleSubmit}>
        <FormError message={mutation.isError ? mutation.error.message : null} />
        <Field
          label="Reset code"
          placeholder="6-digit code"
          inputMode="numeric"
          maxLength={6}
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
          error={fieldError}
        />
        <SubmitButton disabled={mutation.isPending}>
          {mutation.isPending ? "Verifying…" : "Verify code"}
        </SubmitButton>
      </form>
    </AuthCard>
  );
}

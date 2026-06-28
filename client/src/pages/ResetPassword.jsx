import { useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { api } from "../lib/api.js";
import { resetPasswordSchema } from "../schemas.js";
import AuthCard, { Field, SubmitButton, FormError } from "../components/AuthCard.jsx";

// Step 3 of password reset: set the new password. email + otp arrive via the
// query string from the verified OTP step.
export default function ResetPassword() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const email = params.get("email") ?? "";
  const otp = params.get("otp") ?? "";
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const mutation = useMutation({
    mutationFn: (body) => api.resetPassword(body),
    onSuccess: () => navigate("/login"),
  });

  // Reached without a verified code? Send the user back to the start.
  if (!email || !otp) return <Navigate to="/forgot-password" replace />;

  function handleSubmit(e) {
    e.preventDefault();
    setFieldErrors({});
    const parsed = resetPasswordSchema.safeParse({ email, otp, newPassword, confirmNewPassword });
    if (!parsed.success) {
      setFieldErrors(parsed.error.flatten().fieldErrors);
      return;
    }
    // confirmNewPassword is client-only — the API takes email/otp/newPassword.
    mutation.mutate({
      email: parsed.data.email,
      otp: parsed.data.otp,
      newPassword: parsed.data.newPassword,
    });
  }

  return (
    <AuthCard
      title="Set a new password"
      subtitle={`For ${email}`}
      footer={
        <Link to="/login" className="font-medium text-slate-900 underline">
          Back to log in
        </Link>
      }
    >
      <form onSubmit={handleSubmit}>
        <FormError message={mutation.isError ? mutation.error.message : null} />
        <Field
          label="New password"
          type="password"
          placeholder="At least 8 characters"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          error={fieldErrors.newPassword?.[0]}
        />
        <Field
          label="Re-enter new password"
          type="password"
          placeholder="Re-enter your password"
          value={confirmNewPassword}
          onChange={(e) => setConfirmNewPassword(e.target.value)}
          error={fieldErrors.confirmNewPassword?.[0]}
        />
        <SubmitButton disabled={mutation.isPending}>
          {mutation.isPending ? "Updating…" : "Update password"}
        </SubmitButton>
      </form>
    </AuthCard>
  );
}

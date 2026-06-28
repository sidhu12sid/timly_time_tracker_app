import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { api } from "../lib/api.js";
import { setSession } from "../lib/auth.js";
import { verifyOtpSchema } from "../schemas.js";
import AuthCard, { Field, SubmitButton, FormError } from "../components/AuthCard.jsx";

export default function VerifyOtp() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const email = params.get("email") ?? "";
  const [otp, setOtp] = useState("");
  const [fieldError, setFieldError] = useState(null);

  const mutation = useMutation({
    mutationFn: (body) => api.verifyOtp(body),
    onSuccess: (data) => {
      // verify-otp returns a session — log the user straight in.
      setSession(data);
      navigate("/");
    },
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
    <AuthCard title="Verify your email" subtitle={`Enter the 6-digit code sent to ${email || "your email"}`}>
      <form onSubmit={handleSubmit}>
        <FormError message={mutation.isError ? mutation.error.message : null} />
        <Field
          label="Verification code"
          placeholder="6-digit code"
          inputMode="numeric"
          maxLength={6}
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
          error={fieldError}
        />
        <SubmitButton disabled={mutation.isPending}>
          {mutation.isPending ? "Verifying…" : "Verify"}
        </SubmitButton>
      </form>
    </AuthCard>
  );
}

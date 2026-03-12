"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { useLocale } from "@/i18n/locale-context";

interface FormSubmitProps {
  action: (formData: FormData) => Promise<void>;
  successMessage?: string;
  children: React.ReactNode;
  className?: string;
}

export function FormSubmit({
  action,
  successMessage,
  children,
  className = "",
}: FormSubmitProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [submitting, setSubmitting] = useState(false);
  const { t } = useLocale();

  async function handleSubmit(formData: FormData) {
    setSubmitting(true);
    try {
      await action(formData);
      if (successMessage) toast.success(successMessage);
    } catch (err) {
      // redirect() throws NEXT_REDIRECT — let it propagate
      if (
        err instanceof Error &&
        err.message === "NEXT_REDIRECT"
      ) {
        throw err;
      }
      toast.error(
        err instanceof Error ? err.message : t("toast.genericError")
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form ref={formRef} action={handleSubmit} className={className}>
      <fieldset disabled={submitting}>
        {children}
      </fieldset>
    </form>
  );
}

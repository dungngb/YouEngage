"use client";

import { useEffect } from "react";
import { useLocale } from "@/i18n/locale-context";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useLocale();

  useEffect(() => {
    console.error("Root error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-red-500">{t("error.title")}</h1>
        <p className="mt-4 text-lg text-gray-600">
          {t("error.unexpected")}
        </p>
        <p className="mt-2 text-sm text-gray-400">
          {error.message || t("error.tryAgain")}
        </p>
        <button
          onClick={reset}
          className="btn-primary mt-6"
        >
          {t("error.retry")}
        </button>
      </div>
    </div>
  );
}

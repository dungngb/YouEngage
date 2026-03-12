"use client";

import { useEffect } from "react";
import { useLocale } from "@/i18n/locale-context";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useLocale();

  useEffect(() => {
    console.error("Dashboard error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-red-500">{t("error.occurred")}</h2>
        <p className="mt-3 text-sm text-gray-500">
          {error.message || t("error.tryAgain")}
        </p>
        <button
          onClick={reset}
          className="btn-primary mt-5"
        >
          {t("error.retry")}
        </button>
      </div>
    </div>
  );
}

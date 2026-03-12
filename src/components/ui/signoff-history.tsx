"use client";

import { useLocale } from "@/i18n/locale-context";

interface SignoffRecord {
  id: string;
  type: string;
  status: string;
  comment: string | null;
  signedAt: Date;
  signedBy: {
    name: string | null;
    email: string;
  };
}

interface SignoffHistoryProps {
  signoffs: SignoffRecord[];
}

export function SignoffHistory({ signoffs }: SignoffHistoryProps) {
  const { locale, t } = useLocale();

  if (signoffs.length === 0) {
    return (
      <p className="py-4 text-center text-sm text-gray-400">
        {t("signoff.history")} — 0
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {signoffs.map((s) => {
        const isPreparer = s.type === "PREPARER";
        const isRejected = s.status === "REJECTED";

        const borderColor = isRejected
          ? "border-red-200"
          : isPreparer
            ? "border-blue-200"
            : "border-green-200";
        const bgColor = isRejected
          ? "bg-red-50"
          : isPreparer
            ? "bg-blue-50"
            : "bg-green-50";
        const textColor = isRejected
          ? "text-red-700"
          : isPreparer
            ? "text-blue-700"
            : "text-green-700";

        const label = isRejected
          ? t("signoff.historyReject")
          : isPreparer
            ? t("signoff.historyPreparer")
            : t("signoff.historyApprove");

        return (
          <div
            key={s.id}
            className={`rounded-card border ${borderColor} ${bgColor} px-4 py-3`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`text-sm font-semibold ${textColor}`}>
                  {label}
                </span>
                <span className="text-xs text-gray-500">
                  {s.signedBy.name || s.signedBy.email}
                </span>
              </div>
              <span className="text-xs text-gray-400">
                {new Date(s.signedAt).toLocaleString(locale)}
              </span>
            </div>
            {s.comment && (
              <p className="mt-2 whitespace-pre-wrap text-sm text-gray-600">
                {s.comment}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

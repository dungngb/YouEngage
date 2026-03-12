"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { updateReportStatus } from "@/lib/actions/report";
import type { ReportStatus } from "@prisma/client";
import { useLocale } from "@/i18n/locale-context";
import type { TranslationKey } from "@/i18n/shared";

const STATUS_ORDER: ReportStatus[] = ["DRAFT", "REVIEW", "FINAL", "ISSUED"];

interface Props {
  engagementId: string;
  reportId: string;
  currentStatus: ReportStatus;
}

export function ReportStatusTransition({
  engagementId,
  reportId,
  currentStatus,
}: Props) {
  const router = useRouter();
  const { t } = useLocale();
  const [loading, setLoading] = useState(false);
  const [showRollbackForm, setShowRollbackForm] = useState(false);
  const [rollbackReason, setRollbackReason] = useState("");

  const currentIdx = STATUS_ORDER.indexOf(currentStatus);

  async function handleForward(newStatus: ReportStatus) {
    if (newStatus === "ISSUED") {
      const confirmed = confirm(t("report.issueConfirm"));
      if (!confirmed) return;
    }

    setLoading(true);
    try {
      await updateReportStatus(engagementId, reportId, newStatus);
      toast.success(t("toast.transition.success"));
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("toast.transition.error"));
    } finally {
      setLoading(false);
    }
  }

  async function handleRollback() {
    if (!rollbackReason.trim()) {
      toast.error(t("rollback.reasonRequired"));
      return;
    }
    const prevStatus = STATUS_ORDER[currentIdx - 1];
    setLoading(true);
    try {
      await updateReportStatus(engagementId, reportId, prevStatus, rollbackReason);
      toast.success(t("toast.transition.success"));
      setShowRollbackForm(false);
      setRollbackReason("");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("toast.transition.error"));
    } finally {
      setLoading(false);
    }
  }

  if (currentStatus === "ISSUED") {
    return (
      <p className="text-sm text-green-700 font-medium">
        {t("report.issuedLock")}
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        {/* Forward */}
        {currentIdx < STATUS_ORDER.length - 1 && (
          <button
            onClick={() => handleForward(STATUS_ORDER[currentIdx + 1])}
            disabled={loading}
            className="btn-primary btn-sm"
          >
            &rarr; {t(`status.report.${STATUS_ORDER[currentIdx + 1]}` as TranslationKey)}
          </button>
        )}
        {/* Backward — prompt for reason */}
        {currentIdx > 0 && (
          <button
            onClick={() => {
              setShowRollbackForm(!showRollbackForm);
              setRollbackReason("");
            }}
            disabled={loading}
            className="btn-secondary btn-sm"
          >
            &larr; {t(`status.report.${STATUS_ORDER[currentIdx - 1]}` as TranslationKey)}
          </button>
        )}
      </div>

      {/* B3: Rollback reason form */}
      {showRollbackForm && currentIdx > 0 && (
        <div className="rounded-card border border-amber-200 bg-amber-50 p-3">
          <label className="mb-1 block text-xs font-medium text-amber-700">
            {t("rollback.reasonLabel")} &quot;{t(`status.report.${STATUS_ORDER[currentIdx - 1]}` as TranslationKey)}&quot; *
          </label>
          <textarea
            value={rollbackReason}
            onChange={(e) => setRollbackReason(e.target.value)}
            rows={2}
            placeholder={t("rollback.reasonPlaceholder")}
            className="mb-2 block w-full rounded-card border border-amber-300 px-2 py-1 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
          />
          <div className="flex gap-2">
            <button
              onClick={handleRollback}
              disabled={loading}
              className="btn btn-sm bg-amber-600 text-white hover:bg-amber-700"
            >
              {loading ? t("signoff.processing") : t("actions.confirm")}
            </button>
            <button
              onClick={() => setShowRollbackForm(false)}
              className="btn-secondary btn-sm"
            >
              {t("actions.cancel")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

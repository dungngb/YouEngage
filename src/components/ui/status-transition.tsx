"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { EngagementStatus } from "@prisma/client";
import { updateEngagementStatus } from "@/lib/actions/engagement";
import { useLocale } from "@/i18n/locale-context";
import type { TranslationKey } from "@/i18n/shared";

const VALID_TRANSITIONS: Record<EngagementStatus, EngagementStatus[]> = {
  DRAFT: [EngagementStatus.ACTIVE],
  ACTIVE: [EngagementStatus.FIELDWORK, EngagementStatus.DRAFT],
  FIELDWORK: [EngagementStatus.REPORTING, EngagementStatus.ACTIVE],
  REPORTING: [EngagementStatus.CLOSED, EngagementStatus.FIELDWORK],
  CLOSED: [],
};

const STATUS_ORDER: EngagementStatus[] = ["DRAFT", "ACTIVE", "FIELDWORK", "REPORTING", "CLOSED"];

interface StatusTransitionProps {
  engagementId: string;
  currentStatus: EngagementStatus;
}

export function StatusTransition({
  engagementId,
  currentStatus,
}: StatusTransitionProps) {
  const router = useRouter();
  const { t } = useLocale();
  const [loading, setLoading] = useState(false);
  const [rollbackTarget, setRollbackTarget] = useState<EngagementStatus | null>(null);
  const [rollbackReason, setRollbackReason] = useState("");
  const nextStatuses = VALID_TRANSITIONS[currentStatus];

  if (nextStatuses.length === 0) return null;

  async function handleTransition(newStatus: EngagementStatus, reason?: string) {
    setLoading(true);
    try {
      await updateEngagementStatus(engagementId, newStatus, reason);
      toast.success(t("toast.transition.success"));
      setRollbackTarget(null);
      setRollbackReason("");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("toast.transition.error"));
    } finally {
      setLoading(false);
    }
  }

  function handleBackwardClick(status: EngagementStatus) {
    setRollbackTarget(status);
    setRollbackReason("");
  }

  function handleConfirmRollback() {
    if (!rollbackReason.trim()) {
      toast.error(t("rollback.reasonRequired"));
      return;
    }
    if (rollbackTarget) {
      handleTransition(rollbackTarget, rollbackReason);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {nextStatuses.map((status) => {
          const isForward =
            STATUS_ORDER.indexOf(status) > STATUS_ORDER.indexOf(currentStatus);

          return (
            <button
              key={status}
              onClick={() =>
                isForward
                  ? handleTransition(status)
                  : handleBackwardClick(status)
              }
              disabled={loading}
              className={
                isForward
                  ? "btn-primary btn-sm"
                  : "btn-secondary btn-sm"
              }
            >
              {t(`transition.engagement.${status}` as TranslationKey)}
            </button>
          );
        })}
      </div>

      {/* B3: Rollback reason form */}
      {rollbackTarget && (
        <div className="rounded-card border border-amber-200 bg-amber-50 p-3">
          <label className="mb-1 block text-xs font-medium text-amber-700">
            {t("rollback.reasonLabel")} &quot;{t(`status.engagement.${rollbackTarget}` as TranslationKey)}&quot; *
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
              onClick={handleConfirmRollback}
              disabled={loading}
              className="btn btn-sm bg-amber-600 text-white hover:bg-amber-700"
            >
              {loading ? t("signoff.processing") : t("actions.confirm")}
            </button>
            <button
              onClick={() => setRollbackTarget(null)}
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

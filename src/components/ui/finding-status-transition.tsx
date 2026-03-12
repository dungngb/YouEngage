"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { updateFindingStatus } from "@/lib/actions/finding";
import { useLocale } from "@/i18n/locale-context";
import type { TranslationKey } from "@/i18n/shared";
import type { FindingStatus } from "@prisma/client";

const STATUS_ORDER: FindingStatus[] = [
  "OPEN",
  "IN_PROGRESS",
  "REMEDIATED",
  "CLOSED",
];

interface Props {
  engagementId: string;
  findingId: string;
  currentStatus: FindingStatus;
  canClose: boolean;
}

export function FindingStatusTransition({
  engagementId,
  findingId,
  currentStatus,
  canClose,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { t } = useLocale();

  const currentIdx = STATUS_ORDER.indexOf(currentStatus);

  async function handleTransition(newStatus: FindingStatus) {
    setLoading(true);
    try {
      await updateFindingStatus(engagementId, findingId, newStatus);
      toast.success(t("toast.status.success"));
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("toast.status.error"));
    } finally {
      setLoading(false);
    }
  }

  if (currentStatus === "CLOSED") {
    return (
      <p className="text-sm font-medium text-green-700">
        {t("finding.closedMsg")}
      </p>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Forward */}
      {currentIdx < STATUS_ORDER.length - 1 && (
        <button
          onClick={() => handleTransition(STATUS_ORDER[currentIdx + 1])}
          disabled={loading || (STATUS_ORDER[currentIdx + 1] === "CLOSED" && !canClose)}
          title={
            STATUS_ORDER[currentIdx + 1] === "CLOSED" && !canClose
              ? t("finding.closeRequirement")
              : undefined
          }
          className="btn-primary btn-sm"
        >
          → {t(`status.finding.${STATUS_ORDER[currentIdx + 1]}` as TranslationKey)}
        </button>
      )}
      {/* Backward */}
      {currentIdx > 0 && (
        <button
          onClick={() => handleTransition(STATUS_ORDER[currentIdx - 1])}
          disabled={loading}
          className="btn-secondary btn-sm"
        >
          ← {t(`status.finding.${STATUS_ORDER[currentIdx - 1]}` as TranslationKey)}
        </button>
      )}
    </div>
  );
}

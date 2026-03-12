"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { updateTaskStatus } from "@/lib/actions/task";
import type { TaskStatus } from "@prisma/client";
import { useLocale } from "@/i18n/locale-context";
import type { TranslationKey } from "@/i18n/shared";

// Only manual statuses — signoff statuses (PENDING_REVIEW, APPROVED, REJECTED)
// are managed by the signoff workflow, not by direct selection
const MANUAL_STATUSES: TaskStatus[] = ["TODO", "IN_PROGRESS", "COMPLETED"];

interface TaskStatusSelectProps {
  engagementId: string;
  taskId: string;
  currentStatus: TaskStatus;
}

export function TaskStatusSelect({
  engagementId,
  taskId,
  currentStatus,
}: TaskStatusSelectProps) {
  const router = useRouter();
  const { t } = useLocale();

  // Don't show manual select if task is in signoff flow
  const inSignoffFlow =
    currentStatus === "PENDING_REVIEW" ||
    currentStatus === "APPROVED";

  if (inSignoffFlow) return null;

  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newStatus = e.target.value as "TODO" | "IN_PROGRESS" | "COMPLETED";
    try {
      await updateTaskStatus(engagementId, taskId, newStatus);
      toast.success(t("toast.status.success"));
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("toast.status.error"));
    }
  }

  // If REJECTED, show current status label but allow changing to IN_PROGRESS
  const selectValue =
    currentStatus === "REJECTED" ? "REJECTED" : currentStatus;

  return (
    <select
      value={selectValue}
      onChange={handleChange}
      className="rounded-card border border-gray-200 px-2 py-1 text-xs focus:border-primary-400 focus:ring-1 focus:ring-primary-400/50"
    >
      {currentStatus === "REJECTED" && (
        <option value="REJECTED" disabled>
          {t("task.statusRejected")}
        </option>
      )}
      {MANUAL_STATUSES.map((s) => (
        <option key={s} value={s}>
          {t(`status.task.${s}` as TranslationKey)}
        </option>
      ))}
    </select>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { deleteAttachment } from "@/lib/actions/task";
import { useLocale } from "@/i18n/locale-context";

interface DeleteAttachmentButtonProps {
  engagementId: string;
  attachmentId: string;
}

export function DeleteAttachmentButton({
  engagementId,
  attachmentId,
}: DeleteAttachmentButtonProps) {
  const router = useRouter();
  const { t } = useLocale();

  async function handleDelete() {
    if (!confirm(t("attachment.deleteConfirm"))) return;
    try {
      await deleteAttachment(engagementId, attachmentId);
      toast.success(t("toast.delete.success"));
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("toast.delete.error"));
    }
  }

  return (
    <button
      onClick={handleDelete}
      className="btn-ghost btn-xs ml-2 text-red-500 hover:bg-red-50 hover:text-red-700"
    >
      {t("actions.delete")}
    </button>
  );
}

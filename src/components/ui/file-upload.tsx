"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { MAX_FILE_SIZE_MB, ALLOWED_FILE_ACCEPT } from "@/lib/constants";
import { useLocale } from "@/i18n/locale-context";

interface FileUploadProps {
  engagementId: string;
  taskId?: string;
  reportId?: string;
  findingId?: string;
  category?: string;
}

export function FileUpload({
  engagementId,
  taskId,
  reportId,
  findingId,
  category = "general",
}: FileUploadProps) {
  const router = useRouter();
  const { t } = useLocale();
  const [uploading, setUploading] = useState(false);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Client-side size check
    for (const file of Array.from(files)) {
      if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        toast.error(t("toast.upload.fileTooLarge", { name: file.name, size: MAX_FILE_SIZE_MB }));
        e.target.value = "";
        return;
      }
    }

    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("engagementId", engagementId);
        if (taskId) formData.append("taskId", taskId);
        if (reportId) formData.append("reportId", reportId);
        if (findingId) formData.append("findingId", findingId);
        formData.append("category", category);

        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const data = await res.json();
          toast.error(data.error || t("toast.upload.error"));
          return;
        }
      }
      toast.success(t("toast.upload.success"));
      router.refresh();
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  return (
    <div className="inline-flex items-center gap-2">
      <label className="btn-secondary btn-sm inline-flex cursor-pointer items-center gap-2">
        {uploading ? t("attachment.uploading") : t("attachment.upload")}
        <input
          type="file"
          multiple
          accept={ALLOWED_FILE_ACCEPT}
          className="hidden"
          onChange={handleUpload}
          disabled={uploading}
        />
      </label>
      <span className="text-xs text-gray-400">
        {t("attachment.maxSize", { size: MAX_FILE_SIZE_MB })}
      </span>
    </div>
  );
}

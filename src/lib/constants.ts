import type {
  EngagementStatus,
  TaskStatus,
  TaskType,
  ReportStatus,
  FindingStatus,
  RiskRating,
} from "@prisma/client";

export const ENGAGEMENT_STATUS_LABELS: Record<EngagementStatus, string> = {
  DRAFT: "Bản nháp",
  ACTIVE: "Đang chuẩn bị",
  FIELDWORK: "Đang thực hiện",
  REPORTING: "Đang báo cáo",
  CLOSED: "Đã đóng",
};

export const ENGAGEMENT_STATUS_COLORS: Record<EngagementStatus, string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  ACTIVE: "bg-blue-100 text-blue-700",
  FIELDWORK: "bg-amber-100 text-amber-700",
  REPORTING: "bg-purple-100 text-purple-700",
  CLOSED: "bg-green-100 text-green-700",
};

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  TODO: "Chưa bắt đầu",
  IN_PROGRESS: "Đang thực hiện",
  COMPLETED: "Hoàn thành",
  PENDING_REVIEW: "Chờ duyệt",
  APPROVED: "Đã duyệt",
  REJECTED: "Từ chối",
};

export const TASK_STATUS_COLORS: Record<TaskStatus, string> = {
  TODO: "bg-gray-100 text-gray-700",
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  COMPLETED: "bg-yellow-100 text-yellow-700",
  PENDING_REVIEW: "bg-purple-100 text-purple-700",
  APPROVED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
};

export const TASK_TYPE_LABELS: Record<TaskType, string> = {
  TASK: "Task",
  WORKPAPER: "Workpaper",
};

// Report
export const REPORT_STATUS_LABELS: Record<ReportStatus, string> = {
  DRAFT: "Bản nháp",
  REVIEW: "Đang xem xét",
  FINAL: "Bản cuối",
  ISSUED: "Đã phát hành",
};

export const REPORT_STATUS_COLORS: Record<ReportStatus, string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  REVIEW: "bg-amber-100 text-amber-700",
  FINAL: "bg-blue-100 text-blue-700",
  ISSUED: "bg-green-100 text-green-700",
};

// Finding
export const FINDING_STATUS_LABELS: Record<FindingStatus, string> = {
  OPEN: "Mở",
  IN_PROGRESS: "Đang xử lý",
  REMEDIATED: "Đã khắc phục",
  CLOSED: "Đã đóng",
};

export const FINDING_STATUS_COLORS: Record<FindingStatus, string> = {
  OPEN: "bg-red-100 text-red-700",
  IN_PROGRESS: "bg-amber-100 text-amber-700",
  REMEDIATED: "bg-blue-100 text-blue-700",
  CLOSED: "bg-green-100 text-green-700",
};

export const RISK_RATING_LABELS: Record<RiskRating, string> = {
  HIGH: "Cao",
  MEDIUM: "Trung bình",
  LOW: "Thấp",
};

export const RISK_RATING_COLORS: Record<RiskRating, string> = {
  HIGH: "bg-red-100 text-red-700",
  MEDIUM: "bg-amber-100 text-amber-700",
  LOW: "bg-green-100 text-green-700",
};

// ── File Upload ──────────────────────────────────────────────────────────

export const MAX_FILE_SIZE_MB = 50;

export const ALLOWED_FILE_EXTENSIONS = [
  ".pdf",
  ".doc", ".docx",
  ".xls", ".xlsx",
  ".ppt", ".pptx",
  ".png", ".jpg", ".jpeg", ".gif",
  ".txt", ".csv",
  ".zip", ".rar",
];

export const ALLOWED_FILE_ACCEPT = ALLOWED_FILE_EXTENSIONS.join(",");

/** Map of allowed extensions → expected MIME types (for cross-validation) */
export const ALLOWED_MIME_TYPES: Record<string, string[]> = {
  ".pdf": ["application/pdf"],
  ".doc": ["application/msword"],
  ".docx": ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
  ".xls": ["application/vnd.ms-excel"],
  ".xlsx": ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"],
  ".ppt": ["application/vnd.ms-powerpoint"],
  ".pptx": ["application/vnd.openxmlformats-officedocument.presentationml.presentation"],
  ".png": ["image/png"],
  ".jpg": ["image/jpeg"],
  ".jpeg": ["image/jpeg"],
  ".gif": ["image/gif"],
  ".txt": ["text/plain"],
  ".csv": ["text/csv", "text/plain", "application/csv"],
  ".zip": ["application/zip", "application/x-zip-compressed"],
  ".rar": ["application/vnd.rar", "application/x-rar-compressed"],
};

/**
 * Sanitize an uploaded filename:
 * - Strip path separators and directory traversal
 * - Remove null bytes and control characters
 * - Collapse whitespace
 * - Limit length
 */
export function sanitizeFilename(name: string): string {
  let safe = name
    // Remove path separators (Unix and Windows)
    .replace(/[/\\]/g, "_")
    // Remove null bytes and control characters (U+0000–U+001F, U+007F)
    .replace(/[\x00-\x1f\x7f]/g, "")
    // Collapse whitespace
    .replace(/\s+/g, " ")
    .trim();
  // Limit to 255 characters
  if (safe.length > 255) {
    const ext = safe.lastIndexOf(".");
    if (ext > 0) {
      const extPart = safe.slice(ext);
      safe = safe.slice(0, 255 - extPart.length) + extPart;
    } else {
      safe = safe.slice(0, 255);
    }
  }
  return safe || "unnamed";
}

/**
 * Detect double extensions (e.g., "file.pdf.exe", "image.jpg.php").
 * Returns true if the filename has a suspicious double extension pattern.
 */
export function hasDoubleExtension(name: string): boolean {
  const parts = name.split(".");
  if (parts.length <= 2) return false;
  // Check if there are multiple recognized extensions
  const recognizedExtCount = parts
    .slice(1)
    .filter((p) => ALLOWED_FILE_EXTENSIONS.includes(`.${p.toLowerCase()}`))
    .length;
  // If we have recognized extensions and additional unknown extensions, it's suspicious
  // e.g., "file.pdf.exe" → ["pdf"] recognized + "exe" unknown
  return parts.length > 2 && recognizedExtCount < parts.length - 1;
}

// ── Document Categories ─────────────────────────────────────────────────

export const DOCUMENT_CATEGORY_LABELS: Record<string, string> = {
  general: "Chung",
  planning: "Planning",
  evidence: "Evidence",
  report: "Báo cáo",
  remediation: "Khắc phục",
};

// ── Audit Log Action Labels ─────────────────────────────────────────────

export const AUDIT_ACTION_LABELS: Record<string, string> = {
  "engagement.create": "Tạo engagement",
  "engagement.update": "Cập nhật engagement",
  "engagement.status_change": "Chuyển trạng thái engagement",
  "engagement.member_add": "Thêm thành viên",
  "engagement.member_remove": "Xóa thành viên",
  "task.create": "Tạo task",
  "task.update": "Cập nhật task",
  "task.status_change": "Chuyển trạng thái task",
  "task.delete": "Xóa task",
  "task.reopen": "Mở lại task",
  "task.assignment_change": "Thay đổi phân công task",
  "signoff.preparer": "Preparer signoff",
  "signoff.reviewer": "Reviewer signoff",
  "signoff.reviewer.approve": "Approve (Reviewer)",
  "signoff.reviewer.reject": "Từ chối (Reviewer)",
  "signoff.reject": "Từ chối signoff",
  "report.create": "Tạo báo cáo",
  "report.update": "Cập nhật báo cáo",
  "report.status_change": "Chuyển trạng thái báo cáo",
  "report.delete": "Xóa báo cáo",
  "finding.create": "Tạo finding",
  "finding.update": "Cập nhật finding",
  "finding.status_change": "Chuyển trạng thái finding",
  "finding.close": "Đóng finding",
  "engagement.status_rollback": "Quay lại trạng thái engagement",
  "report.status_rollback": "Quay lại trạng thái báo cáo",
  "engagement.delete": "Xóa engagement",
  "finding.delete": "Xóa finding",
  "file.upload": "Upload tài liệu",
  "file.delete": "Xóa tài liệu",
};

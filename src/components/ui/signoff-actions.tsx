"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  preparerSignoff,
  reviewerSignoff,
  rejectSignoff,
} from "@/lib/actions/signoff";
import { reopenTask } from "@/lib/actions/task";
import { useLocale } from "@/i18n/locale-context";

interface SignoffActionsProps {
  engagementId: string;
  taskId: string;
  taskStatus: string;
  currentUserId: string;
  currentUserRole: string;
  preparerUserId?: string; // who did the last preparer signoff
}

export function SignoffActions({
  engagementId,
  taskId,
  taskStatus,
  currentUserId,
  currentUserRole,
  preparerUserId,
}: SignoffActionsProps) {
  const router = useRouter();
  const { t } = useLocale();
  const [loading, setLoading] = useState(false);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [showReopenForm, setShowReopenForm] = useState(false);
  const [rejectComment, setRejectComment] = useState("");
  const [reopenReason, setReopenReason] = useState("");
  const [error, setError] = useState("");

  const isManager =
    currentUserRole === "manager" ||
    currentUserRole === "chief_auditor" ||
    currentUserRole === "admin";

  // A2: Preparer signoff only from COMPLETED — not REJECTED
  const canPrepareSignoff = taskStatus === "COMPLETED";

  const canReviewSignoff =
    taskStatus === "PENDING_REVIEW" &&
    isManager &&
    preparerUserId !== currentUserId;

  const cannotReviewReason =
    taskStatus === "PENDING_REVIEW" && preparerUserId === currentUserId
      ? t("signoff.diffUserMsg")
      : null;

  async function handlePreparerSignoff() {
    setLoading(true);
    setError("");
    try {
      await preparerSignoff(engagementId, taskId);
      toast.success(t("toast.signoff.preparerSuccess"));
      router.refresh();
    } catch (e) {
      const msg = e instanceof Error ? e.message : t("toast.unknownError");
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  async function handleReviewerSignoff() {
    setLoading(true);
    setError("");
    try {
      await reviewerSignoff(engagementId, taskId);
      toast.success(t("toast.signoff.approveSuccess"));
      router.refresh();
    } catch (e) {
      const msg = e instanceof Error ? e.message : t("toast.unknownError");
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  async function handleReject() {
    if (!rejectComment.trim()) {
      setError(t("error.rejectReasonRequired"));
      return;
    }
    setLoading(true);
    setError("");
    try {
      await rejectSignoff(engagementId, taskId, rejectComment);
      toast.success(t("toast.signoff.rejectSuccess"));
      setShowRejectForm(false);
      setRejectComment("");
      router.refresh();
    } catch (e) {
      const msg = e instanceof Error ? e.message : t("toast.unknownError");
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  // A1: Reopen task handler (Manager/Chief Auditor only)
  async function handleReopen() {
    if (!reopenReason.trim()) {
      setError(t("error.reopenReasonRequired"));
      return;
    }
    setLoading(true);
    setError("");
    try {
      await reopenTask(engagementId, taskId, reopenReason);
      toast.success(t("toast.signoff.reopenSuccess"));
      setShowReopenForm(false);
      setReopenReason("");
      router.refresh();
    } catch (e) {
      const msg = e instanceof Error ? e.message : t("toast.unknownError");
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  if (taskStatus === "APPROVED") {
    return (
      <div className="space-y-3">
        <div className="rounded-card border border-green-200 bg-green-50 p-4">
          <p className="text-sm font-medium text-green-700">
            {t("signoff.approvedMsg")}
          </p>
          {isManager && (
            <button
              onClick={() => setShowReopenForm(!showReopenForm)}
              disabled={loading}
              className="btn-secondary btn-sm mt-2 border-amber-300 text-amber-700 hover:bg-amber-50 disabled:opacity-50"
            >
              {t("signoff.reopenButton")}
            </button>
          )}
        </div>
        {showReopenForm && (
          <div className="rounded-card border border-amber-200 bg-amber-50 p-4">
            <label className="mb-1 block text-sm font-medium text-amber-700">
              {t("signoff.reopenReasonLabel")}
            </label>
            <textarea
              value={reopenReason}
              onChange={(e) => setReopenReason(e.target.value)}
              rows={3}
              placeholder={t("signoff.reopenReasonPlaceholder")}
              className="mb-2 block w-full rounded-card border border-amber-300 px-3 py-2 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
            />
            <div className="flex gap-2">
              <button
                onClick={handleReopen}
                disabled={loading}
                className="btn-primary bg-amber-600 hover:bg-amber-700 disabled:opacity-50"
              >
                {loading ? t("signoff.processing") : t("signoff.confirmReopen")}
              </button>
              <button
                onClick={() => {
                  setShowReopenForm(false);
                  setReopenReason("");
                }}
                className="btn-secondary"
              >
                {t("actions.cancel")}
              </button>
            </div>
          </div>
        )}
        {error && (
          <div className="rounded-card border border-red-200 bg-red-50 px-4 py-2">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="rounded-card border border-red-200 bg-red-50 px-4 py-2">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Preparer Signoff */}
      {canPrepareSignoff && (
        <div className="rounded-card border border-blue-200 bg-blue-50 p-4">
          <p className="mb-2 text-sm text-blue-700">
            {t("signoff.completedMsg")}
          </p>
          <button
            onClick={handlePreparerSignoff}
            disabled={loading}
            className="btn-primary bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? t("signoff.processing") : t("signoff.preparerButton")}
          </button>
        </div>
      )}

      {/* Reviewer Signoff / Reject */}
      {canReviewSignoff && (
        <div className="rounded-card border border-purple-200 bg-purple-50 p-4">
          <p className="mb-3 text-sm text-purple-700">
            {t("signoff.pendingMsg")}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={handleReviewerSignoff}
              disabled={loading}
              className="btn-primary bg-green-600 hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? t("signoff.processing") : t("signoff.approveButton")}
            </button>
            <button
              onClick={() => setShowRejectForm(!showRejectForm)}
              disabled={loading}
              className="btn-destructive disabled:opacity-50"
            >
              {t("signoff.rejectButton")}
            </button>
          </div>
        </div>
      )}

      {/* Cannot review reason */}
      {cannotReviewReason && (
        <div className="rounded-card border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm text-amber-700">{cannotReviewReason}</p>
        </div>
      )}

      {/* Reject form */}
      {showRejectForm && (
        <div className="rounded-card border border-red-200 bg-red-50 p-4">
          <label className="mb-1 block text-sm font-medium text-red-700">
            {t("signoff.rejectReasonLabel")}
          </label>
          <textarea
            value={rejectComment}
            onChange={(e) => setRejectComment(e.target.value)}
            rows={3}
            placeholder={t("signoff.rejectReasonPlaceholder")}
            className="mb-2 block w-full rounded-card border border-red-300 px-3 py-2 text-sm focus:border-red-500 focus:ring-1 focus:ring-red-500"
          />
          <div className="flex gap-2">
            <button
              onClick={handleReject}
              disabled={loading}
              className="btn-primary bg-red-600 hover:bg-red-700 disabled:opacity-50"
            >
              {loading ? t("signoff.processing") : t("signoff.confirmReject")}
            </button>
            <button
              onClick={() => {
                setShowRejectForm(false);
                setRejectComment("");
              }}
              className="btn-secondary"
            >
              {t("actions.cancel")}
            </button>
          </div>
        </div>
      )}

      {/* PENDING_REVIEW but not manager */}
      {taskStatus === "PENDING_REVIEW" && !isManager && (
        <div className="rounded-card border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm text-amber-700">
            {t("signoff.pendingMsg")}
          </p>
        </div>
      )}

      {/* PENDING_REVIEW: Reopen button for managers */}
      {taskStatus === "PENDING_REVIEW" && isManager && (
        <>
          <button
            onClick={() => setShowReopenForm(!showReopenForm)}
            disabled={loading}
            className="btn-secondary btn-sm border-amber-300 text-amber-700 hover:bg-amber-50 disabled:opacity-50"
          >
            {t("signoff.reopenButton")}
          </button>
          {showReopenForm && (
            <div className="rounded-card border border-amber-200 bg-amber-50 p-4">
              <label className="mb-1 block text-sm font-medium text-amber-700">
                {t("signoff.reopenReasonLabel")}
              </label>
              <textarea
                value={reopenReason}
                onChange={(e) => setReopenReason(e.target.value)}
                rows={3}
                placeholder={t("signoff.reopenReasonPlaceholder")}
                className="mb-2 block w-full rounded-card border border-amber-300 px-3 py-2 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleReopen}
                  disabled={loading}
                  className="btn-primary bg-amber-600 hover:bg-amber-700 disabled:opacity-50"
                >
                  {loading ? t("signoff.processing") : t("signoff.confirmReopen")}
                </button>
                <button
                  onClick={() => {
                    setShowReopenForm(false);
                    setReopenReason("");
                  }}
                  className="btn-secondary"
                >
                  {t("actions.cancel")}
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* REJECTED: guide auditor to change status to COMPLETED */}
      {taskStatus === "REJECTED" && (
        <div className="rounded-card border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-700">
            {t("signoff.rejectedMsg")}
          </p>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  addEngagementMember,
  removeEngagementMember,
} from "@/lib/actions/engagement";
import { useLocale } from "@/i18n/locale-context";

interface User {
  id: string;
  name: string | null;
  email: string;
}

interface Member {
  id: string;
  role: string;
  user: User;
}

interface TeamManagerProps {
  engagementId: string;
  members: Member[];
  allUsers: User[];
  canManage: boolean;
}

export function TeamManager({
  engagementId,
  members,
  allUsers,
  canManage,
}: TeamManagerProps) {
  const router = useRouter();
  const { t } = useLocale();
  const [adding, setAdding] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedRole, setSelectedRole] = useState("member");

  const memberUserIds = new Set(members.map((m) => m.user.id));
  const availableUsers = allUsers.filter((u) => !memberUserIds.has(u.id));

  async function handleAdd() {
    if (!selectedUserId) return;
    try {
      await addEngagementMember(engagementId, selectedUserId, selectedRole);
      toast.success(t("toast.member.addSuccess"));
      setAdding(false);
      setSelectedUserId("");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("toast.member.addError"));
    }
  }

  async function handleRemove(userId: string) {
    if (!confirm(t("team.removeConfirm"))) return;
    try {
      await removeEngagementMember(engagementId, userId);
      toast.success(t("toast.member.removeSuccess"));
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("toast.member.removeError"));
    }
  }

  return (
    <div className="space-y-3">
      {/* Members list */}
      <div className="space-y-2">
        {members.map((m) => (
          <div
            key={m.id}
            className="list-row"
          >
            <div>
              <span className="text-sm font-medium text-gray-900">
                {m.user.name || m.user.email}
              </span>
              <span className="ml-2 text-xs text-gray-400">{m.user.email}</span>
              <span
                className={`badge ml-2 ${
                  m.role === "lead"
                    ? "bg-primary-100 text-primary-700"
                    : "bg-gray-200 text-gray-600"
                }`}
              >
                {m.role === "lead" ? t("team.roleLead") : t("team.roleMember")}
              </span>
            </div>
            {canManage && m.role !== "lead" && (
              <button
                onClick={() => handleRemove(m.user.id)}
                className="btn-ghost btn-xs text-red-500 hover:bg-red-50 hover:text-red-700"
              >
                {t("actions.delete")}
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Add member */}
      {canManage && (
        <>
          {!adding ? (
            <button
              onClick={() => setAdding(true)}
              className="text-sm font-medium text-primary-600 hover:text-primary-700"
            >
              {t("team.addMember")}
            </button>
          ) : (
            <div className="flex items-end gap-2 rounded-card border border-gray-200 bg-surface-muted p-3">
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-600">
                  {t("team.selectUser")}
                </label>
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="mt-1 block w-full rounded-card border border-gray-200 px-2 py-1.5 text-sm focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400"
                >
                  <option value="">{t("team.selectPlaceholder")}</option>
                  {availableUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name || u.email}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600">
                  {t("team.role")}
                </label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="mt-1 block rounded-card border border-gray-200 px-2 py-1.5 text-sm focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400"
                >
                  <option value="member">{t("team.roleMember")}</option>
                  <option value="lead">{t("team.roleLead")}</option>
                </select>
              </div>
              <button
                onClick={handleAdd}
                disabled={!selectedUserId}
                className="btn-primary btn-sm disabled:opacity-50"
              >
                {t("actions.add")}
              </button>
              <button
                onClick={() => setAdding(false)}
                className="btn-secondary btn-sm"
              >
                {t("actions.cancel")}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

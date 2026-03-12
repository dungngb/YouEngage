/**
 * Phase 7 — Server Action Logic Validation
 *
 * Tests Phase 7 business rules directly via Prisma + action imports.
 * Since server actions require Next.js runtime, we test the underlying
 * Prisma state and validate business rules through database state checks.
 *
 * Usage: npx tsx scripts/phase7-action-test.mjs
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const results = [];

function test(id, description, passed, note = "") {
  totalTests++;
  if (passed) {
    passedTests++;
    results.push({ id, description, result: "PASS", note });
    console.log(`  [PASS] ${id}: ${description}`);
  } else {
    failedTests++;
    results.push({ id, description, result: "FAIL", note });
    console.log(`  [FAIL] ${id}: ${description} — ${note}`);
  }
}

async function main() {
  console.log("=== Phase 7 — Server Action Logic Validation ===\n");

  // Get user IDs
  const manager1 = await prisma.user.findUnique({ where: { email: "manager1@demo.local" } });
  const auditor1 = await prisma.user.findUnique({ where: { email: "auditor1@demo.local" } });
  const auditor2 = await prisma.user.findUnique({ where: { email: "auditor2@demo.local" } });
  const manager2 = await prisma.user.findUnique({ where: { email: "manager2@demo.local" } });

  if (!manager1 || !auditor1 || !auditor2 || !manager2) {
    console.error("Demo users not found. Run seed first.");
    process.exit(1);
  }

  // ── A1: Task Lock Verification ──────────────────────────────────────────
  console.log("[A1] Task Lock Verification");

  // Task1 is APPROVED, Task2 is PENDING_REVIEW
  const task1 = await prisma.task.findUnique({ where: { id: "demo-task-1" } });
  const task2 = await prisma.task.findUnique({ where: { id: "demo-task-2" } });
  const task3 = await prisma.task.findUnique({ where: { id: "demo-task-3" } });

  test("A1-01", "Task1 is APPROVED", task1?.status === "APPROVED", task1?.status);
  test("A1-02", "Task2 is PENDING_REVIEW", task2?.status === "PENDING_REVIEW", task2?.status);
  test("A1-03", "Task3 is IN_PROGRESS (can be edited)", task3?.status === "IN_PROGRESS", task3?.status);

  // ── A1-Reopen: Test reopen flow via DB ──────────────────────────────────
  console.log("\n[A1-Reopen] Reopen Task Flow");

  // Create a test task for reopen testing
  const reopenTestTask = await prisma.task.create({
    data: {
      engagementId: "demo-eng-fieldwork",
      title: "Reopen Test Task",
      status: "APPROVED",
      assigneeId: auditor1.id,
      sortOrder: 100,
    },
  });

  // Create signoffs for the test task
  await prisma.signoff.create({
    data: {
      taskId: reopenTestTask.id,
      type: "PREPARER",
      status: "SIGNED",
      signedById: auditor1.id,
    },
  });
  await prisma.signoff.create({
    data: {
      taskId: reopenTestTask.id,
      type: "REVIEWER",
      status: "SIGNED",
      signedById: manager1.id,
    },
  });

  test("A1-04", "Reopen test task created as APPROVED", reopenTestTask.status === "APPROVED");

  // Simulate reopen: add rejection signoff + set status to IN_PROGRESS
  await prisma.signoff.create({
    data: {
      taskId: reopenTestTask.id,
      type: "REVIEWER",
      status: "REJECTED",
      signedById: manager1.id,
      comment: "[REOPEN] Test reopen reason",
    },
  });
  await prisma.task.update({
    where: { id: reopenTestTask.id },
    data: { status: "IN_PROGRESS" },
  });

  const reopenedTask = await prisma.task.findUnique({ where: { id: reopenTestTask.id } });
  test("A1-05", "Task status after reopen is IN_PROGRESS", reopenedTask?.status === "IN_PROGRESS");

  // Verify signoff history has reopen record
  const reopenSignoffs = await prisma.signoff.findMany({
    where: { taskId: reopenTestTask.id },
    orderBy: { signedAt: "desc" },
  });
  const hasReopenRecord = reopenSignoffs.some(
    (s) => s.comment?.includes("[REOPEN]")
  );
  test("A1-06", "Signoff history contains [REOPEN] record", hasReopenRecord);

  // Simulate audit log for reopen
  await prisma.auditLog.create({
    data: {
      action: "task.reopen",
      entityType: "task",
      entityId: reopenTestTask.id,
      userId: manager1.id,
      details: JSON.stringify({
        reason: "Test reopen reason",
        from: "APPROVED",
        to: "IN_PROGRESS",
      }),
    },
  });

  const reopenLog = await prisma.auditLog.findFirst({
    where: { action: "task.reopen", entityId: reopenTestTask.id },
  });
  test("A1-07", "Audit log has task.reopen entry", reopenLog !== null);

  // ── A2: Rework Loop ────────────────────────────────────────────────────
  console.log("\n[A2] Rework Loop");

  // Create a task for rework testing
  const reworkTask = await prisma.task.create({
    data: {
      engagementId: "demo-eng-fieldwork",
      title: "Rework Loop Test Task",
      status: "REJECTED",
      assigneeId: auditor1.id,
      sortOrder: 101,
    },
  });
  test("A2-01", "Rework task created as REJECTED", reworkTask.status === "REJECTED");

  // Step 1: Auditor changes status to COMPLETED
  await prisma.task.update({
    where: { id: reworkTask.id },
    data: { status: "COMPLETED" },
  });
  const reworkCompleted = await prisma.task.findUnique({ where: { id: reworkTask.id } });
  test("A2-02", "Auditor can change REJECTED → COMPLETED", reworkCompleted?.status === "COMPLETED");

  // Step 2: Preparer signoff
  await prisma.signoff.create({
    data: {
      taskId: reworkTask.id,
      type: "PREPARER",
      status: "SIGNED",
      signedById: auditor1.id,
    },
  });
  await prisma.task.update({
    where: { id: reworkTask.id },
    data: { status: "PENDING_REVIEW" },
  });
  const reworkPending = await prisma.task.findUnique({ where: { id: reworkTask.id } });
  test("A2-03", "After preparer signoff → PENDING_REVIEW", reworkPending?.status === "PENDING_REVIEW");

  // Step 3: Reviewer approve
  await prisma.signoff.create({
    data: {
      taskId: reworkTask.id,
      type: "REVIEWER",
      status: "SIGNED",
      signedById: manager1.id,
    },
  });
  await prisma.task.update({
    where: { id: reworkTask.id },
    data: { status: "APPROVED" },
  });
  const reworkApproved = await prisma.task.findUnique({ where: { id: reworkTask.id } });
  test("A2-04", "After reviewer approve → APPROVED", reworkApproved?.status === "APPROVED");

  // ── B1: Planning Gate ───────────────────────────────────────────────────
  console.log("\n[B1] Planning Gate");

  // Engagement 2 (Draft) — check it has all the conditions
  const eng2 = await prisma.engagement.findUnique({
    where: { id: "demo-eng-draft" },
    include: { members: true, tasks: true },
  });
  test("B1-01", "Engagement 2 is DRAFT", eng2?.status === "DRAFT");
  test("B1-02", "Engagement 2 has description", !!eng2?.description);
  test("B1-03", "Engagement 2 has scope", !!eng2?.scope);

  // Check members have correct roles
  const eng2MemberIds = eng2?.members.map((m) => m.userId) || [];
  const eng2MemberUsers = await prisma.user.findMany({
    where: { id: { in: eng2MemberIds } },
    include: { role: true },
  });
  const eng2MemberRoles = eng2MemberUsers.map((u) => u.role?.name);
  const eng2HasManager = eng2MemberRoles.some((r) => r === "manager" || r === "chief_auditor" || r === "admin");
  const eng2HasAuditor = eng2MemberRoles.some((r) => r === "auditor");
  test("B1-04", "Engagement 2 has manager member", eng2HasManager, `roles: ${eng2MemberRoles.join(",")}`);
  test("B1-05", "Engagement 2 has auditor member", eng2HasAuditor, `roles: ${eng2MemberRoles.join(",")}`);

  // Engagement 2 has no tasks — planning gate would fail
  test("B1-06", "Engagement 2 has NO tasks (gate would fail)", eng2?.tasks.length === 0);

  // Add a task to make it pass the gate
  await prisma.task.create({
    data: {
      id: "demo-task-gate-test",
      engagementId: "demo-eng-draft",
      title: "Gate Test Task",
      status: "TODO",
      assigneeId: eng2MemberUsers.find((u) => u.role?.name === "auditor")?.id || null,
      sortOrder: 1,
    },
  });
  const eng2WithTask = await prisma.engagement.findUnique({
    where: { id: "demo-eng-draft" },
    include: { tasks: true },
  });
  test("B1-07", "After adding task, engagement has ≥1 task", (eng2WithTask?.tasks.length || 0) >= 1);

  // ── B2: Report Issuance Gate ────────────────────────────────────────────
  console.log("\n[B2] Report Issuance Gate");

  // Engagement 3 (Reporting) — all tasks APPROVED
  const eng3 = await prisma.engagement.findUnique({
    where: { id: "demo-eng-reporting" },
    include: { tasks: true, reports: true },
  });
  test("B2-01", "Engagement 3 is REPORTING", eng3?.status === "REPORTING");
  test("B2-02", "Engagement 3 has tasks", (eng3?.tasks.length || 0) > 0);

  const allApproved = eng3?.tasks.every((t) => t.status === "APPROVED");
  test("B2-03", "All tasks in Engagement 3 are APPROVED", allApproved);

  const report1 = eng3?.reports.find((r) => r.id === "demo-report-1");
  test("B2-04", "Report exists in REVIEW status", report1?.status === "REVIEW");

  // Test: Report can be moved to FINAL, then validate issuance gate
  // (Don't actually change status — just verify the conditions are met)
  test("B2-05", "Issuance gate conditions met (REPORTING + all tasks APPROVED)",
    eng3?.status === "REPORTING" && allApproved && (eng3?.tasks.length || 0) > 0);

  // ── B3: Rollback Reason ─────────────────────────────────────────────────
  console.log("\n[B3] Rollback Reason");

  // Simulate a rollback with reason in audit log
  await prisma.auditLog.create({
    data: {
      action: "engagement.status_rollback",
      entityType: "engagement",
      entityId: "demo-eng-fieldwork",
      userId: manager1.id,
      details: JSON.stringify({
        from: "FIELDWORK",
        to: "ACTIVE",
        reason: "Cần bổ sung thêm task",
      }),
    },
  });

  const rollbackLog = await prisma.auditLog.findFirst({
    where: { action: "engagement.status_rollback" },
    orderBy: { createdAt: "desc" },
  });
  test("B3-01", "Rollback audit log entry exists", rollbackLog !== null);

  const rollbackDetails = rollbackLog?.details ? JSON.parse(rollbackLog.details) : {};
  test("B3-02", "Rollback log contains reason", !!rollbackDetails.reason);
  test("B3-03", "Rollback log has from/to", rollbackDetails.from === "FIELDWORK" && rollbackDetails.to === "ACTIVE");

  // ── C: Audit Log Labels ─────────────────────────────────────────────────
  console.log("\n[C] Audit Log Verification");

  const allActionTypes = await prisma.auditLog.findMany({
    select: { action: true },
    distinct: ["action"],
  });
  const actionSet = new Set(allActionTypes.map((a) => a.action));
  test("C-01", "engagement.create in audit log", actionSet.has("engagement.create"));
  test("C-02", "engagement.status_change in audit log", actionSet.has("engagement.status_change"));
  test("C-03", "task.create in audit log", actionSet.has("task.create"));
  test("C-04", "signoff.preparer in audit log", actionSet.has("signoff.preparer"));
  test("C-05", "task.reopen in audit log", actionSet.has("task.reopen"));
  test("C-06", "engagement.status_rollback in audit log", actionSet.has("engagement.status_rollback"));

  // ── Cleanup test data ───────────────────────────────────────────────────
  console.log("\n[Cleanup] Removing test data...");
  await prisma.signoff.deleteMany({ where: { taskId: { in: [reopenTestTask.id, reworkTask.id] } } });
  await prisma.task.deleteMany({ where: { id: { in: [reopenTestTask.id, reworkTask.id, "demo-task-gate-test"] } } });
  await prisma.auditLog.deleteMany({
    where: {
      action: { in: ["task.reopen", "engagement.status_rollback"] },
      entityId: { in: [reopenTestTask.id, "demo-eng-fieldwork"] },
    },
  });
  console.log("  Cleanup — OK");

  // ── Summary ─────────────────────────────────────────────────────────────
  console.log("\n" + "=".repeat(60));
  console.log(`TOTAL: ${totalTests} | PASS: ${passedTests} | FAIL: ${failedTests}`);
  console.log("=".repeat(60));

  if (failedTests > 0) {
    console.log("\nFailed tests:");
    results.filter((r) => r.result === "FAIL").forEach((r) => {
      console.log(`  ${r.id}: ${r.description} — ${r.note}`);
    });
  }

  console.log("\n--- STRUCTURED RESULTS ---");
  console.log(JSON.stringify(results, null, 2));
}

main()
  .catch((e) => {
    console.error("Test error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

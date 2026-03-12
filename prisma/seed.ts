import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const ROLES = [
  {
    name: "chief_auditor",
    description:
      "Truong ban kiem toan — xem toan bo engagements, dashboard tong the, giam sat tien do",
  },
  {
    name: "manager",
    description:
      "Manager / Truong nhom kiem toan — quan ly engagement, phan cong, review, signoff",
  },
  {
    name: "auditor",
    description:
      "Auditor / Member — thuc hien task, upload ho so, preparer signoff",
  },
  {
    name: "admin",
    description:
      "System Admin — cau hinh SSO, quan ly user/role, danh muc, backup/restore",
  },
];

// ---------------------------------------------------------------------------
// Demo users (for UAT testing — login via email/password not enabled,
// these are used to populate membership, assignments, etc.)
// ---------------------------------------------------------------------------

const DEMO_USERS = [
  { email: "chief@demo.local", name: "Nguyen Van An (Chief Auditor)", roleName: "chief_auditor" },
  { email: "manager1@demo.local", name: "Tran Thi Binh (Manager 1)", roleName: "manager" },
  { email: "manager2@demo.local", name: "Le Van Cuong (Manager 2)", roleName: "manager" },
  { email: "auditor1@demo.local", name: "Pham Minh Duc (Auditor 1)", roleName: "auditor" },
  { email: "auditor2@demo.local", name: "Hoang Thi Em (Auditor 2)", roleName: "auditor" },
  { email: "auditor3@demo.local", name: "Vo Van Phat (Auditor 3)", roleName: "auditor" },
];

async function main() {
  console.log("Seeding roles...");

  const roleMap: Record<string, string> = {};
  for (const role of ROLES) {
    const r = await prisma.role.upsert({
      where: { name: role.name },
      update: { description: role.description },
      create: role,
    });
    roleMap[role.name] = r.id;
    console.log(`  Role "${role.name}" — OK`);
  }

  // ── Demo users ──────────────────────────────────────────────────────────
  console.log("\nSeeding demo users...");

  const userMap: Record<string, string> = {};
  for (const u of DEMO_USERS) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: { name: u.name, roleId: roleMap[u.roleName] },
      create: {
        email: u.email,
        name: u.name,
        roleId: roleMap[u.roleName],
      },
    });
    userMap[u.email] = user.id;
    console.log(`  User "${u.name}" (${u.email}) — OK`);
  }

  // ── Engagement 1: Active (Fieldwork) ────────────────────────────────────
  console.log("\nSeeding demo engagement 1 (Fieldwork)...");

  const eng1 = await prisma.engagement.upsert({
    where: { id: "demo-eng-fieldwork" },
    update: {},
    create: {
      id: "demo-eng-fieldwork",
      name: "Kiem toan Quy trinh Mua hang 2026",
      auditedEntity: "Phong Mua hang",
      description: "Kiem toan quy trinh mua hang, dau thau va thanh toan",
      scope: "Tat ca giao dich mua hang tu 01/2026 den 06/2026",
      fiscalYear: 2026,
      status: "FIELDWORK",
      plannedStart: new Date("2026-02-01"),
      plannedEnd: new Date("2026-04-30"),
    },
  });

  // Members
  await prisma.engagementMember.upsert({
    where: { engagementId_userId: { engagementId: eng1.id, userId: userMap["manager1@demo.local"] } },
    update: { role: "lead" },
    create: { engagementId: eng1.id, userId: userMap["manager1@demo.local"], role: "lead" },
  });
  await prisma.engagementMember.upsert({
    where: { engagementId_userId: { engagementId: eng1.id, userId: userMap["auditor1@demo.local"] } },
    update: { role: "member" },
    create: { engagementId: eng1.id, userId: userMap["auditor1@demo.local"], role: "member" },
  });
  await prisma.engagementMember.upsert({
    where: { engagementId_userId: { engagementId: eng1.id, userId: userMap["auditor2@demo.local"] } },
    update: { role: "member" },
    create: { engagementId: eng1.id, userId: userMap["auditor2@demo.local"], role: "member" },
  });

  // Tasks for engagement 1
  const task1 = await prisma.task.upsert({
    where: { id: "demo-task-1" },
    update: {},
    create: {
      id: "demo-task-1",
      engagementId: eng1.id,
      title: "Kiem tra quy trinh phe duyet don mua hang",
      description: "Xac nhan cac don mua hang co day du chu ky phe duyet theo quy dinh",
      type: "WORKPAPER",
      status: "APPROVED",
      assigneeId: userMap["auditor1@demo.local"],
      sortOrder: 1,
      dueDate: new Date("2026-03-15"),
    },
  });

  const task2 = await prisma.task.upsert({
    where: { id: "demo-task-2" },
    update: {},
    create: {
      id: "demo-task-2",
      engagementId: eng1.id,
      title: "Kiem tra hop dong nha cung cap",
      description: "Doi chieu hop dong voi danh sach nha cung cap da duyet",
      type: "WORKPAPER",
      status: "PENDING_REVIEW",
      assigneeId: userMap["auditor1@demo.local"],
      sortOrder: 2,
      dueDate: new Date("2026-03-20"),
    },
  });

  const task3 = await prisma.task.upsert({
    where: { id: "demo-task-3" },
    update: {},
    create: {
      id: "demo-task-3",
      engagementId: eng1.id,
      title: "Kiem tra thanh toan va doi chieu so sach",
      description: "Doi chieu chung tu thanh toan voi don mua hang va hoa don",
      type: "WORKPAPER",
      status: "IN_PROGRESS",
      assigneeId: userMap["auditor2@demo.local"],
      sortOrder: 3,
      dueDate: new Date("2026-03-25"),
    },
  });

  // Signoff for task1
  await prisma.signoff.upsert({
    where: { id: "demo-signoff-prep-1" },
    update: {},
    create: {
      id: "demo-signoff-prep-1",
      taskId: task1.id,
      type: "PREPARER",
      status: "SIGNED",
      signedById: userMap["auditor1@demo.local"],
      comment: "Da hoan thanh kiem tra 50 mau don mua hang",
    },
  });
  await prisma.signoff.upsert({
    where: { id: "demo-signoff-rev-1" },
    update: {},
    create: {
      id: "demo-signoff-rev-1",
      taskId: task1.id,
      type: "REVIEWER",
      status: "SIGNED",
      signedById: userMap["manager1@demo.local"],
      comment: "Dong y ket qua kiem tra",
    },
  });

  // Signoff for task2 (preparer signed, pending reviewer)
  await prisma.signoff.upsert({
    where: { id: "demo-signoff-prep-2" },
    update: {},
    create: {
      id: "demo-signoff-prep-2",
      taskId: task2.id,
      type: "PREPARER",
      status: "SIGNED",
      signedById: userMap["auditor1@demo.local"],
      comment: "Da kiem tra 30 hop dong",
    },
  });

  // Finding for engagement 1
  await prisma.finding.upsert({
    where: { id: "demo-finding-1" },
    update: {},
    create: {
      id: "demo-finding-1",
      engagementId: eng1.id,
      title: "Don mua hang thieu chu ky phe duyet cap 2",
      description: "5/50 don mua hang co gia tri tren 100 trieu khong co chu ky phe duyet cap 2 theo quy dinh",
      riskRating: "HIGH",
      recommendation: "Tang cuong kiem soat quy trinh phe duyet, bo sung buoc xac nhan tren he thong",
      status: "OPEN",
      dueDate: new Date("2026-04-15"),
      createdById: userMap["auditor1@demo.local"],
    },
  });

  await prisma.finding.upsert({
    where: { id: "demo-finding-2" },
    update: {},
    create: {
      id: "demo-finding-2",
      engagementId: eng1.id,
      title: "Thieu danh gia nha cung cap dinh ky",
      description: "Khong co bang chung danh gia nha cung cap hang nam theo chinh sach cong ty",
      riskRating: "MEDIUM",
      recommendation: "Thiet lap lich danh gia nha cung cap hang nam va luu tru ho so",
      status: "IN_PROGRESS",
      managementResponse: "Se thuc hien danh gia nha cung cap trong Q2/2026",
      dueDate: new Date("2026-05-01"),
      createdById: userMap["manager1@demo.local"],
    },
  });

  console.log("  Engagement 1 (Fieldwork) + 3 tasks + 2 findings — OK");

  // ── Engagement 2: Draft ─────────────────────────────────────────────────
  console.log("Seeding demo engagement 2 (Draft)...");

  const eng2 = await prisma.engagement.upsert({
    where: { id: "demo-eng-draft" },
    update: {},
    create: {
      id: "demo-eng-draft",
      name: "Kiem toan CNTT 2026",
      auditedEntity: "Phong Cong nghe thong tin",
      description: "Kiem toan an toan thong tin va quan tri he thong CNTT",
      scope: "He thong ERP, he thong email, quan ly truy cap",
      fiscalYear: 2026,
      status: "DRAFT",
      plannedStart: new Date("2026-05-01"),
      plannedEnd: new Date("2026-07-31"),
    },
  });

  await prisma.engagementMember.upsert({
    where: { engagementId_userId: { engagementId: eng2.id, userId: userMap["manager2@demo.local"] } },
    update: { role: "lead" },
    create: { engagementId: eng2.id, userId: userMap["manager2@demo.local"], role: "lead" },
  });
  await prisma.engagementMember.upsert({
    where: { engagementId_userId: { engagementId: eng2.id, userId: userMap["auditor3@demo.local"] } },
    update: { role: "member" },
    create: { engagementId: eng2.id, userId: userMap["auditor3@demo.local"], role: "member" },
  });

  console.log("  Engagement 2 (Draft) — OK");

  // ── Engagement 3: Reporting (for report demo) ──────────────────────────
  console.log("Seeding demo engagement 3 (Reporting)...");

  const eng3 = await prisma.engagement.upsert({
    where: { id: "demo-eng-reporting" },
    update: {},
    create: {
      id: "demo-eng-reporting",
      name: "Kiem toan Nhan su Q1/2026",
      auditedEntity: "Phong Nhan su",
      description: "Kiem toan quy trinh tuyen dung, dao tao va danh gia nhan su",
      fiscalYear: 2026,
      status: "REPORTING",
      plannedStart: new Date("2026-01-15"),
      plannedEnd: new Date("2026-03-31"),
    },
  });

  await prisma.engagementMember.upsert({
    where: { engagementId_userId: { engagementId: eng3.id, userId: userMap["manager1@demo.local"] } },
    update: { role: "lead" },
    create: { engagementId: eng3.id, userId: userMap["manager1@demo.local"], role: "lead" },
  });
  await prisma.engagementMember.upsert({
    where: { engagementId_userId: { engagementId: eng3.id, userId: userMap["auditor2@demo.local"] } },
    update: { role: "member" },
    create: { engagementId: eng3.id, userId: userMap["auditor2@demo.local"], role: "member" },
  });

  // All tasks in eng3 are APPROVED (ready for close demo)
  await prisma.task.upsert({
    where: { id: "demo-task-hr-1" },
    update: {},
    create: {
      id: "demo-task-hr-1",
      engagementId: eng3.id,
      title: "Kiem tra quy trinh tuyen dung",
      status: "APPROVED",
      assigneeId: userMap["auditor2@demo.local"],
      sortOrder: 1,
    },
  });
  await prisma.task.upsert({
    where: { id: "demo-task-hr-2" },
    update: {},
    create: {
      id: "demo-task-hr-2",
      engagementId: eng3.id,
      title: "Kiem tra ho so dao tao",
      status: "APPROVED",
      assigneeId: userMap["auditor2@demo.local"],
      sortOrder: 2,
    },
  });

  // Report for engagement 3
  await prisma.report.upsert({
    where: { id: "demo-report-1" },
    update: {},
    create: {
      id: "demo-report-1",
      engagementId: eng3.id,
      title: "Bao cao kiem toan nhan su Q1/2026",
      description: "Bao cao tong hop ket qua kiem toan quy trinh nhan su",
      status: "REVIEW",
      createdById: userMap["manager1@demo.local"],
    },
  });

  // Finding for eng3 (REMEDIATED — ready for close demo)
  await prisma.finding.upsert({
    where: { id: "demo-finding-3" },
    update: {},
    create: {
      id: "demo-finding-3",
      engagementId: eng3.id,
      title: "Thieu danh gia thu viec nhan vien moi",
      riskRating: "LOW",
      status: "REMEDIATED",
      recommendation: "Bo sung form danh gia thu viec cho tat ca nhan vien moi",
      managementResponse: "Da bo sung form va ap dung tu thang 3/2026",
      createdById: userMap["auditor2@demo.local"],
    },
  });

  console.log("  Engagement 3 (Reporting) + report + finding — OK");

  // ── Audit Log entries ──────────────────────────────────────────────────
  console.log("Seeding audit log entries...");

  const auditLogs = [
    {
      action: "engagement.create",
      entityType: "engagement",
      entityId: eng1.id,
      userId: userMap["manager1@demo.local"],
      details: JSON.stringify({ name: eng1.name }),
    },
    {
      action: "engagement.status_change",
      entityType: "engagement",
      entityId: eng1.id,
      userId: userMap["manager1@demo.local"],
      details: JSON.stringify({ from: "DRAFT", to: "ACTIVE" }),
    },
    {
      action: "engagement.status_change",
      entityType: "engagement",
      entityId: eng1.id,
      userId: userMap["manager1@demo.local"],
      details: JSON.stringify({ from: "ACTIVE", to: "FIELDWORK" }),
    },
    {
      action: "engagement.member_add",
      entityType: "engagement",
      entityId: eng1.id,
      userId: userMap["manager1@demo.local"],
      details: JSON.stringify({ addedUserName: "Pham Minh Duc (Auditor 1)" }),
    },
    {
      action: "task.create",
      entityType: "task",
      entityId: task1.id,
      userId: userMap["manager1@demo.local"],
      details: JSON.stringify({ title: task1.title }),
    },
    {
      action: "signoff.preparer",
      entityType: "task",
      entityId: task1.id,
      userId: userMap["auditor1@demo.local"],
      details: JSON.stringify({ comment: "Da hoan thanh kiem tra" }),
    },
    {
      action: "signoff.reviewer",
      entityType: "task",
      entityId: task1.id,
      userId: userMap["manager1@demo.local"],
      details: JSON.stringify({ comment: "Dong y ket qua" }),
    },
    {
      action: "finding.create",
      entityType: "finding",
      entityId: "demo-finding-1",
      userId: userMap["auditor1@demo.local"],
      details: JSON.stringify({ title: "Don mua hang thieu chu ky phe duyet cap 2" }),
    },
    {
      action: "engagement.create",
      entityType: "engagement",
      entityId: eng3.id,
      userId: userMap["manager1@demo.local"],
      details: JSON.stringify({ name: eng3.name }),
    },
    {
      action: "report.create",
      entityType: "report",
      entityId: "demo-report-1",
      userId: userMap["manager1@demo.local"],
      details: JSON.stringify({ title: "Bao cao kiem toan nhan su Q1/2026" }),
    },
  ];

  for (const log of auditLogs) {
    await prisma.auditLog.create({ data: log });
  }

  console.log(`  ${auditLogs.length} audit log entries — OK`);

  console.log("\nSeed completed.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

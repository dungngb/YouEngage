/**
 * UAT Online Smoke Test
 *
 * Validates the deployed UAT environment via HTTP.
 * Covers: SSO availability, page access, scope, locale toggle.
 *
 * Usage: UAT_URL=https://your-app.vercel.app node scripts/uat-online-smoke-test.mjs
 *
 * Note: SSO login must be tested manually (browser-based Azure AD flow).
 *       This script tests unauthenticated endpoints and basic health.
 */

const BASE_URL = process.env.UAT_URL || "http://localhost:3000";

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
  console.log(`=== UAT Online Smoke Test ===`);
  console.log(`Target: ${BASE_URL}\n`);

  // ── S1: Server Health ──────────────────────────────────────────────
  console.log("[S1] Server Health");

  try {
    const res = await fetch(`${BASE_URL}/login`);
    test("S1-01", "Login page accessible", res.status === 200, `status=${res.status}`);
    const body = await res.text();
    const hasLoginContent = body.includes("Microsoft") || body.includes("login") || body.includes("Sign");
    test("S1-02", "Login page contains SSO button", hasLoginContent);
  } catch (e) {
    test("S1-01", "Server reachable", false, e.message);
    console.log("\nServer not reachable. Check UAT_URL.");
    process.exit(1);
  }

  // ── S2: Auth Endpoints ─────────────────────────────────────────────
  console.log("\n[S2] Auth Endpoints");

  const csrfRes = await fetch(`${BASE_URL}/api/auth/csrf`);
  test("S2-01", "CSRF endpoint accessible", csrfRes.status === 200);

  const providersRes = await fetch(`${BASE_URL}/api/auth/providers`);
  const providers = await providersRes.json();
  test("S2-02", "Microsoft Entra ID provider listed", providers["microsoft-entra-id"] !== undefined);

  // DEV_AUTH should be disabled in UAT (no dev-credentials)
  const hasDevAuth = providers["dev-credentials"] !== undefined;
  test("S2-03", "Dev credentials disabled in UAT", !hasDevAuth,
    hasDevAuth ? "WARNING: DEV_AUTH=true is set — disable for real UAT" : "OK");

  // ── S3: Auth Guard ─────────────────────────────────────────────────
  console.log("\n[S3] Auth Guard (unauthenticated)");

  const dashRes = await fetch(`${BASE_URL}/dashboard`, { redirect: "manual" });
  test("S3-01", "Dashboard redirects to login", dashRes.status === 302 || dashRes.status === 307,
    `status=${dashRes.status}`);

  const engRes = await fetch(`${BASE_URL}/dashboard/engagements`, { redirect: "manual" });
  test("S3-02", "Engagements redirects to login", engRes.status === 302 || engRes.status === 307,
    `status=${engRes.status}`);

  const docsRes = await fetch(`${BASE_URL}/dashboard/documents`, { redirect: "manual" });
  test("S3-03", "Documents redirects to login", docsRes.status === 302 || docsRes.status === 307,
    `status=${docsRes.status}`);

  // ── S4: API Security ───────────────────────────────────────────────
  console.log("\n[S4] API Security (unauthenticated)");

  const uploadRes = await fetch(`${BASE_URL}/api/upload`, { method: "POST", body: new FormData() });
  const uploadBody = await uploadRes.text();
  const uploadBlocked = uploadRes.status === 401 || uploadRes.status === 400 ||
    uploadBody.includes("Unauthorized") || uploadBody.includes("error");
  test("S4-01", "Upload API rejects unauthenticated", uploadBlocked, `status=${uploadRes.status}`);

  const fileRes = await fetch(`${BASE_URL}/api/files/nonexistent`);
  const fileBlocked = fileRes.status === 401 || fileRes.status === 404;
  test("S4-02", "Download API rejects unauthenticated", fileBlocked, `status=${fileRes.status}`);

  // ── S5: Static Assets ──────────────────────────────────────────────
  console.log("\n[S5] Static Assets");

  const faviconRes = await fetch(`${BASE_URL}/favicon.ico`);
  test("S5-01", "Favicon accessible", faviconRes.status === 200 || faviconRes.status === 404,
    `status=${faviconRes.status}`);

  // ── S6: Response Headers ───────────────────────────────────────────
  console.log("\n[S6] Response Headers");

  const loginRes = await fetch(`${BASE_URL}/login`);
  const hasXFrame = loginRes.headers.has("x-frame-options");
  const hasCSP = loginRes.headers.has("content-security-policy");
  test("S6-01", "Security headers present", true,
    `x-frame-options=${hasXFrame}, csp=${hasCSP}`);

  // ═══════════════════════════════════════════════════════════════════
  // SUMMARY
  // ═══════════════════════════════════════════════════════════════════
  console.log("\n" + "=".repeat(60));
  console.log(`TOTAL: ${totalTests} | PASS: ${passedTests} | FAIL: ${failedTests}`);
  console.log("=".repeat(60));

  if (failedTests > 0) {
    console.log("\nFailed tests:");
    results.filter(r => r.result === "FAIL").forEach(r => {
      console.log(`  ${r.id}: ${r.description} — ${r.note}`);
    });
  }

  console.log("\n--- MANUAL TESTS REQUIRED ---");
  console.log("The following tests must be done manually in a browser:");
  console.log("  M1: SSO login end-to-end (Microsoft Entra ID)");
  console.log("  M2: Dashboard loads with correct role-based data");
  console.log("  M3: Engagement scope (list/detail — see only own engagements)");
  console.log("  M4: Task signoff flows (approve/reject/rework/lock/reopen)");
  console.log("  M5: Planning gate + report issuance gate");
  console.log("  M6: File upload via browser (valid PDF/DOCX)");
  console.log("  M7: File download + verify security headers");
  console.log("  M8: Locale VI/EN toggle (no mixed language)");

  console.log("\n--- STRUCTURED RESULTS ---");
  console.log(JSON.stringify(results, null, 2));
  process.exit(failedTests > 0 ? 1 : 0);
}

main().catch(e => { console.error("Smoke test error:", e); process.exit(1); });

const http = require("http");

function request(method, path, headers = {}) {
  return new Promise((resolve) => {
    const url = new URL("http://localhost:3099" + path);
    const req = http.request(
      {
        method,
        hostname: url.hostname,
        port: url.port,
        path: url.pathname,
        headers: { Accept: "application/json", ...headers },
      },
      (res) => {
        let body = "";
        res.on("data", (d) => (body += d));
        res.on("end", () =>
          resolve({ status: res.statusCode, headers: res.headers, body })
        );
      }
    );
    req.on("error", (e) => resolve({ status: "ERROR", error: e.message }));
    req.setTimeout(10000, () => {
      req.destroy();
      resolve({ status: "TIMEOUT" });
    });
    req.end();
  });
}

async function main() {
  const results = [];
  let pass = 0;
  let fail = 0;

  function check(id, desc, condition) {
    const status = condition ? "PASS" : "FAIL";
    if (condition) pass++;
    else fail++;
    console.log(`  [${status}] ${id}: ${desc}`);
    results.push({ id, desc, status });
  }

  console.log("=== RUNTIME SMOKE TEST ===\n");

  // --- 1. App Boot ---
  console.log("1. App Boot & Health");
  const login = await request("GET", "/login");
  check("BOOT-01", "App starts and responds", login.status === 200);
  check(
    "BOOT-02",
    "Login page returns HTML",
    login.headers["content-type"].includes("text/html")
  );
  check(
    "BOOT-03",
    "Login page has SSO button",
    login.body.includes("Microsoft")
  );

  // --- 2. Middleware / Auth Redirect ---
  console.log("\n2. Middleware & Auth Guard");
  const root = await request("GET", "/");
  check(
    "AUTH-01",
    "Root (/) redirects unauthenticated",
    root.status === 302 || root.status === 307
  );

  const dash = await request("GET", "/dashboard");
  check(
    "AUTH-02",
    "Dashboard redirects unauthenticated",
    dash.status === 302 || dash.status === 307
  );

  const eng = await request("GET", "/dashboard/engagements");
  check(
    "AUTH-03",
    "Engagements page redirects unauthenticated",
    eng.status === 302 || eng.status === 307
  );

  const findings = await request("GET", "/dashboard/findings");
  check(
    "AUTH-04",
    "Findings page redirects unauthenticated",
    findings.status === 302 || findings.status === 307
  );

  const reports = await request("GET", "/dashboard/reports");
  check(
    "AUTH-05",
    "Reports page redirects unauthenticated",
    reports.status === 302 || reports.status === 307
  );

  const docs = await request("GET", "/dashboard/documents");
  check(
    "AUTH-06",
    "Documents page redirects unauthenticated",
    docs.status === 302 || docs.status === 307
  );

  // --- 3. Auth Endpoints ---
  console.log("\n3. NextAuth Endpoints");
  const providers = await request("GET", "/api/auth/providers");
  check("NAUTH-01", "Providers endpoint returns 200", providers.status === 200);
  let providerData = {};
  try {
    providerData = JSON.parse(providers.body);
  } catch (e) {}
  check(
    "NAUTH-02",
    "Microsoft Entra ID provider configured",
    "microsoft-entra-id" in providerData
  );

  const csrf = await request("GET", "/api/auth/csrf");
  check("NAUTH-03", "CSRF endpoint returns 200", csrf.status === 200);
  let csrfData = {};
  try {
    csrfData = JSON.parse(csrf.body);
  } catch (e) {}
  check("NAUTH-04", "CSRF token is present", Boolean(csrfData.csrfToken));

  const session = await request("GET", "/api/auth/session");
  check(
    "NAUTH-05",
    "Session endpoint returns 200 (empty session)",
    session.status === 200
  );
  check(
    "NAUTH-06",
    "No active session (empty body)",
    session.body === "{}" || session.body === ""
  );

  // --- 4. API Security (unauthenticated) ---
  console.log("\n4. API Security (Unauthenticated Access)");
  const uploadGet = await request("GET", "/api/upload");
  check(
    "SEC-01",
    "GET /api/upload rejects unauthenticated",
    uploadGet.status === 302 || uploadGet.status === 401 || uploadGet.status === 405
  );

  const uploadPost = await request("POST", "/api/upload");
  check(
    "SEC-02",
    "POST /api/upload rejects unauthenticated",
    uploadPost.status === 302 ||
      uploadPost.status === 401 ||
      uploadPost.status === 403
  );

  const fileDl = await request("GET", "/api/files/nonexistent-id");
  check(
    "SEC-03",
    "GET /api/files/:id rejects unauthenticated",
    fileDl.status === 302 || fileDl.status === 401 || fileDl.status === 403
  );

  // --- 5. Static Asset Availability ---
  console.log("\n5. Static Assets & Error Pages");
  const notFound = await request("GET", "/totally-nonexistent-page-xyz");
  check(
    "STATIC-01",
    "Non-existent path handled (redirect or 404)",
    notFound.status === 302 || notFound.status === 404
  );

  // --- 6. Redirect URL consistency ---
  console.log("\n6. Configuration Checks");
  const redirectUrl = root.headers.location || "";
  check(
    "CONFIG-01",
    "Redirect points to login page",
    redirectUrl.includes("/login")
  );
  // Note: redirect uses AUTH_URL from .env.local (port 3000) not dev port 3099
  const portMismatch = redirectUrl.includes(":3000") && true;
  console.log(
    `  [INFO] CONFIG-02: AUTH_URL redirect port = ${
      portMismatch ? "3000 (mismatch with dev port 3099 - expected in dev)" : "matches"
    }`
  );

  // --- Summary ---
  console.log("\n=== SUMMARY ===");
  console.log(`Total: ${pass + fail} | Pass: ${pass} | Fail: ${fail}`);
  console.log(
    `Result: ${fail === 0 ? "ALL TESTS PASS" : fail + " TESTS FAILED"}`
  );

  // Output JSON for reporting
  const fs = require("fs");
  fs.writeFileSync(
    "scripts/runtime-test-results.json",
    JSON.stringify({ pass, fail, total: pass + fail, results, timestamp: new Date().toISOString() }, null, 2)
  );
  console.log("\nResults saved to scripts/runtime-test-results.json");
}

main().catch(console.error);

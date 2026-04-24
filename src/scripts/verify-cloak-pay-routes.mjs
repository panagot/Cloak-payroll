/**
 * HTTP smoke: fetch every Cloak Pay route and assert 200 + basic body checks.
 * Run the app first: `npm run dev` (default port 3000) or set BASE_URL, e.g.:
 *   set BASE_URL=http://127.0.0.1:3006   (PowerShell)
 *   BASE_URL=http://127.0.0.1:3006 node src/scripts/verify-cloak-pay-routes.mjs
 */

const base = process.env.BASE_URL?.replace(/\/$/, "") || "http://127.0.0.1:3000";

const paths = [
  { path: "/cloak-pay", mustInclude: ["Cloak Pay", "in this app"] },
  {
    path: "/cloak-pay/merchant",
    mustInclude: ["Merchant", "Shielded receive address", "Pay link", "Encoded URL", "cloak-pay/pay"],
  },
  {
    path: "/cloak-pay/present",
    mustInclude: ["Shielded receive address", "Pay link"],
  },
  { path: "/cloak-pay/pay", mustInclude: ["Pay with shielded USDC", "Checkout"] },
  {
    path: "/cloak-pay/pay?source=qr&label=TestCafe&amount=5.00",
    mustInclude: ["TestCafe", "Pay with shielded USDC"],
  },
  { path: "/cloak-pay/activity", mustInclude: ["Activity", "Recent payments"] },
  { path: "/cloak-pay/settings", mustInclude: ["Settings", "Network", "Privacy"] },
];

async function checkPage({ path, mustInclude }) {
  const url = `${base}${path}`;
  const res = await fetch(url, { redirect: "follow" });
  const text = await res.text();
  const ok = res.ok;
  const missing = mustInclude.filter((s) => !text.includes(s));
  return { url, status: res.status, ok, missing, len: text.length, snippet: text.slice(0, 160) };
}

async function main() {
  console.log(`verify-cloak-pay-routes: GET ${base} (set BASE_URL to change)\n`);
  const results = await Promise.all(paths.map((p) => checkPage(p)));
  let failed = 0;
  for (const r of results) {
    if (!r.ok || r.missing.length) {
      failed += 1;
      const hint = r.status >= 500 ? ` body=${JSON.stringify(r.snippet)}` : "";
      console.log(
        `FAIL ${r.url} status=${r.status} bodyLen=${r.len} missing=${r.missing.length ? JSON.stringify(r.missing) : "—"}${hint}`
      );
    } else {
      console.log(`ok   ${r.url} status=${r.status} bodyLen=${r.len}`);
    }
  }
  if (failed) {
    console.log(`\n${failed} route(s) failed. Is the dev server running? Try: npx next dev (or your port).`);
    process.exit(1);
  }
  console.log(`\nAll ${paths.length} Cloak Pay route checks passed.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

/**
 * Pure-JS check that pay link query string matches the Present page algorithm.
 * No server required; run: node src/scripts/verify-cloak-pay-url-build.mjs
 */
import { URL, URLSearchParams } from "node:url";

const CLOAK_PAY_PATH = "/cloak-pay";

function pathWithQuery(businessLabel, amount) {
  const q = new URLSearchParams();
  q.set("source", "qr");
  q.set("label", (businessLabel || "Business").slice(0, 80));
  const a = (amount || "").trim();
  if (a) q.set("amount", a);
  return `${CLOAK_PAY_PATH}/pay?${q.toString()}`;
}

function toAbsolute(pathWithQ, host = "https://store.example.com") {
  return new URL(pathWithQ, host).href;
}

let ok = true;

const p0 = pathWithQuery("Demo", "12.00");
if (p0 !== "/cloak-pay/pay?source=qr&label=Demo&amount=12.00") {
  console.log("FAIL default path", p0);
  ok = false;
}

const long = "X".repeat(90);
const pLong = pathWithQuery(long, "");
const longLabel = new URL(`https://example.com${pLong}`).searchParams.get("label");
if (longLabel.length !== 80) {
  console.log("FAIL label should slice to 80, got", longLabel.length);
  ok = false;
}

const p = pathWithQuery("Café", "1.5");
const labelRoundTrip = new URL(`https://example.com${p}`).searchParams.get("label");
if (labelRoundTrip !== "Café") {
  console.log("FAIL label round-trip", labelRoundTrip);
  ok = false;
}

if (!toAbsolute(p).includes("amount=1.5")) {
  console.log("FAIL amount on absolute", toAbsolute(p));
  ok = false;
}

if (ok) {
  console.log("verify-cloak-pay-url-build: all URL construction checks passed.");
  console.log("  example:", toAbsolute(p));
}

process.exit(ok ? 0 : 1);

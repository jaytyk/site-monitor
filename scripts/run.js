import fs from "fs/promises";
import path from "path";
import { chromium } from "playwright";

const ROOT = process.cwd();
const REPORTS_DIR = path.join(ROOT, "reports");
const INDEX_PATH = path.join(REPORTS_DIR, "index.json");
const SITES_PATH = path.join(ROOT, "sites.json");

const pad2 = (n) => String(n).padStart(2, "0");
const safeSlug = (s) =>
  s
    .toLowerCase()
    .replace(/https?:\/\//g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);

function runIdNow() {
  const d = new Date();
  return (
    d.getFullYear() +
    "-" +
    pad2(d.getMonth() + 1) +
    "-" +
    pad2(d.getDate()) +
    "_" +
    pad2(d.getHours()) +
    "-" +
    pad2(d.getMinutes()) +
    "-" +
    pad2(d.getSeconds())
  );
}

async function ensureDir(p) {
  await fs.mkdir(p, { recursive: true });
}

async function readJson(p, fallback) {
  try {
    return JSON.parse(await fs.readFile(p, "utf-8"));
  } catch {
    return fallback;
  }
}

async function writeJson(p, obj) {
  await fs.writeFile(p, JSON.stringify(obj, null, 2) + "\n", "utf-8");
}

async function limitConcurrency(items, limit, worker) {
  const results = new Array(items.length);
  let i = 0;

  const runners = Array.from({ length: Math.max(1, limit) }, async () => {
    while (true) {
      const idx = i++;
      if (idx >= items.length) return;
      results[idx] = await worker(items[idx], idx);
    }
  });

  await Promise.all(runners);
  return results;
}

async function main() {
  const cfg = await readJson(SITES_PATH, null);
  if (!cfg?.sites?.length) {
    throw new Error("sites.json에 sites가 비어있습니다.");
  }

  const settings = cfg.settings ?? {};
  const concurrency = settings.concurrency ?? 3;
  const timeoutMs = settings.timeoutMs ?? 45000;
  const retentionRuns = settings.retentionRuns ?? 200;
  const viewport = settings.viewport ?? { width: 1366, height: 768 };

  const id = runIdNow();
  const runDir = path.join(REPORTS_DIR, id);
  await ensureDir(runDir);
  await ensureDir(REPORTS_DIR);

  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox"]
  });

  const startedAt = Date.now();

  const results = await limitConcurrency(cfg.sites, concurrency, async (site, idx) => {
    const siteIndex = idx + 1;
    const shotName = `${pad2(siteIndex)}_${safeSlug(site.name || site.url)}.png`;
    const shotRel = `reports/${id}/${shotName}`;
    const shotAbs = path.join(ROOT, shotRel);

    const row = {
      name: site.name ?? `site-${siteIndex}`,
      url: site.url,
      status: "FAIL",
      httpStatus: null,
      durationMs: null,
      error: null,
      screenshot: shotRel,
      checkedAt: new Date().toISOString()
    };

    const context = await browser.newContext({
      viewport,
      locale: "ko-KR",
      timezoneId: "Asia/Seoul",
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome Safari"
    });

    const page = await context.newPage();
    page.setDefaultTimeout(timeoutMs);

    const t0 = Date.now();
    try {
      const resp = await page.goto(site.url, {
        waitUntil: site.waitUntil ?? "networkidle",
        timeout: timeoutMs
      });

      row.httpStatus = resp ? resp.status() : null;

      if (site.readySelector) {
        await page.waitForSelector(site.readySelector, { timeout: timeoutMs });
      }

      await page.screenshot({ path: shotAbs, fullPage: true });

      row.status = "OK";
      row.durationMs = Date.now() - t0;
    } catch (e) {
      row.error = String(e?.message || e);

      try {
        await page.screenshot({ path: shotAbs, fullPage: true });
      } catch {
        // 캡처조차 실패하면 스킵
      }

      row.durationMs = Date.now() - t0;
    } finally {
      await context.close();
    }

    console.log(`[${row.status}] ${row.name} (${row.url})`);
    return row;
  });

  await browser.close();

  const failed = results.filter((r) => r.status !== "OK");
  const overall = failed.length ? "FAIL" : "OK";

  const run = {
    id,
    overall,
    total: results.length,
    failed: failed.length,
    startedAt: new Date(startedAt).toISOString(),
    finishedAt: new Date().toISOString(),
    durationMs: Date.now() - startedAt,
    items: results
  };

  await writeJson(path.join(runDir, "run.json"), run);

  // index.json 업데이트(누적)
  const index = await readJson(INDEX_PATH, { runs: [] });
  index.runs.unshift({
    id,
    overall,
    total: run.total,
    failed: run.failed,
    startedAt: run.startedAt,
    finishedAt: run.finishedAt,
    durationMs: run.durationMs,
    runJson: `reports/${id}/run.json`
  });

  // 보관 개수 유지
  if (index.runs.length > retentionRuns) {
    const toRemove = index.runs.splice(retentionRuns);
    for (const r of toRemove) {
      try {
        await fs.rm(path.join(REPORTS_DIR, r.id), { recursive: true, force: true });
      } catch {}
    }
  }

  await writeJson(INDEX_PATH, index);

  // 워크플로우 실패 조건(원하면 Actions를 “실패”로 표시)
  if (overall === "FAIL") {
    process.exitCode = 1;
  }
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});

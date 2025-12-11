const LOCALE = "ko-KR";
const TIMEZONE = "Asia/Seoul"; // 항상 KST(+09:00)로 표시

const $ = (s) => document.querySelector(s);

// ✅ hash/query 포함된 href 대신 "디렉토리 기준" base를 안전하게 계산
const BASE = new URL("./", window.location.href).toString();

const state = {
  index: null,
  selectedRunId: null,
  runCache: new Map()
};

// 날짜/시간을 항상 KST 기준으로 포맷
function fmt(iso) {
  try {
    if (!iso) return "-";
    return new Intl.DateTimeFormat(LOCALE, {
      dateStyle: "medium",
      timeStyle: "medium",
      timeZone: TIMEZONE, // ✅ Asia/Seoul 고정
    }).format(new Date(iso));
  } catch {
    return iso || "-";
  }
}

function parseHash() {
  const m = location.hash.match(/run=([^&]+)/);
  return m ? decodeURIComponent(m[1]) : null;
}

function setHashRun(id) {
  location.hash = `run=${encodeURIComponent(id)}`;
}

function repoUrlGuess() {
  return "https://github.com/";
}

async function fetchJson(relUrl) {
  const u = new URL(relUrl, BASE);
  // ✅ Pages 캐시 꼬임 방지
  u.searchParams.set("v", Date.now().toString());
  const r = await fetch(u.toString(), { cache: "no-store" });
  if (!r.ok) throw new Error(`Fetch failed: ${u} (${r.status})`);
  return r.json();
}

async function loadIndex() {
  state.index = await fetchJson("reports/index.json");
  if (!state.index?.runs) state.index = { runs: [] };
}

async function loadRun(runJsonPath) {
  if (state.runCache.has(runJsonPath)) return state.runCache.get(runJsonPath);
  const data = await fetchJson(runJsonPath);
  state.runCache.set(runJsonPath, data);
  return data;
}

function renderRunList() {
  const list = $("#runList");
  list.innerHTML = "";

  const q = ($("#q").value || "").toLowerCase().trim();
  const onlyFail = $("#onlyFail").checked;

  const runs = state.index.runs.filter((r) => {
    if (onlyFail && r.overall !== "FAIL") return false;
    if (!q) return true;
    return r.id.toLowerCase().includes(q) || (r.overall || "").toLowerCase().includes(q);
  });

  const latest = state.index.runs[0];
  const latestBadge = $("#latestBadge");
  latestBadge.textContent = !latest
    ? "실행 이력 없음"
    : (latest.overall === "FAIL" ? "⚠️ 실패 있음" : "✅ 이상없음");

  for (const r of runs) {
    const el = document.createElement("div");
    el.className = "run" + (r.id === state.selectedRunId ? " active" : "");
    el.onclick = () => setHashRun(r.id);

    const pillClass = r.overall === "FAIL" ? "pill fail" : "pill ok";
    const pillText = r.overall === "FAIL"
      ? `FAIL (${r.failed}/${r.total})`
      : `OK (${r.total})`;

    el.innerHTML = `
      <div class="runTop">
        <div class="runId">${r.id}</div>
        <div class="${pillClass}">${pillText}</div>
      </div>
      <div class="runMeta">
        <span>시작: ${fmt(r.startedAt)}</span>
        <span>소요: ${Math.round((r.durationMs || 0) / 1000)}s</span>
      </div>
    `;
    list.appendChild(el);
  }
}

function renderSummary(run) {
  const summary = $("#summary");
  summary.innerHTML = `
    <div class="kv"><span>전체</span><b>${run.total}</b></div>
    <div class="kv"><span>실패</span><b style="color:${run.failed ? "var(--fail)" : "var(--ok)"}">${run.failed}</b></div>
    <div class="kv"><span>시작</span><b>${fmt(run.startedAt)}</b></div>
    <div class="kv"><span>종료</span><b>${fmt(run.finishedAt)}</b></div>
    <div class="kv"><span>소요</span><b>${Math.round((run.durationMs || 0) / 1000)}초</b></div>
  `;
}

function renderHero(run) {
  const heroTitle = $("#heroTitle");
  const heroMeta = $("#heroMeta");

  if (run.overall === "FAIL") {
    heroTitle.textContent = `⚠️ 실패 발생: ${run.failed}개 사이트`;
    heroMeta.textContent =
      `최근 실행(${run.id})에서 일부 사이트 로딩/캡처에 실패했습니다. 아래 표에서 확인하세요.`;
  } else {
    heroTitle.textContent = `✅ 이상없음: 전체 ${run.total}개 성공`;
    heroMeta.textContent =
      `최근 실행(${run.id})에서 모든 사이트가 정상 로딩/캡처되었습니다.`;
  }
}

function renderItemsTable(run) {
  const body = $("#itemsBody");
  const empty = $("#emptyMsg");
  body.innerHTML = "";

  const q = ($("#q").value || "").toLowerCase().trim();
  const onlyFail = $("#onlyFail").checked;

  const items = (run.items || []).filter((it) => {
    if (onlyFail && it.status !== "FAIL") return false;
    if (!q) return true;
    return (it.name || "").toLowerCase().includes(q) ||
           (it.url || "").toLowerCase().includes(q);
  });

  if (!items.length) {
    empty.style.display = "block";
    return;
  }
  empty.style.display = "none";

  for (const it of items) {
    const tr = document.createElement("tr");
    if (it.status === "FAIL") tr.classList.add("failRow");

    const isOk = it.status === "OK";
    const chipClass = isOk ? "chip ok" : "chip fail";
    const chipText = isOk ? "성공" : "실패";

    const sub = [];
    if (it.httpStatus) sub.push(`HTTP ${it.httpStatus}`);
    if (typeof it.durationMs === "number") sub.push(`⏱ ${Math.round(it.durationMs / 1000)}s`);
    const subText = sub.length ? sub.join(" · ") : "";
    const errText = !isOk && it.error ? it.error : "";

    tr.innerHTML = `
      <td><div style="font-weight:900;">${it.name || "-"}</div></td>
      <td><a class="url" href="${it.url}" target="_blank" rel="noreferrer">${it.url || "-"}</a></td>
      <td>
        <span class="${chipClass}">${chipText}</span>
        ${subText ? `<div class="subinfo">${subText}</div>` : ""}
        ${errText ? `<div class="subinfo">에러: ${errText}</div>` : ""}
      </td>
      <td>
        <a href="${it.screenshot}" target="_blank" rel="noreferrer" title="원본 보기">
          <img class="thumb" src="${it.screenshot}" alt="screenshot" loading="lazy" />
        </a>
      </td>
    `;
    body.appendChild(tr);
  }
}

function showFatal(err) {
  $("#heroTitle").textContent = "⚠️ 데이터 로딩 실패";
  $("#heroMeta").textContent =
    `${String(err)}\n` +
    `- reports/index.json이 Pages에서 열리는지 확인: /reports/index.json\n` +
    `- 또는 app.js 캐시 문제면 index.html의 ?v= 숫자를 올려주세요.`;
  $("#summary").innerHTML = "";
  $("#itemsBody").innerHTML = "";
  $("#emptyMsg").style.display = "block";
}

async function renderSelectedRun() {
  const runs = state.index.runs;
  if (!runs.length) {
    $("#heroTitle").textContent = "실행 이력이 없습니다.";
    $("#heroMeta").textContent =
      "GitHub Actions를 한 번 실행(수동 실행 또는 스케줄)해 주세요.";
    $("#summary").innerHTML = "";
    $("#itemsBody").innerHTML = "";
    $("#emptyMsg").style.display = "block";
    return;
  }

  const targetId = parseHash() || runs[0].id;
  const target = runs.find((r) => r.id === targetId) || runs[0];
  state.selectedRunId = target.id;

  const run = await loadRun(target.runJson);

  renderRunList();
  renderHero(run);
  renderSummary(run);
  renderItemsTable(run);
}

async function refreshAll() {
  await loadIndex();
  renderRunList();
  await renderSelectedRun();
}

function wire() {
  $("#btnRefresh").onclick = () => refreshAll().catch(showFatal);
  $("#q").addEventListener("input", () => renderSelectedRun().catch(showFatal));
  $("#onlyFail").addEventListener("change", () => renderSelectedRun().catch(showFatal));
  window.addEventListener("hashchange", () => renderSelectedRun().catch(showFatal));

  $("#repoLink").href = repoUrlGuess();
}

(async function init() {
  try {
    wire();
    await refreshAll();
  } catch (e) {
    showFatal(e);
  }
})();

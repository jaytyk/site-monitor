const $ = (s) => document.querySelector(s);

const state = {
  index: null,
  selectedRunId: null,
  runCache: new Map()
};

function fmt(iso) {
  try {
    return new Intl.DateTimeFormat("ko-KR", {
      dateStyle: "medium",
      timeStyle: "medium"
    }).format(new Date(iso));
  } catch {
    return iso;
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
  // GitHub Pages 기본: https://<user>.github.io/<repo>/
  // 여기선 자동 링크가 애매해서 현재 origin 기준으로 repo 링크를 비워둠
  return "https://github.com/";
}

async function fetchJson(url) {
  const r = await fetch(url, { cache: "no-store" });
  if (!r.ok) throw new Error(`Failed to fetch ${url} (${r.status})`);
  return r.json();
}

async function loadIndex() {
  state.index = await fetchJson("./reports/index.json");
  if (!state.index?.runs) state.index = { runs: [] };
}

async function loadRun(runJsonPath) {
  if (state.runCache.has(runJsonPath)) return state.runCache.get(runJsonPath);
  const data = await fetchJson("./" + runJsonPath);
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
    return (
      r.id.toLowerCase().includes(q) ||
      (r.overall || "").toLowerCase().includes(q)
    );
  });

  const latest = state.index.runs[0];
  const latestBadge = $("#latestBadge");
  if (!latest) {
    latestBadge.textContent = "실행 이력 없음";
  } else {
    latestBadge.textContent = latest.overall === "FAIL" ? "⚠️ 실패 있음" : "✅ 이상없음";
  }

  for (const r of runs) {
    const el = document.createElement("div");
    el.className = "run" + (r.id === state.selectedRunId ? " active" : "");
    el.onclick = () => setHashRun(r.id);

    const pillClass = r.overall === "FAIL" ? "pill fail" : "pill ok";
    const pillText = r.overall === "FAIL" ? `FAIL (${r.failed}/${r.total})` : `OK (${r.total})`;

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
    heroMeta.textContent = `최근 실행(${run.id})에서 일부 사이트 로딩/캡처에 실패했습니다. 아래에서 사이트별 오류/스크린샷을 확인하세요.`;
  } else {
    heroTitle.textContent = `✅ 이상없음: 전체 ${run.total}개 성공`;
    heroMeta.textContent = `최근 실행(${run.id})에서 모든 사이트가 정상 로딩/캡처되었습니다.`;
  }
}

function renderItems(run) {
  const items = $("#items");
  items.innerHTML = "";

  const q = ($("#q").value || "").toLowerCase().trim();
  const onlyFail = $("#onlyFail").checked;

  const filtered = (run.items || []).filter((it) => {
    if (onlyFail && it.status !== "FAIL") return false;
    if (!q) return true;
    return (
      (it.name || "").toLowerCase().includes(q) ||
      (it.url || "").toLowerCase().includes(q)
    );
  });

  for (const it of filtered) {
    const wrap = document.createElement("div");
    wrap.className = "item";

    const smallClass = it.status === "OK" ? "small ok" : "small fail";
    const http = it.httpStatus ? `HTTP ${it.httpStatus}` : "HTTP -";
    const dur = it.durationMs != null ? `${Math.round(it.durationMs / 1000)}s` : "-";

    wrap.innerHTML = `
      <a href="./${it.screenshot}" target="_blank" rel="noreferrer">
        <img class="thumb" src="./${it.screenshot}" alt="screenshot" loading="lazy" />
      </a>
      <div>
        <div class="itemTitle">${it.name}</div>
        <div class="itemUrl">${it.url}</div>
        <div class="itemBadges">
          <span class="${smallClass}">${it.status}</span>
          <span class="small">${http}</span>
          <span class="small">⏱ ${dur}</span>
        </div>
        ${it.error ? `<div class="err">에러: ${it.error}</div>` : ""}
      </div>
    `;
    items.appendChild(wrap);
  }
}

async function renderSelectedRun() {
  const runs = state.index.runs;
  if (!runs.length) {
    $("#heroTitle").textContent = "실행 이력이 없습니다.";
    $("#heroMeta").textContent = "GitHub Actions를 한 번 실행(수동 실행 또는 스케줄)해 주세요.";
    $("#summary").innerHTML = "";
    $("#items").innerHTML = "";
    return;
  }

  const targetId = parseHash() || runs[0].id;
  const target = runs.find((r) => r.id === targetId) || runs[0];
  state.selectedRunId = target.id;

  const run = await loadRun(target.runJson);

  renderRunList();
  renderHero(run);
  renderSummary(run);
  renderItems(run);
}

async function refreshAll() {
  await loadIndex();
  renderRunList();
  await renderSelectedRun();
}

function wire() {
  $("#btnRefresh").onclick = () => refreshAll();
  $("#q").addEventListener("input", () => renderSelectedRun());
  $("#onlyFail").addEventListener("change", () => renderSelectedRun());
  window.addEventListener("hashchange", () => renderSelectedRun());

  $("#repoLink").href = repoUrlGuess();
}

(async function init() {
  wire();
  await refreshAll();
})();


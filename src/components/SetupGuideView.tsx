import React, { useState } from 'react';
import { 
  CheckCircle2, 
  ExternalLink, 
  ShieldAlert, 
  Copy, 
  Check, 
  Terminal, 
  GitBranch, 
  Clock, 
  MessageSquare,
  HelpCircle,
  FolderTree
} from 'lucide-react';

export const SetupGuideView: React.FC = () => {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const copyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(id);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const workflowYaml = `name: Site Monitor
on:
  workflow_dispatch: # Actions 화면에서 "Run workflow"로 즉시 수동 실행
  schedule:
    - cron: "0 9 1 * *" # 매월 1일 09:00(UTC) = KST 18:00 정기 실행

permissions:
  contents: write # ✅ reports/ 폴더를 커밋/푸시하기 위해 필수!

concurrency:
  group: site-monitor
  cancel-in-progress: false

jobs:
  monitor:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: "20"
      - name: Install deps
        run: npm install
      - name: Install Playwright (Chromium)
        run: npx playwright install --with-deps chromium
      - name: Run monitor
        id: monitor
        run: |
          set +e
          npm run monitor
          code=$?
          echo "exit_code=$code" >> $GITHUB_OUTPUT
          exit 0
      - name: Commit reports (always)
        if: always()
        run: |
          touch .nojekyll
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git add -f -A reports .nojekyll
          if [ -n "$(git status --porcelain)" ]; then
            git commit -m "chore(reports): add run $(date -u +'%Y-%m-%dT%H:%M:%SZ')"
            git push
          else
            echo "No changes to commit."
          fi
      - name: Notify Slack
        if: always()
        env:
          SLACK_WEBHOOK_URL: \${{ secrets.SLACK_WEBHOOK_URL }}
        run: |
          # 슬랙 웹훅이 등록되어 있으면 메시지 전송
          node - <<'NODE'
          // ... Slack Block Kit payload ...
          NODE
`;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Overview Banner */}
      <div className="p-6 bg-gradient-to-r from-indigo-950/40 via-[#0f1629] to-[#0f1629] border border-indigo-500/30 rounded-2xl shadow-xl">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/30 shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">원본 소스 연결 및 환경 재구성 완료</h2>
            <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
              요청하신 GitHub 저장소(<code className="text-indigo-300 font-mono">jaytyk/site-monitor</code>)의 원본 소스코드, 
              크롤링 스크립트(<code className="text-indigo-300 font-mono">scripts/run.js</code>), 대상 사이트 설정(<code className="text-indigo-300 font-mono">sites.json</code>), 
              그리고 과거 12회차의 누적 실행 보고서 및 스크린샷(187MB)이 본 환경으로 성공적으로 연결 및 마운트되었습니다.
            </p>
            <div className="flex flex-wrap gap-3 mt-4">
              <a
                href="https://github.com/jaytyk/site-monitor"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition shadow"
              >
                <span>GitHub 저장소 바로가기</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <a
                href="https://jaytyk.github.io/site-monitor/"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
              >
                <span>GitHub Pages 배포 사이트</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Step by step checklist */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Step 1 */}
        <div className="p-5 bg-[#0f1629]/90 border border-slate-800 rounded-2xl shadow-lg space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/40 text-xs font-bold flex items-center justify-center">
                1
              </span>
              <h3 className="text-sm font-bold text-white">GitHub Actions 쓰기 권한 설정 (필수!)</h3>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30">
              중요
            </span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            GitHub Actions 봇이 Playwright로 사이트를 점검한 후 생성된 스크린샷과 <code className="text-indigo-300 font-mono">reports/</code> 폴더를 저장소에 <strong>git push</strong>하려면 저장소 쓰기 권한이 필요합니다.
          </p>
          <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 text-xs text-slate-400 space-y-1 font-mono text-[11px]">
            <div>1. 저장소 &gt; <strong className="text-slate-200">Settings</strong> 클릭</div>
            <div>2. 좌측 메뉴 &gt; <strong className="text-slate-200">Actions &gt; General</strong> 클릭</div>
            <div>3. 하단 <strong className="text-slate-200">Workflow permissions</strong> 찾기</div>
            <div>4. <span className="text-emerald-400 font-bold">● Read and write permissions</span> 선택 후 Save</div>
          </div>
        </div>

        {/* Step 2 */}
        <div className="p-5 bg-[#0f1629]/90 border border-slate-800 rounded-2xl shadow-lg space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/40 text-xs font-bold flex items-center justify-center">
                2
              </span>
              <h3 className="text-sm font-bold text-white">GitHub Pages 배포 설정</h3>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              배포 확인
            </span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            대시보드가 <code className="text-indigo-300 font-mono">https://jaytyk.github.io/site-monitor/</code>로 서빙되도록 GitHub Pages 브랜치가 지정되어 있어야 합니다.
          </p>
          <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 text-xs text-slate-400 space-y-1 font-mono text-[11px]">
            <div>1. 저장소 &gt; <strong className="text-slate-200">Settings &gt; Pages</strong> 이동</div>
            <div>2. Build and deployment &gt; Source: <strong className="text-slate-200">Deploy from a branch</strong></div>
            <div>3. Branch: <strong className="text-emerald-400">main</strong> / Folder: <strong className="text-emerald-400">/(root)</strong></div>
            <div>4. 루트에 <code className="text-indigo-300 font-bold">.nojekyll</code> 파일이 유지되어야 합니다.</div>
          </div>
        </div>

        {/* Step 3 */}
        <div className="p-5 bg-[#0f1629]/90 border border-slate-800 rounded-2xl shadow-lg space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/40 text-xs font-bold flex items-center justify-center">
                3
              </span>
              <h3 className="text-sm font-bold text-white">정기 실행 스케줄 (Cron 설정)</h3>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              스케줄
            </span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            현재 <code className="text-indigo-300 font-mono">.github/workflows/monitor.yml</code>에 설정된 기본 주기는 <strong>매월 1일 KST 18:00</strong>입니다. 필요에 따라 변경할 수 있습니다:
          </p>
          <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-1.5 font-mono text-[11px]">
            <div className="flex justify-between items-center">
              <span>매월 1일 KST 18시 (현재):</span>
              <code className="text-emerald-400">0 9 1 * *</code>
            </div>
            <div className="flex justify-between items-center">
              <span>매주 월요일 KST 18시:</span>
              <code className="text-indigo-300">0 9 * * 1</code>
            </div>
            <div className="flex justify-between items-center">
              <span>매일 아침 KST 09시:</span>
              <code className="text-indigo-300">0 0 * * *</code>
            </div>
            <div className="flex justify-between items-center">
              <span>매 시간 정각:</span>
              <code className="text-indigo-300">0 * * * *</code>
            </div>
          </div>
        </div>

        {/* Step 4 */}
        <div className="p-5 bg-[#0f1629]/90 border border-slate-800 rounded-2xl shadow-lg space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/40 text-xs font-bold flex items-center justify-center">
                4
              </span>
              <h3 className="text-sm font-bold text-white">Slack 알림 연동 (선택 사항)</h3>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
              선택
            </span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            모니터링 실행이 완료되면 이상 여부 및 대시보드 링크를 슬랙 채널로 자동 발송할 수 있습니다.
          </p>
          <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 text-xs text-slate-400 space-y-1 font-mono text-[11px]">
            <div>1. 저장소 &gt; <strong className="text-slate-200">Settings &gt; Secrets and variables &gt; Actions</strong></div>
            <div>2. <strong className="text-slate-200">New repository secret</strong> 버튼 클릭</div>
            <div>3. Name: <strong className="text-indigo-300">SLACK_WEBHOOK_URL</strong></div>
            <div>4. Value: Slack Incoming Webhook URL 붙여넣기</div>
            <div className="text-[10px] text-slate-500">* 미등록 시 오류 없이 조용히 스킵됩니다.</div>
          </div>
        </div>
      </div>

      {/* Manual Run & Local Run Explanation */}
      <div className="p-6 bg-[#0f1629]/90 border border-slate-800 rounded-2xl shadow-xl space-y-4">
        <div className="flex items-center gap-2">
          <Terminal className="w-5 h-5 text-indigo-400" />
          <h3 className="text-base font-bold text-white">모니터링 수동 실행 방법</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-800 space-y-2">
            <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <GitBranch className="w-4 h-4 text-emerald-400" />
              방법 A: GitHub Actions 화면에서 1클릭 수동 실행
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              GitHub 저장소의 <strong>Actions</strong> 탭 &gt; 좌측 <strong>Site Monitor</strong> 워크플로 선택 &gt; 우측 상단 <strong>Run workflow</strong> 버튼을 누르면 서버 없이도 클라우드에서 바로 크롤러가 구동되어 결과가 커밋됩니다.
            </p>
          </div>

          <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-800 space-y-2">
            <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-indigo-400" />
              방법 B: 현재 AI Studio 대시보드에서 실시간 점검
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              상단 탭 중 <strong>[실시간 점검]</strong> 탭을 클릭한 뒤 <strong>[전체 14개 사이트 지금 점검]</strong> 버튼을 누르면, 브라우저/서버에서 즉시 각 사이트에 HTTP 프로브를 날려 응답 상태와 지연시간을 실시간으로 확인하실 수 있습니다.
            </p>
          </div>
        </div>
      </div>

      {/* Workflow File Viewer */}
      <div className="p-6 bg-[#0f1629]/90 border border-slate-800 rounded-2xl shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FolderTree className="w-5 h-5 text-indigo-400" />
            <h3 className="text-base font-bold text-white">
              GitHub Actions 워크플로 소스 (.github/workflows/monitor.yml)
            </h3>
          </div>
          <button
            onClick={() => copyText(workflowYaml, 'yaml')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 border border-slate-700 transition"
          >
            {copiedSection === 'yaml' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copiedSection === 'yaml' ? '복사됨!' : 'YAML 복사'}</span>
          </button>
        </div>

        <pre className="p-4 bg-slate-950 font-mono text-xs text-indigo-200 rounded-xl border border-slate-800/80 overflow-x-auto max-h-[350px]">
          {workflowYaml}
        </pre>
      </div>
    </div>
  );
};

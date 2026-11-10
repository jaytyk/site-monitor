import { useState, useEffect, useCallback } from 'react';
import { Header, TabType } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { LiveCheckView } from './components/LiveCheckView';
import { SitesConfigView } from './components/SitesConfigView';
import { SetupGuideView } from './components/SetupGuideView';
import { ScreenshotModal } from './components/ScreenshotModal';
import { 
  RunIndex, 
  RunIndexItem, 
  RunDetail, 
  RunItem, 
  SitesJson 
} from './types';

const DEFAULT_SITES_CONFIG: SitesJson = {
  settings: {
    concurrency: 3,
    timeoutMs: 100000,
    retentionRuns: 200,
    viewport: { width: 1366, height: 768 }
  },
  sites: []
};

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [dataSource, setDataSource] = useState<'local' | 'live'>('local');
  const [runs, setRuns] = useState<RunIndexItem[]>([]);
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [selectedRun, setSelectedRun] = useState<RunDetail | null>(null);
  const [sitesConfig, setSitesConfig] = useState<SitesJson>(DEFAULT_SITES_CONFIG);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingRun, setIsLoadingRun] = useState(false);
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [screenshotItem, setScreenshotItem] = useState<RunItem | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  const showNotice = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  // 1. Load run index from server API with automatic live/local fallback
  const loadIndex = useCallback(async (source: 'local' | 'live' = dataSource) => {
    try {
      const res = await fetch(`/api/reports-data/index?source=${source}&v=${Date.now()}`);
      if (res.ok) {
        const payload = await res.json();
        const runList: RunIndexItem[] = payload.data?.runs || [];
        setRuns(runList);

        if (payload.fallback && source === 'live') {
          showNotice('GitHub Pages에 아직 결과가 배포되지 않아 로컬 리포트를 표시합니다.');
        }

        if (runList.length > 0) {
          setSelectedRunId(prev => (prev && runList.some(r => r.id === prev) ? prev : runList[0].id));
        }
        return runList;
      }
    } catch (err) {
      console.warn('API reports-data/index fetch failed, trying static /reports/index.json', err);
    }

    // Direct static fallback
    try {
      const res = await fetch(`/reports/index.json?v=${Date.now()}`);
      if (res.ok) {
        const data: RunIndex = await res.json();
        const runList = data.runs || [];
        setRuns(runList);
        if (runList.length > 0) {
          setSelectedRunId(prev => (prev && runList.some(r => r.id === prev) ? prev : runList[0].id));
        }
        return runList;
      }
    } catch (err) {
      console.error('Failed to load local index', err);
    }
    return [];
  }, [dataSource]);

  // 2. Load run detail with graceful fallback
  const loadRunDetail = useCallback(async (runId: string, runList: RunIndexItem[], source: 'local' | 'live' = dataSource) => {
    const target = runList.find(r => r.id === runId);
    if (!target) return;

    setIsLoadingRun(true);
    try {
      // 1) Try server API
      const res = await fetch(`/api/reports-data/run/${encodeURIComponent(runId)}?source=${source}&v=${Date.now()}`);
      if (res.ok) {
        const payload = await res.json();
        if (payload.data) {
          setSelectedRun(payload.data);
          return;
        }
      }
    } catch (err) {
      console.warn('Server run detail route failed, falling back to static file', err);
    }

    // 2) Direct static fallback to /reports/{runId}/run.json
    try {
      const cleanPath = target.runJson.replace(/^\//, '');
      const res = await fetch(`/${cleanPath}?v=${Date.now()}`);
      if (res.ok) {
        const data: RunDetail = await res.json();
        setSelectedRun(data);
        return;
      }
    } catch (err) {
      console.warn('Direct static fetch failed', err);
    }

    // 3) Graceful summary fallback if detail file is absent
    setSelectedRun({
      id: target.id,
      overall: target.overall,
      total: target.total,
      failed: target.failed,
      startedAt: target.startedAt,
      finishedAt: target.finishedAt,
      durationMs: target.durationMs,
      items: []
    });
  }, [dataSource]);

  // 3. Load sites config from server
  const loadSitesConfig = useCallback(async () => {
    try {
      const res = await fetch('/api/sites');
      if (res.ok) {
        const data: SitesJson = await res.json();
        setSitesConfig(data);
      }
    } catch (e) {
      console.warn('Failed to load /api/sites', e);
    }
  }, []);

  // Save sites config
  const handleSaveConfig = async (updated: SitesJson) => {
    setIsSavingConfig(true);
    try {
      const res = await fetch('/api/sites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
      if (!res.ok) throw new Error('Save failed');
      setSitesConfig(updated);
      showNotice('sites.json 파일이 성공적으로 저장되었습니다.');
      return true;
    } catch (err: any) {
      showNotice(`저장 오류: ${err.message}`);
      return false;
    } finally {
      setIsSavingConfig(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadSitesConfig();
    loadIndex(dataSource);
  }, [loadSitesConfig, loadIndex, dataSource]);

  // When selected run ID or runs change, fetch that run's detail
  useEffect(() => {
    if (selectedRunId && runs.length > 0) {
      loadRunDetail(selectedRunId, runs, dataSource);
    }
  }, [selectedRunId, runs, loadRunDetail, dataSource]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadSitesConfig();
    const updatedRuns = await loadIndex(dataSource);
    if (selectedRunId && updatedRuns.length > 0) {
      await loadRunDetail(selectedRunId, updatedRuns, dataSource);
    }
    setIsRefreshing(false);
    showNotice('최신 데이터가 갱신되었습니다.');
  };

  const handleDataSourceChange = async (source: 'local' | 'live') => {
    setDataSource(source);
    setIsRefreshing(true);
    const updatedRuns = await loadIndex(source);
    if (updatedRuns.length > 0) {
      await loadRunDetail(updatedRuns[0].id, updatedRuns, source);
    }
    setIsRefreshing(false);
    showNotice(source === 'live' ? 'GitHub Pages 라이브 모드로 전환되었습니다.' : '로컬 저장소 모드로 전환되었습니다.');
  };

  const handleTestSiteNow = (_url: string) => {
    setActiveTab('live');
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 font-sans selection:bg-indigo-500 selection:text-white">
      {/* Background gradient lights */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-0 left-1/4 w-[600px] h-[350px] bg-indigo-600/10 rounded-full blur-[120px]" />
        <div className="absolute top-20 right-1/4 w-[500px] h-[300px] bg-emerald-600/10 rounded-full blur-[140px]" />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Navigation Header */}
        <Header
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
          dataSource={dataSource}
          onDataSourceChange={handleDataSourceChange}
        />

        {/* Global Alert / Toast Notification */}
        {notification && (
          <div className="fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-semibold shadow-2xl border border-indigo-400/40 animate-in slide-in-from-bottom-3 duration-200">
            {notification}
          </div>
        )}

        {/* Main Content View */}
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-8">
          {activeTab === 'dashboard' && (
            <DashboardView
              runs={runs}
              selectedRun={selectedRun}
              selectedRunId={selectedRunId}
              onSelectRun={setSelectedRunId}
              isLoadingRun={isLoadingRun}
              onOpenScreenshot={setScreenshotItem}
              onTestSiteNow={handleTestSiteNow}
              dataSource={dataSource}
            />
          )}

          {activeTab === 'live' && (
            <LiveCheckView sites={sitesConfig.sites || []} />
          )}

          {activeTab === 'config' && (
            <SitesConfigView
              sitesConfig={sitesConfig}
              onSaveConfig={handleSaveConfig}
              isSaving={isSavingConfig}
            />
          )}

          {activeTab === 'guide' && (
            <SetupGuideView />
          )}
        </main>

        {/* Footer */}
        <footer className="border-t border-slate-800/80 bg-[#090d16]/80 py-4 px-6 text-center text-xs text-slate-500">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
            <span>Site Monitor System &amp; Dashboard · Powered by Playwright, GitHub Actions &amp; Google AI Studio</span>
            <div className="flex items-center gap-4">
              <a href="https://github.com/jaytyk/site-monitor" target="_blank" rel="noreferrer" className="hover:text-slate-300 transition">
                GitHub Repository
              </a>
              <span>·</span>
              <a href="https://jaytyk.github.io/site-monitor/" target="_blank" rel="noreferrer" className="hover:text-slate-300 transition">
                Live GitHub Pages
              </a>
            </div>
          </div>
        </footer>

        {/* Screenshot Lightbox Modal */}
        {screenshotItem && (
          <ScreenshotModal
            item={screenshotItem}
            onClose={() => setScreenshotItem(null)}
            basePrefix={dataSource === 'live' ? 'https://jaytyk.github.io/site-monitor' : ''}
          />
        )}
      </div>
    </div>
  );
}

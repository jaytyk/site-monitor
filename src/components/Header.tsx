import React from 'react';
import { 
  RefreshCw, 
  Github, 
  ExternalLink, 
  LayoutDashboard, 
  Activity, 
  Settings2, 
  BookOpen,
  Radio
} from 'lucide-react';

export type TabType = 'dashboard' | 'live' | 'config' | 'guide';

interface Props {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  dataSource: 'local' | 'live';
  onDataSourceChange: (source: 'local' | 'live') => void;
}

export const Header: React.FC<Props> = ({
  activeTab,
  onTabChange,
  onRefresh,
  isRefreshing,
  dataSource,
  onDataSourceChange
}) => {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-800/80 bg-[#0b0f19]/80 backdrop-blur-md px-4 lg:px-8 py-3.5">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-emerald-500/10 border border-slate-700/60 p-1 flex items-center justify-center overflow-hidden shadow-inner">
            <img 
              src="/assets/nexon-logo.png" 
              alt="NEXON" 
              className="w-full h-full object-contain"
              onError={(e) => {
                // fallback if image not found
                e.currentTarget.style.display = 'none';
              }} 
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-black tracking-tight text-white">Site Monitor</span>
              <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                v2.0
              </span>
            </div>
            <div className="text-xs text-slate-400">
              GitHub Actions · Playwright · Pages
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center p-1 bg-slate-900/90 border border-slate-800 rounded-xl overflow-x-auto">
          <button
            onClick={() => onTabChange('dashboard')}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all ${
              activeTab === 'dashboard'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>실행 대시보드</span>
          </button>

          <button
            onClick={() => onTabChange('live')}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all ${
              activeTab === 'live'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>실시간 점검</span>
          </button>

          <button
            onClick={() => onTabChange('config')}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all ${
              activeTab === 'config'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Settings2 className="w-3.5 h-3.5" />
            <span>사이트 관리 (14)</span>
          </button>

          <button
            onClick={() => onTabChange('guide')}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all ${
              activeTab === 'guide'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>연동 및 환경 가이드</span>
          </button>
        </div>

        {/* Actions & Source Switch */}
        <div className="flex items-center gap-2.5">
          {/* Data source switch */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-xs">
            <button
              onClick={() => onDataSourceChange('local')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium transition ${
                dataSource === 'local'
                  ? 'bg-slate-800 text-emerald-400 shadow-sm'
                  : 'text-slate-400 hover:text-slate-300'
              }`}
              title="로컬 저장소의 실행 이력 데이터 사용"
            >
              <Radio className="w-3 h-3 text-emerald-400" />
              <span>로컬 데이터</span>
            </button>
            <button
              onClick={() => onDataSourceChange('live')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium transition ${
                dataSource === 'live'
                  ? 'bg-slate-800 text-indigo-400 shadow-sm'
                  : 'text-slate-400 hover:text-slate-300'
              }`}
              title="GitHub Pages 라이브 데이터 직접 조회"
            >
              <GlobeIcon className="w-3 h-3 text-indigo-400" />
              <span>GitHub Pages</span>
            </button>
          </div>

          {/* Refresh */}
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700 text-slate-200 transition disabled:opacity-50"
            title="새로고침"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-indigo-400' : ''}`} />
            <span className="hidden sm:inline">새로고침</span>
          </button>

          {/* GitHub link */}
          <a
            href="https://github.com/jaytyk/site-monitor"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition"
            title="GitHub 원본 저장소"
          >
            <Github className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Repo</span>
            <ExternalLink className="w-3 h-3 text-slate-500" />
          </a>
        </div>
      </div>
    </header>
  );
};

const GlobeIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

import React, { useState } from 'react';
import { 
  RunIndexItem, 
  RunDetail, 
  RunItem 
} from '../types';
import { 
  Search, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  ExternalLink, 
  LayoutGrid, 
  Table as TableIcon,
  Maximize2,
  Calendar,
  Zap,
  Globe
} from 'lucide-react';

interface Props {
  runs: RunIndexItem[];
  selectedRun: RunDetail | null;
  selectedRunId: string | null;
  onSelectRun: (id: string) => void;
  isLoadingRun: boolean;
  onOpenScreenshot: (item: RunItem) => void;
  onTestSiteNow: (url: string) => void;
  dataSource: 'local' | 'live';
}

function formatKST(isoString: string): string {
  try {
    if (!isoString) return '-';
    return new Intl.DateTimeFormat('ko-KR', {
      dateStyle: 'medium',
      timeStyle: 'medium',
      timeZone: 'Asia/Seoul'
    }).format(new Date(isoString));
  } catch {
    return isoString || '-';
  }
}

export const DashboardView: React.FC<Props> = ({
  runs,
  selectedRun,
  selectedRunId,
  onSelectRun,
  isLoadingRun,
  onOpenScreenshot,
  onTestSiteNow,
  dataSource
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [onlyFail, setOnlyFail] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  // Base URL for screenshots when viewing live GitHub Pages data
  const screenshotPrefix = dataSource === 'live' 
    ? 'https://jaytyk.github.io/site-monitor' 
    : '';

  const getFullImgUrl = (relPath?: string) => {
    if (!relPath) return '';
    if (relPath.startsWith('http')) return relPath;
    return `${screenshotPrefix}/${relPath.replace(/^\//, '')}`;
  };

  const filteredItems = (selectedRun?.items || []).filter((it) => {
    if (onlyFail && it.status !== 'FAIL') return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      (it.name || '').toLowerCase().includes(q) ||
      (it.url || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left Sidebar: Run History */}
      <aside className="lg:col-span-4 xl:col-span-3 bg-[#0f1629]/90 border border-slate-800 rounded-2xl p-4 shadow-xl backdrop-blur-md">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
          <div>
            <h2 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-indigo-400" />
              실행 이력
            </h2>
            <span className="text-[11px] text-slate-400">총 {runs.length}회 기록됨</span>
          </div>

          {runs.length > 0 && (
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
              runs[0].overall === 'OK'
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
            }`}>
              최신: {runs[0].overall === 'OK' ? '이상없음' : '실패'}
            </span>
          )}
        </div>

        {/* Run list */}
        <div className="space-y-2 max-h-[680px] overflow-y-auto pr-1">
          {runs.map((r) => {
            const isSelected = r.id === selectedRunId;
            const isOk = r.overall === 'OK';
            return (
              <button
                key={r.id}
                onClick={() => onSelectRun(r.id)}
                className={`w-full text-left p-3 rounded-xl border transition-all ${
                  isSelected
                    ? 'bg-indigo-950/40 border-indigo-500/60 shadow-lg shadow-indigo-950/50'
                    : 'bg-slate-900/60 border-slate-800/80 hover:bg-slate-800/60 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className={`text-xs font-mono font-bold ${isSelected ? 'text-indigo-300' : 'text-slate-200'}`}>
                    {r.id}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    isOk
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                      : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                  }`}>
                    {isOk ? `OK (${r.total})` : `FAIL (${r.failed}/${r.total})`}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>{formatKST(r.startedAt)}</span>
                  <span className="flex items-center gap-1 font-mono text-slate-400">
                    <Clock className="w-3 h-3 text-slate-500" />
                    {Math.round((r.durationMs || 0) / 1000)}s
                  </span>
                </div>
              </button>
            );
          })}

          {runs.length === 0 && (
            <div className="text-center py-10 text-xs text-slate-500">
              실행 이력이 없습니다.
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <section className="lg:col-span-8 xl:col-span-9 space-y-6">
        {/* Loading state */}
        {isLoadingRun && (
          <div className="p-8 text-center bg-slate-900/40 border border-slate-800 rounded-2xl text-sm text-slate-400 animate-pulse">
            실행 상세 정보를 불러오는 중입니다...
          </div>
        )}

        {/* Selected Run Hero Card */}
        {selectedRun && !isLoadingRun && (
          <div className={`p-6 rounded-2xl border backdrop-blur-md shadow-xl transition-all ${
            selectedRun.overall === 'OK'
              ? 'bg-gradient-to-r from-emerald-950/20 via-slate-900/80 to-[#0f172a] border-emerald-500/30'
              : 'bg-gradient-to-r from-rose-950/20 via-slate-900/80 to-[#0f172a] border-rose-500/30'
          }`}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div className="flex items-start gap-3">
                <div className={`p-2.5 rounded-xl border ${
                  selectedRun.overall === 'OK'
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                    : 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                }`}>
                  {selectedRun.overall === 'OK' ? (
                    <CheckCircle2 className="w-6 h-6" />
                  ) : (
                    <AlertTriangle className="w-6 h-6" />
                  )}
                </div>
                <div>
                  <h1 className="text-lg md:text-xl font-bold text-white flex items-center gap-2">
                    {selectedRun.overall === 'OK' ? (
                      <span>이상없음: 전체 {selectedRun.total}개 사이트 정상</span>
                    ) : (
                      <span className="text-rose-300">실패 발생: {selectedRun.failed}개 사이트 점검 실패</span>
                    )}
                  </h1>
                  <p className="text-xs text-slate-400 mt-1">
                    실행 ID: <span className="font-mono text-slate-300">{selectedRun.id}</span> · KST 기준 실행일: {formatKST(selectedRun.startedAt)}
                  </p>
                </div>
              </div>

              {/* Source tag */}
              <div className="text-right">
                <span className="text-xs px-2.5 py-1 rounded-md bg-slate-800 border border-slate-700 text-slate-300">
                  데이터 소스: <strong className="text-indigo-400">{dataSource === 'local' ? '로컬 저장소' : 'GitHub Pages 라이브'}</strong>
                </span>
              </div>
            </div>

            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4">
              <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-3">
                <div className="text-[11px] text-slate-400 font-medium">전체 모니터링</div>
                <div className="text-xl font-black text-white mt-0.5">{selectedRun.total}개</div>
              </div>

              <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-3">
                <div className="text-[11px] text-emerald-400/80 font-medium">정상 가동 (OK)</div>
                <div className="text-xl font-black text-emerald-400 mt-0.5">{selectedRun.total - selectedRun.failed}개</div>
              </div>

              <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-3">
                <div className="text-[11px] text-rose-400/80 font-medium">실패 건수 (FAIL)</div>
                <div className={`text-xl font-black mt-0.5 ${selectedRun.failed > 0 ? 'text-rose-400' : 'text-slate-400'}`}>
                  {selectedRun.failed}개
                </div>
              </div>

              <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-3">
                <div className="text-[11px] text-indigo-400/80 font-medium">총 소요 시간</div>
                <div className="text-xl font-black text-indigo-300 mt-0.5">
                  {(selectedRun.durationMs / 1000).toFixed(1)}초
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filter and Control Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#0f1629]/90 border border-slate-800 rounded-xl p-3 shadow-md">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="사이트명 또는 URL 검색 (예: nypc, ndc, company...)"
              className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-700/80 rounded-lg text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition"
            />
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300 font-medium select-none">
              <input
                type="checkbox"
                checked={onlyFail}
                onChange={(e) => setOnlyFail(e.target.checked)}
                className="w-3.5 h-3.5 rounded border-slate-700 text-rose-500 focus:ring-0 bg-slate-900"
              />
              <span>실패 사이트만 보기</span>
            </label>

            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5">
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-md text-xs transition ${
                  viewMode === 'table' ? 'bg-slate-800 text-indigo-400' : 'text-slate-400 hover:text-slate-200'
                }`}
                title="테이블 목록 뷰"
              >
                <TableIcon className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-md text-xs transition ${
                  viewMode === 'grid' ? 'bg-slate-800 text-indigo-400' : 'text-slate-400 hover:text-slate-200'
                }`}
                title="스크린샷 갤러리 뷰"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Results: Table or Gallery Grid */}
        {viewMode === 'table' ? (
          <div className="bg-[#0f1629]/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/80 text-slate-400 uppercase tracking-wider text-[11px]">
                    <th className="py-3.5 px-4 font-semibold w-48">사이트명</th>
                    <th className="py-3.5 px-4 font-semibold">대상 URL</th>
                    <th className="py-3.5 px-4 font-semibold w-40">결과 상태</th>
                    <th className="py-3.5 px-4 font-semibold w-32">소요 시간</th>
                    <th className="py-3.5 px-4 font-semibold w-32 text-center">캡처 이미지</th>
                    <th className="py-3.5 px-4 font-semibold w-24 text-right">점검</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredItems.map((item, idx) => {
                    const isOk = item.status === 'OK';
                    const imgSrc = getFullImgUrl(item.screenshot);

                    return (
                      <tr 
                        key={idx} 
                        className={`hover:bg-slate-800/40 transition-colors ${
                          !isOk ? 'bg-rose-950/20' : ''
                        }`}
                      >
                        {/* Name */}
                        <td className="py-3 px-4 font-bold text-slate-100">
                          {item.name}
                        </td>

                        {/* URL */}
                        <td className="py-3 px-4">
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-slate-300 hover:text-indigo-400 transition-colors inline-flex items-center gap-1.5 group font-mono text-[11px]"
                          >
                            <span className="truncate max-w-[280px]">{item.url}</span>
                            <ExternalLink className="w-3 h-3 text-slate-500 group-hover:text-indigo-400 shrink-0" />
                          </a>
                        </td>

                        {/* Status */}
                        <td className="py-3 px-4">
                          <div className="flex flex-col gap-1 items-start">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold text-[10px] border ${
                              isOk 
                                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' 
                                : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                            }`}>
                              {isOk ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                              {isOk ? '정상 성공' : '실패'}
                            </span>
                            {item.httpStatus && (
                              <span className="text-[10px] text-slate-400 font-mono">
                                HTTP {item.httpStatus}
                              </span>
                            )}
                            {item.error && (
                              <span className="text-[10px] text-rose-400 line-clamp-1 max-w-[220px]" title={item.error}>
                                {item.error}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Duration */}
                        <td className="py-3 px-4 font-mono text-slate-400">
                          {typeof item.durationMs === 'number' 
                            ? `${(item.durationMs / 1000).toFixed(2)}초` 
                            : '-'}
                        </td>

                        {/* Screenshot Thumbnail */}
                        <td className="py-3 px-4 text-center">
                          {imgSrc ? (
                            <button
                              onClick={() => onOpenScreenshot(item)}
                              className="group relative inline-block rounded-lg overflow-hidden border border-slate-700 hover:border-indigo-500 transition-all shadow"
                              title="클릭하여 원본 스크린샷 확대 보기"
                            >
                              <img
                                src={imgSrc}
                                alt={item.name}
                                className="w-20 h-12 object-cover object-top transition duration-200 group-hover:scale-105"
                                loading="lazy"
                                onError={(e) => {
                                  const localSrc = `/${(item.screenshot || '').replace(/^\//, '')}`;
                                  if (!e.currentTarget.src.endsWith(localSrc)) {
                                    e.currentTarget.src = localSrc;
                                  }
                                }}
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                                <Maximize2 className="w-3.5 h-3.5 text-white" />
                              </div>
                            </button>
                          ) : (
                            <span className="text-slate-600 text-[10px]">캡처 없음</span>
                          )}
                        </td>

                        {/* Quick Test */}
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => onTestSiteNow(item.url)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white border border-slate-700 hover:border-indigo-500 transition text-[11px]"
                            title="지금 실시간 HTTP 상태 테스트"
                          >
                            <Zap className="w-3 h-3 text-amber-400" />
                            <span>점검</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {filteredItems.length === 0 && (
              <div className="py-16 text-center text-slate-400 text-xs">
                검색 조건에 맞는 사이트가 없습니다.
              </div>
            )}
          </div>
        ) : (
          /* Gallery Grid View */
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredItems.map((item, idx) => {
              const isOk = item.status === 'OK';
              const imgSrc = getFullImgUrl(item.screenshot);

              return (
                <div
                  key={idx}
                  className={`bg-[#0f1629]/90 border rounded-2xl overflow-hidden shadow-lg transition hover:border-slate-600 ${
                    !isOk ? 'border-rose-500/40 bg-rose-950/10' : 'border-slate-800'
                  }`}
                >
                  {/* Card Header */}
                  <div className="p-3.5 border-b border-slate-800 flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-slate-100">{item.name}</h4>
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-indigo-400 hover:underline flex items-center gap-1 mt-0.5 font-mono truncate max-w-[200px]"
                      >
                        <Globe className="w-3 h-3 shrink-0" />
                        <span className="truncate">{item.url}</span>
                      </a>
                    </div>

                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                      isOk 
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' 
                        : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                    }`}>
                      {item.status}
                    </span>
                  </div>

                  {/* Card Thumbnail */}
                  <div 
                    onClick={() => imgSrc && onOpenScreenshot(item)}
                    className="relative aspect-video bg-black/60 cursor-pointer overflow-hidden group"
                  >
                    {imgSrc ? (
                      <>
                        <img
                          src={imgSrc}
                          alt={item.name}
                          className="w-full h-full object-cover object-top transition duration-300 group-hover:scale-105"
                          loading="lazy"
                          onError={(e) => {
                            const localSrc = `/${(item.screenshot || '').replace(/^\//, '')}`;
                            if (!e.currentTarget.src.endsWith(localSrc)) {
                              e.currentTarget.src = localSrc;
                            }
                          }}
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition gap-2 text-xs text-white font-medium">
                          <Maximize2 className="w-4 h-4" />
                          <span>확대 보기</span>
                        </div>
                      </>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-slate-500">
                        캡처 이미지 없음
                      </div>
                    )}
                  </div>

                  {/* Card Footer */}
                  <div className="p-3 bg-slate-900/90 text-xs flex items-center justify-between border-t border-slate-800">
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
                      {item.httpStatus && <span>HTTP {item.httpStatus}</span>}
                      {typeof item.durationMs === 'number' && (
                        <span>⏱ {(item.durationMs / 1000).toFixed(1)}s</span>
                      )}
                    </div>

                    <button
                      onClick={() => onTestSiteNow(item.url)}
                      className="px-2 py-1 rounded bg-slate-800 hover:bg-indigo-600 text-slate-200 hover:text-white border border-slate-700 text-[10px] transition inline-flex items-center gap-1"
                    >
                      <Zap className="w-3 h-3 text-amber-400" />
                      점검
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

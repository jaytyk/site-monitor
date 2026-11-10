import React, { useState } from 'react';
import { SiteConfig, LiveCheckResult } from '../types';
import { 
  Play, 
  RotateCw, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  ExternalLink, 
  Globe, 
  ShieldCheck, 
  Send
} from 'lucide-react';

interface Props {
  sites: SiteConfig[];
}

export const LiveCheckView: React.FC<Props> = ({ sites }) => {
  const [results, setResults] = useState<Record<string, LiveCheckResult>>({});
  const [isRunningAll, setIsRunningAll] = useState(false);
  const [testingUrl, setTestingUrl] = useState<string | null>(null);
  const [customUrl, setCustomUrl] = useState('');
  const [customTesting, setCustomTesting] = useState(false);

  const checkSingleSite = async (siteUrl: string, siteName?: string) => {
    setTestingUrl(siteUrl);
    try {
      const res = await fetch('/api/live-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: siteUrl, timeoutMs: 15000 })
      });
      const data: LiveCheckResult = await res.json();
      setResults(prev => ({
        ...prev,
        [siteUrl]: { ...data, name: siteName || prev[siteUrl]?.name || siteUrl }
      }));
      return data;
    } catch (e: any) {
      const failRes: LiveCheckResult = {
        name: siteName,
        url: siteUrl,
        status: 'FAIL',
        httpStatus: null,
        error: e.message || '네트워크 요청 실패',
        durationMs: 0,
        checkedAt: new Date().toISOString()
      };
      setResults(prev => ({ ...prev, [siteUrl]: failRes }));
      return failRes;
    } finally {
      setTestingUrl(null);
    }
  };

  const checkAllSites = async () => {
    setIsRunningAll(true);
    try {
      const res = await fetch('/api/live-check-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (data.items) {
        const mapped: Record<string, LiveCheckResult> = {};
        for (const item of data.items) {
          mapped[item.url] = item;
        }
        setResults(mapped);
      }
    } catch {
      // Fallback: check one by one
      for (const s of sites) {
        await checkSingleSite(s.url, s.name);
      }
    } finally {
      setIsRunningAll(false);
    }
  };

  const handleCustomTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customUrl) return;
    let target = customUrl.trim();
    if (!target.startsWith('http://') && !target.startsWith('https://')) {
      target = 'https://' + target;
    }
    setCustomTesting(true);
    await checkSingleSite(target, '사용자 입력 URL');
    setCustomTesting(false);
  };

  const testedCount = Object.keys(results).length;
  const okCount = Object.values(results).filter(r => r.status === 'OK').length;
  const failCount = Object.values(results).filter(r => r.status === 'FAIL').length;
  const avgDuration = testedCount > 0
    ? Math.round(Object.values(results).reduce((acc, curr) => acc + (curr.durationMs || 0), 0) / testedCount)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header & Global Trigger */}
      <div className="p-6 bg-[#0f1629]/90 border border-slate-800 rounded-2xl shadow-xl backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-white">실시간 라이브 헬스체크 (Live Probe)</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            현재 AI Studio 서버에서 등록된 모든 사이트에 실시간 HTTP 프로브를 직접 전송하여 응답 코드와 지연 시간을 측정합니다.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={checkAllSites}
            disabled={isRunningAll}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition disabled:opacity-50"
          >
            {isRunningAll ? (
              <>
                <RotateCw className="w-4 h-4 animate-spin" />
                <span>14개 사이트 점검 진행 중...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>전체 14개 사이트 지금 점검</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Quick Metrics Bar */}
      {testedCount > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-[#0f1629] border border-slate-800 p-4 rounded-xl">
            <div className="text-xs text-slate-400">점검 완료 사이트</div>
            <div className="text-2xl font-black text-white mt-1">{testedCount}개</div>
          </div>
          <div className="bg-[#0f1629] border border-slate-800 p-4 rounded-xl">
            <div className="text-xs text-emerald-400">정상 응답 (OK)</div>
            <div className="text-2xl font-black text-emerald-400 mt-1">{okCount}개</div>
          </div>
          <div className="bg-[#0f1629] border border-slate-800 p-4 rounded-xl">
            <div className="text-xs text-rose-400">장애 발생 (FAIL)</div>
            <div className={`text-2xl font-black mt-1 ${failCount > 0 ? 'text-rose-400' : 'text-slate-400'}`}>
              {failCount}개
            </div>
          </div>
          <div className="bg-[#0f1629] border border-slate-800 p-4 rounded-xl">
            <div className="text-xs text-indigo-400">평균 응답 속도</div>
            <div className="text-2xl font-black text-indigo-300 mt-1">{avgDuration}ms</div>
          </div>
        </div>
      )}

      {/* Custom URL Tester */}
      <form onSubmit={handleCustomTest} className="p-4 bg-[#0f1629]/80 border border-slate-800 rounded-xl flex flex-col sm:flex-row gap-3 items-center">
        <div className="relative flex-1 w-full">
          <Globe className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={customUrl}
            onChange={(e) => setCustomUrl(e.target.value)}
            placeholder="임의의 다른 URL 테스트 (예: https://www.nexon.com)"
            className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
        <button
          type="submit"
          disabled={customTesting || !customUrl}
          className="w-full sm:w-auto px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 flex items-center justify-center gap-1.5 transition disabled:opacity-50"
        >
          {customTesting ? <RotateCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
          <span>단일 URL 테스트</span>
        </button>
      </form>

      {/* Sites Live Table */}
      <div className="bg-[#0f1629]/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-200">등록된 14개 사이트 실시간 상태</h3>
          <span className="text-xs text-slate-400">
            총 {sites.length}개 대상
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/80 text-slate-400 uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-4 font-semibold w-48">사이트명</th>
                <th className="py-3.5 px-4 font-semibold">URL</th>
                <th className="py-3.5 px-4 font-semibold w-36">실시간 상태</th>
                <th className="py-3.5 px-4 font-semibold w-36">HTTP 응답</th>
                <th className="py-3.5 px-4 font-semibold w-32">응답 속도</th>
                <th className="py-3.5 px-4 font-semibold w-28 text-right">개별 점검</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {sites.map((site, idx) => {
                const res = results[site.url];
                const isTesting = testingUrl === site.url || isRunningAll;

                return (
                  <tr key={idx} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 font-bold text-slate-200">
                      {site.name}
                    </td>

                    <td className="py-3 px-4">
                      <a
                        href={site.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-slate-300 hover:text-indigo-400 font-mono text-[11px] inline-flex items-center gap-1"
                      >
                        <span className="truncate max-w-[280px]">{site.url}</span>
                        <ExternalLink className="w-3 h-3 text-slate-500" />
                      </a>
                    </td>

                    <td className="py-3 px-4">
                      {isTesting && !res ? (
                        <span className="inline-flex items-center gap-1.5 text-indigo-400 text-[11px]">
                          <RotateCw className="w-3 h-3 animate-spin" />
                          <span>요청 중...</span>
                        </span>
                      ) : res ? (
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[10px] border ${
                          res.status === 'OK'
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                            : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                        }`}>
                          {res.status === 'OK' ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                          {res.status === 'OK' ? '정상 가동' : '장애'}
                        </span>
                      ) : (
                        <span className="text-slate-500 text-[11px]">미점검</span>
                      )}
                    </td>

                    <td className="py-3 px-4 font-mono">
                      {res?.httpStatus ? (
                        <span className={`font-bold ${res.httpStatus < 400 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {res.httpStatus} {res.statusText || ''}
                        </span>
                      ) : res?.error ? (
                        <span className="text-[10px] text-rose-400 line-clamp-1" title={res.error}>
                          {res.error}
                        </span>
                      ) : (
                        <span className="text-slate-600">-</span>
                      )}
                    </td>

                    <td className="py-3 px-4 font-mono">
                      {typeof res?.durationMs === 'number' ? (
                        <span className={`inline-flex items-center gap-1 font-semibold ${
                          res.durationMs < 500 
                            ? 'text-emerald-400' 
                            : res.durationMs < 1500 
                            ? 'text-amber-400' 
                            : 'text-rose-400'
                        }`}>
                          <Clock className="w-3 h-3" />
                          {res.durationMs}ms
                        </span>
                      ) : (
                        <span className="text-slate-600">-</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => checkSingleSite(site.url, site.name)}
                        disabled={isTesting}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-[11px] transition disabled:opacity-40"
                      >
                        {testingUrl === site.url ? (
                          <RotateCw className="w-3 h-3 animate-spin mx-auto" />
                        ) : (
                          '점검'
                        )}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

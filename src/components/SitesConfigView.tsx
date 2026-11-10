import React, { useState } from 'react';
import { SiteConfig, SitesJson } from '../types';
import { 
  Plus, 
  Trash2, 
  Save, 
  Check, 
  AlertCircle, 
  Globe, 
  Sliders, 
  FileCode,
  Copy
} from 'lucide-react';

interface Props {
  sitesConfig: SitesJson;
  onSaveConfig: (updated: SitesJson) => Promise<boolean>;
  isSaving: boolean;
}

export const SitesConfigView: React.FC<Props> = ({
  sitesConfig,
  onSaveConfig,
  isSaving
}) => {
  const [config, setConfig] = useState<SitesJson>(sitesConfig);
  const [newSiteName, setNewSiteName] = useState('');
  const [newSiteUrl, setNewSiteUrl] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'list' | 'json'>('list');

  const handleAddSite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSiteName.trim() || !newSiteUrl.trim()) return;

    let url = newSiteUrl.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }

    const newSite: SiteConfig = {
      name: newSiteName.trim(),
      url,
      waitUntil: 'networkidle'
    };

    setConfig(prev => ({
      ...prev,
      sites: [...prev.sites, newSite]
    }));

    setNewSiteName('');
    setNewSiteUrl('');
  };

  const handleRemoveSite = (index: number) => {
    setConfig(prev => ({
      ...prev,
      sites: prev.sites.filter((_, idx) => idx !== index)
    }));
  };

  const handleSave = async () => {
    const success = await onSaveConfig(config);
    if (success) {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
  };

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(config, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-6 bg-[#0f1629]/90 border border-slate-800 rounded-2xl shadow-xl backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <Sliders className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-white">모니터링 대상 사이트 설정 (sites.json)</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            GitHub Actions가 주기적으로 접속하여 스크린샷과 상태를 기록할 대상 사이트 목록입니다.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setActiveSubTab(activeSubTab === 'list' ? 'json' : 'list')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
          >
            <FileCode className="w-4 h-4 text-slate-400" />
            <span>{activeSubTab === 'list' ? 'JSON 코드 보기' : '목록 폼 보기'}</span>
          </button>

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30 transition disabled:opacity-50"
          >
            {isSaving ? (
              <span>저장 중...</span>
            ) : saveSuccess ? (
              <>
                <Check className="w-4 h-4" />
                <span>저장 완료!</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>sites.json 변경사항 저장</span>
              </>
            )}
          </button>
        </div>
      </div>

      {activeSubTab === 'list' ? (
        <>
          {/* Add New Site Form */}
          <form onSubmit={handleAddSite} className="p-5 bg-[#0f1629]/80 border border-slate-800 rounded-2xl shadow-lg space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
              <Plus className="w-4 h-4" />
              새로운 모니터링 사이트 추가
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
              <div className="md:col-span-4">
                <input
                  type="text"
                  value={newSiteName}
                  onChange={(e) => setNewSiteName(e.target.value)}
                  placeholder="사이트 이름 (예: Nexon 메인, 고객센터...)"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>
              <div className="md:col-span-6">
                <input
                  type="text"
                  value={newSiteUrl}
                  onChange={(e) => setNewSiteUrl(e.target.value)}
                  placeholder="접속 URL (예: https://www.nexon.com)"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>
              <div className="md:col-span-2">
                <button
                  type="submit"
                  className="w-full py-2 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white flex items-center justify-center gap-1 transition shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>추가</span>
                </button>
              </div>
            </div>
          </form>

          {/* Current Sites Table */}
          <div className="bg-[#0f1629]/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-200">
                등록된 사이트 목록 ({config.sites.length}개)
              </h3>
              <span className="text-xs text-slate-400">
                동시 실행 수: {config.settings?.concurrency ?? 3} · 타임아웃: {((config.settings?.timeoutMs ?? 100000) / 1000)}초
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/80 text-slate-400 uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4 w-12 text-center">#</th>
                    <th className="py-3 px-4 w-56 font-semibold">사이트명</th>
                    <th className="py-3 px-4 font-semibold">URL</th>
                    <th className="py-3 px-4 w-36 font-semibold">완료 조건</th>
                    <th className="py-3 px-4 w-24 text-right">삭제</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {config.sites.map((site, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4 text-center font-mono text-slate-500">
                        {idx + 1}
                      </td>
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
                          <Globe className="w-3.5 h-3.5 text-slate-500" />
                          <span>{site.url}</span>
                        </a>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-400">
                        <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px]">
                          {site.waitUntil || 'networkidle'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleRemoveSite(idx)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/20 transition"
                          title="삭제"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* JSON Editor view */
        <div className="bg-[#0f1629]/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <FileCode className="w-4 h-4 text-indigo-400" />
              sites.json 파일 소스
            </h3>
            <button
              onClick={handleCopyJson}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 transition"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? '복사됨!' : 'JSON 복사'}</span>
            </button>
          </div>
          <textarea
            value={JSON.stringify(config, null, 2)}
            onChange={(e) => {
              try {
                const parsed = JSON.parse(e.target.value);
                setConfig(parsed);
              } catch {
                // allow editing
              }
            }}
            rows={22}
            className="w-full p-4 bg-slate-950 font-mono text-xs text-indigo-200 border border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500"
          />
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <AlertCircle className="w-4 h-4 text-indigo-400 shrink-0" />
            <span>이 파일 내용을 복사하여 GitHub 저장소의 `sites.json`에 붙여넣기할 수도 있습니다.</span>
          </div>
        </div>
      )}
    </div>
  );
};

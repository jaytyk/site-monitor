import React, { useState } from 'react';
import { X, ExternalLink, ZoomIn, ZoomOut, RotateCcw, Clock, Globe } from 'lucide-react';
import { RunItem } from '../types';

interface Props {
  item: RunItem | null;
  onClose: () => void;
  basePrefix?: string;
}

export const ScreenshotModal: React.FC<Props> = ({ item, onClose, basePrefix = '' }) => {
  const [zoom, setZoom] = useState(1);

  if (!item) return null;

  const imgSrc = item.screenshot 
    ? (item.screenshot.startsWith('http') ? item.screenshot : `${basePrefix}/${item.screenshot.replace(/^\//, '')}`)
    : '';

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-5xl max-h-[92vh] flex flex-col bg-[#0f172a] border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#0b0f19]/90">
          <div className="flex items-center gap-3">
            <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${
              item.status === 'OK' 
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
            }`}>
              {item.status}
            </span>
            <h3 className="text-lg font-bold text-slate-100">{item.name}</h3>
            <a 
              href={item.url} 
              target="_blank" 
              rel="noreferrer"
              className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              <Globe className="w-3.5 h-3.5" />
              <span className="truncate max-w-[260px]">{item.url}</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center bg-slate-800/80 rounded-lg p-1 border border-slate-700 text-slate-300">
              <button 
                onClick={() => setZoom(z => Math.max(0.5, z - 0.25))}
                className="p-1 hover:bg-slate-700 rounded text-xs transition"
                title="축소"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="px-2 text-xs font-mono">{Math.round(zoom * 100)}%</span>
              <button 
                onClick={() => setZoom(z => Math.min(2.5, z + 0.25))}
                className="p-1 hover:bg-slate-700 rounded text-xs transition"
                title="확대"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setZoom(1)}
                className="p-1 hover:bg-slate-700 rounded text-xs transition ml-1"
                title="기본 배율"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            {imgSrc && (
              <a 
                href={imgSrc} 
                target="_blank" 
                rel="noreferrer"
                className="p-2 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-lg border border-slate-700 transition"
                title="원본 새 창 열기"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            )}

            <button 
              onClick={onClose}
              className="p-2 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 rounded-lg border border-transparent hover:border-rose-500/30 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Info bar */}
        <div className="flex flex-wrap items-center gap-4 px-6 py-2.5 bg-slate-900/60 border-b border-slate-800 text-xs text-slate-400 font-mono">
          {item.httpStatus && (
            <span className="flex items-center gap-1.5">
              <span className="font-semibold text-slate-300">HTTP Status:</span>
              <span className={item.httpStatus >= 400 ? 'text-rose-400' : 'text-emerald-400'}>
                {item.httpStatus}
              </span>
            </span>
          )}
          {typeof item.durationMs === 'number' && (
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span>소요시간:</span>
              <span className="text-indigo-300">{(item.durationMs / 1000).toFixed(2)}초</span>
            </span>
          )}
          {item.error && (
            <span className="text-rose-400 bg-rose-950/40 px-2 py-0.5 rounded border border-rose-800/50">
              오류: {item.error}
            </span>
          )}
        </div>

        {/* Modal Image Body with scroll & zoom */}
        <div className="flex-1 overflow-auto p-6 bg-[#090d16] flex justify-center items-start">
          {imgSrc ? (
            <img 
              src={imgSrc} 
              alt={item.name} 
              style={{ transform: `scale(${zoom})`, transformOrigin: 'top center' }}
              className="rounded-lg shadow-2xl transition-transform duration-150 max-w-full border border-slate-800"
              onError={(e) => {
                const localSrc = `/${(item.screenshot || '').replace(/^\//, '')}`;
                if (!e.currentTarget.src.endsWith(localSrc)) {
                  e.currentTarget.src = localSrc;
                }
              }}
            />
          ) : (
            <div className="text-center py-20 text-slate-500">
              스크린샷 이미지가 없습니다.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

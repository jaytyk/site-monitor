export interface SiteConfig {
  name: string;
  url: string;
  waitUntil?: 'load' | 'domcontentloaded' | 'networkidle' | 'commit';
  readySelector?: string;
}

export interface SettingsConfig {
  concurrency?: number;
  timeoutMs?: number;
  retentionRuns?: number;
  viewport?: {
    width: number;
    height: number;
  };
}

export interface SitesJson {
  settings: SettingsConfig;
  sites: SiteConfig[];
}

export interface RunItem {
  name: string;
  url: string;
  status: 'OK' | 'FAIL';
  httpStatus: number | null;
  durationMs: number | null;
  error?: string | null;
  screenshot?: string;
  checkedAt?: string;
}

export interface RunDetail {
  id: string;
  overall: 'OK' | 'FAIL';
  total: number;
  failed: number;
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  items: RunItem[];
}

export interface RunIndexItem {
  id: string;
  overall: 'OK' | 'FAIL';
  total: number;
  failed: number;
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  runJson: string;
}

export interface RunIndex {
  runs: RunIndexItem[];
}

export interface LiveCheckResult {
  name?: string;
  url: string;
  status: 'OK' | 'FAIL';
  httpStatus: number | null;
  statusText?: string;
  durationMs: number;
  error?: string;
  checkedAt: string;
}

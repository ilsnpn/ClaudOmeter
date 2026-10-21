import useSWR from 'swr';
import { useSyncExternalStore } from 'react';
import type { DashboardStats, ProjectInfo, SessionInfo, SessionDetail } from '@/lib/claude-data/types';
import {
  getDashboardStats,
  getProjects,
  getSessions,
  getProjectSessions,
  searchSessions,
  getSessionDetail,
} from '@/lib/claude-data/reader';
import { getValueStats, type ValueStats } from '@/lib/claude-data/value';
import { subscribe, getVersion } from '@/lib/claude-data/vfs';

// Data is parsed in the browser from the loaded folder; the version keys the
// SWR cache so a new folder invalidates everything.
export function useDataVersion() {
  return useSyncExternalStore(subscribe, getVersion, () => 0);
}

function useLocal<T>(key: string, load: () => Promise<T>) {
  const version = useDataVersion();
  return useSWR<T>(version ? [key, version] : null, load, { revalidateOnFocus: false });
}

export function useStats() {
  return useLocal<DashboardStats>('stats', getDashboardStats);
}

export function useProjects() {
  return useLocal<ProjectInfo[]>('projects', getProjects);
}

export function useSessions(limit = 50, offset = 0, query = '') {
  return useLocal<SessionInfo[]>(
    `sessions:${limit}:${offset}:${query}`,
    () => query ? searchSessions(query, limit) : getSessions(limit, offset),
  );
}

export function useProjectSessions(projectId: string) {
  return useLocal<SessionInfo[]>(`project-sessions:${projectId}`, () => getProjectSessions(projectId));
}

export function useSessionDetail(sessionId: string) {
  return useLocal<SessionDetail>(`session:${sessionId}`, async () => {
    const session = await getSessionDetail(sessionId);
    if (!session) throw new Error('Session not found');
    return session;
  });
}

export function useValueStats() {
  return useLocal<ValueStats>('value', getValueStats);
}

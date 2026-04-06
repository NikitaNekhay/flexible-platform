import { baseApi } from './baseApi';
import type { Session } from '@/types';

function normalizeSession(raw: Record<string, unknown>): Session {
  return {
    id: String(raw.id ?? ''),
    name: String(raw.name ?? ''),
    hostname: String(raw.hostname ?? ''),
    os: String(raw.os ?? ''),
    username: String(raw.username ?? ''),
    arch: String(raw.arch ?? ''),
    pid: Number(raw.pid ?? 0),
    connected_at: String(raw.connected_at ?? ''),
    last_seen: String(raw.last_seen ?? ''),
  };
}

export const sessionsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getSessions: builder.query<Session[], void>({
      query: () => ({ url: '/sessions', method: 'GET' }),
      transformResponse: (response: Record<string, unknown>[]) =>
        (response ?? []).map(normalizeSession),
      providesTags: ['Session'],
    }),
  }),
});

export const { useGetSessionsQuery } = sessionsApi;

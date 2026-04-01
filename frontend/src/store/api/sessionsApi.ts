import { baseApi } from './baseApi';
import type { Session } from '@/types';

interface SessionRaw {
  ID: string;
  Hostname: string;
  OS: string;
  Username: string;
  Arch: string;
  PID: number;
  ConnectedAt: string;
  LastSeen: string;
}

function normalizeSession(raw: SessionRaw): Session {
  return {
    id: raw.ID,
    hostname: raw.Hostname,
    os: raw.OS,
    username: raw.Username,
    arch: raw.Arch,
    pid: raw.PID,
    connected_at: raw.ConnectedAt,
    last_seen: raw.LastSeen,
  };
}

export const sessionsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getSessions: builder.query<Session[], void>({
      query: () => ({ url: '/sessions', method: 'GET' }),
      transformResponse: (response: SessionRaw[]) =>
        (response ?? []).map(normalizeSession),
      providesTags: ['Session'],
    }),
  }),
});

export const { useGetSessionsQuery } = sessionsApi;

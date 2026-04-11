import { baseApi } from './baseApi';
import axiosInstance from '@/services/axiosInstance';
import type { Session, ImplantParams } from '@/types';

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
    remote_address: raw.remote_address ? String(raw.remote_address) : undefined,
  };
}

/**
 * Downloads a compiled Sliver beacon implant as a Blob.
 * First call compiles the beacon (~1-2 min). Subsequent calls return from cache instantly.
 * Uses a 3-minute timeout to accommodate the compilation time.
 *
 * Linux:   GET /implant/linux?c2=...&name=...&arch=...&port=...
 * Windows: GET /implant/windows?c2=...&name=...
 */
export async function downloadImplant(params: ImplantParams): Promise<Blob> {
  const query: Record<string, string | number> = { c2: params.c2 };
  if (params.name)             query.name = params.name;
  if (params.arch)             query.arch = params.arch;
  if (params.port !== undefined) query.port = params.port;

  const response = await axiosInstance({
    url: `/implant/${params.platform}`,
    method: 'GET',
    params: query,
    responseType: 'blob',
    timeout: 180_000, // 3 minutes — compilation can take ~1-2 min
  });
  return response.data as Blob;
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

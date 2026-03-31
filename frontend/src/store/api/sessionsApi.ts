import { baseApi } from './baseApi';
import type { Session } from '@/types';

export const sessionsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getSessions: builder.query<Session[], void>({
      query: () => ({ url: '/sessions', method: 'GET' }),
      providesTags: ['Session'],
    }),
  }),
});

export const { useGetSessionsQuery } = sessionsApi;

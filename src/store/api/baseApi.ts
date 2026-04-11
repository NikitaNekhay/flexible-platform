import { createApi } from '@reduxjs/toolkit/query/react';
import type { BaseQueryFn } from '@reduxjs/toolkit/query';
import type { AxiosRequestConfig, AxiosError } from 'axios';
import axiosInstance from '@/services/axiosInstance';

const axiosBaseQuery =
  (): BaseQueryFn<AxiosRequestConfig, unknown, { status?: number; data: unknown }> =>
  async (config) => {
    try {
      const result = await axiosInstance(config);
      return { data: result.data };
    } catch (e) {
      const err = e as AxiosError;
      return {
        error: {
          status: err.response?.status,
          data: err.response?.data ?? err.message,
        },
      };
    }
  };

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: axiosBaseQuery(),
  refetchOnFocus: true,
  tagTypes: ['Chain', 'Session', 'Atomic', 'Execution', 'Health'],
  endpoints: () => ({}),
});

import { baseApi } from './baseApi';
import type { Atomic, AtomicTest, AtomicArgument } from '@/types';

/* ── List endpoint normalization ─────────────────────────────────────────────
 * Backend returns: { id, display_name, tactic, platforms, tests: [{index, name}] }
 * Frontend needs:  { technique_id, technique_name, tactic, tests: [{test_index, name, ...}] }
 */
interface ListItemRaw {
  id: string;
  display_name: string;
  tactic: string;
  platforms: string[];
  tests: Array<{ index: number; name: string }>;
}

function normalizeListItem(raw: ListItemRaw): Atomic {
  return {
    technique_id: raw.id,
    technique_name: raw.display_name,
    tactic: raw.tactic ?? '',
    tests: (raw.tests ?? []).map((t) => ({
      test_index: t.index,
      name: t.name,
      description: '',
      platforms: raw.platforms ?? [],
      executor: '',
      arguments: [],
    })),
  };
}

/* ── Detail endpoint normalization ───────────────────────────────────────────
 * Backend returns PascalCase Go struct fields:
 *   { ID, DisplayName, Tactic, Platforms, Tests: [{Name, GUID, Description,
 *     SupportedPlatforms, InputArguments: {argName: {Description, Type, Default}},
 *     Executor: {Name, Command, ElevationRequired}, ...}] }
 */
interface DetailRaw {
  ID: string;
  DisplayName: string;
  Tactic: string;
  Platforms: string[] | null;
  Tests: Array<{
    Name: string;
    GUID?: string;
    Description?: string;
    SupportedPlatforms?: string[];
    InputArguments?: Record<string, { Description: string; Type: string; Default: string }> | null;
    Executor?: { Name: string; Command?: string; ElevationRequired?: boolean };
  }> | null;
}

function normalizeDetail(raw: DetailRaw): Atomic {
  return {
    technique_id: raw.ID,
    technique_name: raw.DisplayName,
    tactic: raw.Tactic ?? '',
    tests: (raw.Tests ?? []).map((t, i) => {
      const args: AtomicArgument[] = Object.entries(t.InputArguments ?? {}).map(
        ([name, a]) => ({
          name,
          description: a.Description ?? '',
          type: (a.Type?.toLowerCase() ?? 'string') as AtomicArgument['type'],
          default: a.Default,
          required: !a.Default,
        }),
      );
      return {
        test_index: i,
        name: t.Name,
        description: t.Description ?? '',
        platforms: t.SupportedPlatforms ?? [],
        executor: t.Executor?.Name ?? '',
        arguments: args,
      } satisfies AtomicTest;
    }),
  };
}

export const atomicsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAtomics: builder.query<Atomic[], void>({
      query: () => ({ url: '/atomics', method: 'GET' }),
      transformResponse: (response: ListItemRaw[]) =>
        (response ?? []).map(normalizeListItem),
      providesTags: ['Atomic'],
    }),
    getAtomic: builder.query<Atomic, string>({
      query: (id) => ({ url: `/atomics/${id}`, method: 'GET' }),
      transformResponse: (response: DetailRaw) => normalizeDetail(response),
      providesTags: (_r, _e, id) => [{ type: 'Atomic', id }],
    }),
  }),
});

export const { useGetAtomicsQuery, useGetAtomicQuery } = atomicsApi;

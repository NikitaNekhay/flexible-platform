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
 * Backend returns the Go Technique struct serialized with YAML→JSON field names:
 *   { attack_technique, display_name, tactic, platforms, atomic_tests: [{name, auto_generated_guid,
 *     description, supported_platforms, input_arguments: {argName: {description, type, default}},
 *     executor: {name, command}, ...}] }
 */
interface DetailRaw {
  attack_technique: string;
  display_name: string;
  tactic: string;
  platforms: string[];
  atomic_tests: Array<{
    name: string;
    auto_generated_guid?: string;
    description?: string;
    supported_platforms?: string[];
    input_arguments?: Record<string, { description: string; type: string; default: string }>;
    executor?: { name: string; command?: string };
  }>;
}

function normalizeDetail(raw: DetailRaw): Atomic {
  return {
    technique_id: raw.attack_technique,
    technique_name: raw.display_name,
    tactic: raw.tactic ?? '',
    tests: (raw.atomic_tests ?? []).map((t, i) => {
      const args: AtomicArgument[] = Object.entries(t.input_arguments ?? {}).map(
        ([name, a]) => ({
          name,
          description: a.description ?? '',
          type: (a.type ?? 'string') as AtomicArgument['type'],
          default: a.default,
          required: !a.default,
        }),
      );
      return {
        test_index: i,
        name: t.name,
        description: t.description ?? '',
        platforms: t.supported_platforms ?? [],
        executor: t.executor?.name ?? '',
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

import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export type Summary = {
  requests: number;
  status_classes: Record<string, number>;
  server_error_rate: number;
  success_rate: number;
  avg_ms: number | null;
  p50_ms: number | null;
  p95_ms: number | null;
  p99_ms: number | null;
};
export type Endpoint = Summary & { service: string; environment: string; method: string; route: string; spark: number[]; spark_err: number[] };
export type Analytics = { summary: Summary; series: { t: string; requests: number; errors: number }[]; endpoints: Endpoint[] };
export type Project = { id: string; name: string; status: string; role: string };
export type ProjectDetail = { id: string; name: string; description: string | null; status: string; role: string; created_at: string };
export type Member = { userId: string; account: string; role: string; createdAt: string; you: boolean };
export type ApiKey = { id: string; key_id: string; name: string; scopes: string[]; created_at: string; last_used_at: string | null; revoked_at: string | null };
export type Me = { id: string; account: string; isOperator: boolean };
export type OperatorOverview = { total: Summary; projects: (Summary & { id: string; name: string; status: string })[] };

export type Site = { id: string; domain: string; status: string; tracker_ready: boolean; challenge: { token: string; dns: string; http: string } | null };
export type WebReport = { domain: string; snippet: string; pageviews: number; visitors: number; visits: number; bounce_rate: number; avg_session_seconds: number; referrers: { name: string; count: number }[]; countries: { name: string; count: number }[]; browsers: { name: string; count: number }[]; devices: { name: string; count: number }[] };
export type Funnel = { reported_by: string; verified_on_ledger: boolean; funnel: { event: string; count: number }[] };

export const pyxisApi = createApi({
  reducerPath: "pyxisApi",
  baseQuery: fetchBaseQuery({ baseUrl: "/api/v1", credentials: "same-origin" }),
  tagTypes: ["Sites", "Me", "Projects", "Keys", "Analytics", "Operator", "Project", "Members"],
  endpoints: (b) => ({
    me: b.query<{ user: Me | null }, void>({ query: () => "/me", providesTags: ["Me"] }),
    challenge: b.mutation<{ nonce: string; message: string }, { account: string }>({
      query: (body) => ({ url: "/auth/challenge", method: "POST", body }),
    }),
    verify: b.mutation<{ ok: true }, { account: string; nonce: string; signature: string }>({
      query: (body) => ({ url: "/auth/verify", method: "POST", body }),
      invalidatesTags: ["Me", "Projects"],
    }),
    logout: b.mutation<{ ok: true }, void>({ query: () => ({ url: "/auth/logout", method: "POST" }), invalidatesTags: ["Me", "Projects", "Keys", "Analytics", "Operator"] }),
    projects: b.query<{ projects: Project[] }, void>({ query: () => "/projects", providesTags: ["Projects"] }),
    createProject: b.mutation<{ id: string }, { name: string; description?: string }>({
      query: (body) => ({ url: "/projects", method: "POST", body }),
      invalidatesTags: ["Projects"],
    }),
    project: b.query<ProjectDetail, string>({ query: (id) => `/projects/${id}`, providesTags: ["Project"] }),
    updateProject: b.mutation<{ ok: true }, { id: string; name: string; description: string | null }>({
      query: ({ id, ...body }) => ({ url: `/projects/${id}`, method: "PATCH", body }),
      invalidatesTags: ["Project", "Projects"],
    }),
    members: b.query<{ members: Member[] }, string>({ query: (id) => `/projects/${id}/members`, providesTags: ["Members"] }),
    addMember: b.mutation<{ ok: true }, { id: string; account: string; role: string }>({
      query: ({ id, ...body }) => ({ url: `/projects/${id}/members`, method: "POST", body }),
      invalidatesTags: ["Members"],
    }),
    removeMember: b.mutation<{ ok: true }, { id: string; userId: string }>({
      query: ({ id, userId }) => ({ url: `/projects/${id}/members/${userId}`, method: "DELETE" }),
      invalidatesTags: ["Members"],
    }),
    analytics: b.query<Analytics, { id: string; hours: number; previous?: boolean }>({
      // previous: the equal-length window immediately before the selected range, used for change-vs-previous deltas.
      query: ({ id, hours, previous }) => {
        const now = Date.now();
        const from = now - hours * 3600_000 * (previous ? 2 : 1);
        const to = previous ? now - hours * 3600_000 : null;
        return `/projects/${id}/analytics?from=${encodeURIComponent(new Date(from).toISOString())}${to ? `&to=${encodeURIComponent(new Date(to).toISOString())}` : ""}`;
      },
      providesTags: (_r, _e, a) => [{ type: "Analytics", id: a.id }],
    }),
    keys: b.query<{ keys: ApiKey[] }, string>({ query: (id) => `/projects/${id}/keys`, providesTags: ["Keys"] }),
    createKey: b.mutation<{ keyId: string; token: string }, { id: string; name: string; scopes: string[] }>({
      query: ({ id, ...body }) => ({ url: `/projects/${id}/keys`, method: "POST", body }),
      invalidatesTags: ["Keys"],
    }),
    revokeKey: b.mutation<{ ok: true }, { id: string; keyId: string }>({
      query: ({ id, keyId }) => ({ url: `/projects/${id}/keys/${keyId}`, method: "DELETE" }),
      invalidatesTags: ["Keys"],
    }),
    sites: b.query<{ sites: Site[] }, string>({ query: (id) => `/projects/${id}/sites`, providesTags: ["Sites"] }),
    addSite: b.mutation<{ id: string }, { id: string; domain: string }>({ query: ({ id, domain }) => ({ url: `/projects/${id}/sites`, method: "POST", body: { domain } }), invalidatesTags: ["Sites"] }),
    verifySite: b.mutation<{ verified: boolean; detail: string; tracker_ready?: boolean }, { id: string; siteId: string }>({ query: ({ id, siteId }) => ({ url: `/projects/${id}/sites/${siteId}/verify`, method: "POST" }), invalidatesTags: ["Sites"] }),
    web: b.query<WebReport, { id: string; siteId: string; hours: number }>({ query: ({ id, siteId, hours }) => `/projects/${id}/sites/${siteId}/web?from=${encodeURIComponent(new Date(Date.now() - hours * 3600_000).toISOString())}` }),
    wallet: b.query<Funnel, { id: string; hours: number }>({ query: ({ id, hours }) => `/projects/${id}/wallet?from=${encodeURIComponent(new Date(Date.now() - hours * 3600_000).toISOString())}` }),
    operator: b.query<OperatorOverview, number>({
      query: (hours) => `/operator/overview?from=${encodeURIComponent(new Date(Date.now() - hours * 3600_000).toISOString())}`,
      providesTags: ["Operator"],
    }),
    setStatus: b.mutation<{ ok: true }, { id: string; status: string }>({
      query: ({ id, status }) => ({ url: `/operator/projects/${id}/status`, method: "PATCH", body: { status } }),
      invalidatesTags: ["Operator", "Projects"],
    }),
  }),
});

export const {
  useMeQuery, useProjectQuery, useUpdateProjectMutation, useMembersQuery, useAddMemberMutation, useRemoveMemberMutation, useChallengeMutation, useVerifyMutation, useLogoutMutation, useProjectsQuery, useCreateProjectMutation,
  useAnalyticsQuery, useKeysQuery, useCreateKeyMutation, useRevokeKeyMutation, useOperatorQuery, useSitesQuery, useAddSiteMutation, useVerifySiteMutation, useWebQuery, useWalletQuery, useSetStatusMutation,
} = pyxisApi;

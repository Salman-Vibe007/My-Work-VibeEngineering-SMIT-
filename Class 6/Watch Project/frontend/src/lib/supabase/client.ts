import { createBrowserClient } from "@supabase/ssr";

type BrowserClient = ReturnType<typeof createBrowserClient>;

function createFallbackClient(): BrowserClient {
  const query = {
    select: () => query,
    eq: () => query,
    order: () => query,
    limit: () => query,
    gte: () => query,
    lte: () => query,
    or: () => query,
    single: async () => ({ data: null, error: null }),
    maybeSingle: async () => ({ data: null, error: null }),
    then: (resolve: (result: { data: never[]; error: null }) => unknown) =>
      Promise.resolve({ data: [], error: null }).then(resolve),
  };

  const fallback = {
    auth: {
      getUser: async () => ({ data: { user: null }, error: null }),
      signInWithPassword: async () => ({ data: { user: null, session: null }, error: null }),
      signUp: async () => ({ data: { user: null, session: null }, error: null }),
      signOut: async () => ({ error: null }),
      updateUser: async () => ({ data: { user: null }, error: null }),
      onAuthStateChange: () => ({
        data: { subscription: { unsubscribe: () => undefined } },
      }),
    },
    from: () => ({
      select: () => query,
      insert: () => ({
        select: () => ({
          single: async () => ({ data: null, error: null }),
        }),
      }),
      update: () => ({
        eq: () => ({
          select: () => ({
            single: async () => ({ data: null, error: null }),
          }),
        }),
      }),
      delete: () => ({
        eq: async () => ({ error: null }),
      }),
    }),
  } as unknown as BrowserClient;

  return fallback;
}

export function createClient(): BrowserClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return createFallbackClient();
  }

  return createBrowserClient(
    supabaseUrl,
    supabaseAnonKey
  );
}

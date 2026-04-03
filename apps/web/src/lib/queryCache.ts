import {
  QueryClient,
  dehydrate,
  hydrate,
  type Query,
} from "@tanstack/react-query";

const QUERY_CACHE_STORAGE_KEY = "pebric-query-cache-v1";
const QUERY_CACHE_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

export const CATALOG_STALE_TIME = 30 * 60 * 1000;
const LONG_LIVED_GC_TIME = 24 * 60 * 60 * 1000;

export const CATALOG_QUERY_OPTIONS = {
  staleTime: CATALOG_STALE_TIME,
  gcTime: LONG_LIVED_GC_TIME,
  refetchOnWindowFocus: false as const,
  refetchOnReconnect: false as const,
  retry: 1,
};

export const REVIEW_SUMMARY_QUERY_OPTIONS = {
  staleTime: 10 * 60 * 1000,
  gcTime: LONG_LIVED_GC_TIME,
  refetchOnWindowFocus: false as const,
  refetchOnReconnect: false as const,
  retry: 1,
};

function shouldPersistQuery(query: Query) {
  if (query.state.status !== "success" || query.state.data === undefined) {
    return false;
  }

  const [head, second] = query.queryKey;

  if (head === "products") {
    return (
      second === undefined ||
      second === "collection" ||
      second === "best-sellers" ||
      second === "new-arrivals"
    );
  }

  if (
    head === "product" ||
    head === "product-by-id" ||
    head === "collections" ||
    head === "categories"
  ) {
    return true;
  }

  return head === "reviews" && second === "summary";
}

function loadPersistedCatalogState() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(QUERY_CACHE_STORAGE_KEY);

    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as {
      persistedAt?: number;
      state?: unknown;
    };

    if (
      !parsed.persistedAt ||
      Date.now() - parsed.persistedAt > QUERY_CACHE_MAX_AGE
    ) {
      window.localStorage.removeItem(QUERY_CACHE_STORAGE_KEY);
      return null;
    }

    return parsed.state;
  } catch {
    window.localStorage.removeItem(QUERY_CACHE_STORAGE_KEY);
    return null;
  }
}

function persistCatalogState(queryClient: QueryClient) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const state = dehydrate(queryClient, {
      shouldDehydrateQuery: shouldPersistQuery,
    });

    window.localStorage.setItem(
      QUERY_CACHE_STORAGE_KEY,
      JSON.stringify({
        persistedAt: Date.now(),
        state,
      }),
    );
  } catch {
    window.localStorage.removeItem(QUERY_CACHE_STORAGE_KEY);
  }
}

export function createAppQueryClient() {
  const queryClient = new QueryClient();
  const persistedState = loadPersistedCatalogState();

  if (persistedState) {
    hydrate(queryClient, persistedState);
  }

  return queryClient;
}

export function subscribeToPersistedCatalogCache(queryClient: QueryClient) {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  let timeoutId: number | undefined;

  const schedulePersist = () => {
    window.clearTimeout(timeoutId);
    timeoutId = window.setTimeout(() => {
      persistCatalogState(queryClient);
    }, 250);
  };

  schedulePersist();

  const unsubscribe = queryClient.getQueryCache().subscribe(() => {
    schedulePersist();
  });

  return () => {
    window.clearTimeout(timeoutId);
    unsubscribe();
  };
}

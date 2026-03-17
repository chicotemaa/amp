type CacheEntry = {
  expiresAt: number;
  hasValue: boolean;
  value: unknown;
  promise?: Promise<unknown>;
};

type QueryCacheGlobal = typeof globalThis & {
  __ampClientQueryCache?: Map<string, CacheEntry>;
  __ampClientQueryCacheListenersReady?: boolean;
};

const CACHE_INVALIDATION_EVENTS = [
  "transactionCreated",
  "projectCreated",
  "projectPlanningUpdated",
  "projectProgressUpdated",
  "projectLaborUpdated",
  "projectProcurementUpdated",
  "projectRevenueUpdated",
  "projectContractsUpdated",
  "projectSiteLogUpdated",
  "projectIncidentsUpdated",
  "projectMaterialsUpdated",
  "projectAgendaUpdated",
  "agendaNotificationsUpdated",
  "clientCreated",
  "employeeCreated",
] as const;

function getClientGlobal() {
  return globalThis as QueryCacheGlobal;
}

function getClientQueryCache() {
  const clientGlobal = getClientGlobal();
  if (!clientGlobal.__ampClientQueryCache) {
    clientGlobal.__ampClientQueryCache = new Map<string, CacheEntry>();
  }

  return clientGlobal.__ampClientQueryCache;
}

function ensureCacheInvalidationListeners() {
  if (typeof window === "undefined") {
    return;
  }

  const clientGlobal = getClientGlobal();
  if (clientGlobal.__ampClientQueryCacheListenersReady) {
    return;
  }

  const clearAll = () => {
    getClientQueryCache().clear();
  };

  for (const eventName of CACHE_INVALIDATION_EVENTS) {
    window.addEventListener(eventName, clearAll);
  }

  clientGlobal.__ampClientQueryCacheListenersReady = true;
}

export async function getCachedQuery<T>(
  key: string,
  loader: () => Promise<T>,
  ttlMs = 10_000
): Promise<T> {
  if (typeof window === "undefined") {
    return loader();
  }

  ensureCacheInvalidationListeners();

  const cache = getClientQueryCache();
  const now = Date.now();
  const current = cache.get(key);

  if (current?.hasValue && current.expiresAt > now) {
    return current.value as T;
  }

  if (current?.promise) {
    return current.promise as Promise<T>;
  }

  const promise = loader()
    .then((value) => {
      cache.set(key, {
        expiresAt: Date.now() + ttlMs,
        hasValue: true,
        value,
      });

      return value;
    })
    .catch((error) => {
      const latest = cache.get(key);
      if (latest?.promise === promise) {
        cache.delete(key);
      }
      throw error;
    });

  cache.set(key, {
    expiresAt: now + ttlMs,
    hasValue: false,
    value: null,
    promise,
  });

  return promise;
}

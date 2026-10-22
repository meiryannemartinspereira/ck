
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient } from '@tanstack/react-query'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister'
import App from './App'

const CACHE_VERSION = 'ck-cache-v1'
const CACHE_MAX_AGE = 24 * 60 * 60 * 1000

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000,
      gcTime: CACHE_MAX_AGE,
      retry: 2,
      retryDelay: (attemptIndex) =>
        Math.min(1000 * 2 ** attemptIndex, 5000),
      refetchOnWindowFocus: true,
    },
  },
})

const persister = createSyncStoragePersister({
  storage: window.localStorage,
  key: 'ck-query-cache',
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister,
        maxAge: CACHE_MAX_AGE,
        buster: CACHE_VERSION,
      }}
    >
      <App />
    </PersistQueryClientProvider>
  </StrictMode>,
)

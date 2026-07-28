import { shouldUsePublicBootstrap } from '@/shared/publicPaths'

const boot = shouldUsePublicBootstrap()
  ? import('./bootstrap-public').then((m) => m.setupPublicApp())
  : import('./bootstrap-admin').then((m) => m.setupAdminApp())

boot.catch((error) => {
  console.error('Application bootstrap failed:', error)
})

import { openDocsSection } from '@/config/docsRouteMap'

/**
 * Returns a function that opens documentation for a specific section in a new tab.
 *
 * Usage in any view:
 *   const goToDoc = useDocHelp('grm-grievances')
 *   // then: <el-button @click="goToDoc()">Help</el-button>
 *
 * Section IDs map to the `id` fields on NavPage/NavSubGroup/NavGroup in Docs.vue.
 */
export function useDocHelp(sectionId: string) {
  return () => openDocsSection(sectionId)
}

import { useRouter } from 'vue-router'

/**
 * Returns a function that navigates to a specific section in the documentation.
 *
 * Usage in any view:
 *   const goToDoc = useDocHelp('grm-grievances')
 *   // then: <el-button @click="goToDoc()">Help</el-button>
 *
 * Section IDs map to the `id` fields on NavPage/NavSubGroup/NavGroup in Docs.vue.
 */
export function useDocHelp(sectionId: string) {
  const router = useRouter()
  return () => router.push({ path: '/docs', query: { section: sectionId } })
}

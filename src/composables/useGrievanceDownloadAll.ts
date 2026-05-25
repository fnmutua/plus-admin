import { computed, toValue, type MaybeRefOrGetter } from 'vue'

type FilterBundle = {
  filters: string[]
  filterValues: any[][]
  filterFunctions: string[]
}

export function buildGrievanceDownloadAllFilters(
  filters: string[],
  filterValues: any[][],
  filterFunctions: string[],
  isPrivilegedUser: boolean
): FilterBundle {
  const downloadFiltersList = [...filters]
  const downloadFilterValues = filterValues.map((arr) => [...arr])
  const downloadFilterFunctions = [...filterFunctions]

  const removeFilterAtIndex = (index: number) => {
    downloadFiltersList.splice(index, 1)
    downloadFilterValues.splice(index, 1)
    if (downloadFilterFunctions[index] !== undefined) {
      downloadFilterFunctions.splice(index, 1)
    }
  }

  const stripStatusFilters = () => {
    let statusIdx = downloadFiltersList.indexOf('status')
    while (statusIdx !== -1) {
      removeFilterAtIndex(statusIdx)
      statusIdx = downloadFiltersList.indexOf('status')
    }
  }

  if (isPrivilegedUser) {
    downloadFiltersList.length = 0
    downloadFilterValues.length = 0
    downloadFilterFunctions.length = 0
  } else {
    const statusIndex = downloadFiltersList.indexOf('status')
    let statusFilterPresent = false

    if (statusIndex !== -1) {
      const statusValues = downloadFilterValues[statusIndex]
      if (Array.isArray(statusValues)) {
        downloadFilterValues[statusIndex] = statusValues.filter(
          (val: any) => val !== 'Deleted'
        )

        if (downloadFilterValues[statusIndex].length === 0) {
          removeFilterAtIndex(statusIndex)
        } else {
          statusFilterPresent = true
        }
      }
    }

    stripStatusFilters()

    if (!statusFilterPresent) {
      downloadFiltersList.push('status')
      downloadFilterValues.push(['Deleted'])
      downloadFilterFunctions.push('notIn')
    }
  }

  return {
    filters: downloadFiltersList,
    filterValues: downloadFilterValues,
    filterFunctions: downloadFilterFunctions
  }
}

export function useGrievanceDownloadAll(options: {
  filters: MaybeRefOrGetter<string[]>
  filterValues: MaybeRefOrGetter<any[][]>
  filterFunction: MaybeRefOrGetter<string[]>
  isSuperAdmin: MaybeRefOrGetter<boolean>
  isRootAdmin: MaybeRefOrGetter<boolean>
  isNationalGRM: MaybeRefOrGetter<boolean>
  statuses?: MaybeRefOrGetter<Array<{ value: string; count: number }>>
}) {
  const isPrivilegedUser = computed(
    () =>
      Boolean(toValue(options.isSuperAdmin)) ||
      Boolean(toValue(options.isRootAdmin)) ||
      Boolean(toValue(options.isNationalGRM))
  )

  const downloadAllFilters = computed(() =>
    buildGrievanceDownloadAllFilters(
      toValue(options.filters) ?? [],
      toValue(options.filterValues) ?? [],
      toValue(options.filterFunction) ?? [],
      isPrivilegedUser.value
    )
  )

  const allDownloadCount = computed(() => {
    const statuses = toValue(options.statuses) ?? []
    if (isPrivilegedUser.value) {
      return statuses.find((s) => s.value === 'All')?.count ?? 0
    }
    return (
      statuses.find((s) => s.value === 'ReceivedAll')?.count ??
      statuses.find((s) => s.value === 'All')?.count ??
      0
    )
  })

  const canDownloadAllGrievances = computed(() => allDownloadCount.value > 0)

  return {
    downloadAllFilters,
    allDownloadCount,
    canDownloadAllGrievances
  }
}

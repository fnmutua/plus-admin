<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElTooltip } from 'element-plus'
import { Icon } from '@/components/Icon'
import { getAIIndexJobs } from '@/api/ai'
import type { AIIndexJob } from '@/api/ai/types'

/**
 * Indexing, visible from anywhere.
 *
 * Progress used to live only on the AI index page, so leaving it meant losing
 * sight of a batch that runs for an hour. This sits in the header, shows
 * nothing at all while nothing is running, and takes you to the page when
 * something is.
 */

const { push } = useRouter()

const job = ref<AIIndexJob | null>(null)
let poll: ReturnType<typeof setTimeout> | null = null
let allowed = true

const running = computed(() => job.value?.status === 'running')

const tooltip = computed(() => {
  const current = job.value
  if (!current) return ''
  const parts = [`${current.label} — ${current.done} of ${current.total}`]
  if (current.failed) parts.push(`${current.failed} failed`)
  if (current.current) parts.push(current.current)
  return parts.join(' · ')
})

const read = async () => {
  try {
    const response = await getAIIndexJobs()
    job.value = (response.data || []).find((entry) => entry.status === 'running') || null
  } catch (error: any) {
    // A user without document:read gets a 403; stop asking rather than
    // polling an endpoint that will never answer.
    if (error?.response?.status === 403 || error?.response?.status === 401) {
      allowed = false
      job.value = null
      return
    }
    job.value = null
  }

  if (!allowed) return
  // Often while something is happening, rarely otherwise.
  poll = setTimeout(read, running.value ? 3000 : 20000)
}

onMounted(read)
onBeforeUnmount(() => {
  if (poll) clearTimeout(poll)
})
</script>

<template>
  <ElTooltip v-if="running && job" :content="tooltip" placement="bottom" effect="dark">
    <div
      class="indexing hover-tigger cursor-pointer flex items-center justify-center rounded-md hover:bg-[var(--el-fill-color-light)] transition-colors"
      @click="push('/repo/ai-index')"
    >
      <Icon icon="eos-icons:loading" :size="18" color="var(--top-header-text-color)" />
      <span class="percent">{{ job.percent }}%</span>
    </div>
  </ElTooltip>
</template>

<style scoped>
.indexing {
  height: 36px;
  gap: 6px;
  padding: 0 10px;
}

/* Tabular figures so the number does not jitter as it counts up. */
.percent {
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  color: var(--top-header-text-color);
}
</style>

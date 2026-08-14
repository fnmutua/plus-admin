<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { Icon } from '@iconify/vue'
import { usePermissionStore } from '@/store/modules/permission'
import { useI18n } from '@/hooks/web/useI18n'
import { buildRouteSearchIndex, searchRoutes, type RouteSearchItem } from './routeSearchIndex'

const router = useRouter()
const permissionStore = usePermissionStore()
const { t } = useI18n()

const rootRef = ref<HTMLElement | null>(null)
const inputRef = ref<HTMLInputElement | null>(null)
const query = ref('')
const open = ref(false)
const activeIndex = ref(0)

/** Rebuilt whenever the user's routes change (login, role/programme switch). */
const searchIndex = computed(() => buildRouteSearchIndex(permissionStore.getRouters, t))
const results = computed(() => searchRoutes(searchIndex.value, query.value))
const showEmpty = computed(
  () => open.value && query.value.trim().length >= 2 && results.value.length === 0
)

watch(results, () => {
  activeIndex.value = 0
})

const closeResults = () => {
  open.value = false
}

const go = (item?: RouteSearchItem) => {
  const target = item ?? results.value[activeIndex.value]
  if (!target) return
  query.value = ''
  open.value = false
  inputRef.value?.blur()
  router.push(target.path)
}

const onArrow = (delta: number) => {
  if (!results.value.length) return
  open.value = true
  const next = activeIndex.value + delta
  activeIndex.value = (next + results.value.length) % results.value.length
}

const handleDocumentClick = (event: MouseEvent) => {
  if (!rootRef.value?.contains(event.target as Node)) closeResults()
}

/** Ctrl/Cmd+K focuses the box from anywhere in the app. */
const handleShortcut = (event: KeyboardEvent) => {
  if (event.key?.toLowerCase() !== 'k' || !(event.metaKey || event.ctrlKey)) return
  event.preventDefault()
  open.value = true
  nextTick(() => inputRef.value?.focus())
}

onMounted(() => {
  document.addEventListener('click', handleDocumentClick)
  document.addEventListener('keydown', handleShortcut)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleDocumentClick)
  document.removeEventListener('keydown', handleShortcut)
})
</script>

<template>
  <div ref="rootRef" class="route-search">
    <div class="route-search__field">
      <Icon icon="mdi:magnify" width="16" height="16" class="route-search__icon" />
      <input
        ref="inputRef"
        v-model="query"
        type="search"
        class="route-search__input"
        placeholder="Search pages…"
        autocomplete="off"
        role="combobox"
        aria-label="Search pages"
        aria-controls="route-search-results"
        :aria-expanded="open && results.length > 0"
        @focus="open = true"
        @input="open = true"
        @keydown.down.prevent="onArrow(1)"
        @keydown.up.prevent="onArrow(-1)"
        @keydown.enter.prevent="go()"
        @keydown.esc="closeResults"
      />
    </div>

    <ul
      v-if="open && results.length"
      id="route-search-results"
      class="route-search__results"
      role="listbox"
    >
      <li v-for="(item, index) in results" :key="item.path" role="option" :aria-selected="index === activeIndex">
        <button
          type="button"
          class="route-search__result"
          :class="{ 'is-active': index === activeIndex }"
          @mouseenter="activeIndex = index"
          @mousedown.prevent="go(item)"
        >
          <Icon :icon="item.icon || 'mdi:file-outline'" width="16" height="16" />
          <span class="route-search__result-text">
            <span class="route-search__result-title">{{ item.title }}</span>
            <span v-if="item.trail.length" class="route-search__result-trail">
              {{ item.trail.join(' / ') }}
            </span>
          </span>
          <span class="route-search__result-path">{{ item.path }}</span>
        </button>
      </li>
    </ul>

    <p v-else-if="showEmpty" class="route-search__empty" role="status">
      No pages match “{{ query }}”
    </p>
  </div>
</template>

<style lang="less" scoped>
.route-search {
  position: relative;
  margin-right: 8px;
}

.route-search__field {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0 8px;
  height: 30px;
  border: 1px solid var(--el-border-color);
  border-radius: 6px;
  background: var(--el-fill-color-blank);
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.route-search__field:focus-within {
  border-color: var(--el-color-primary);
  box-shadow: 0 0 0 2px var(--el-color-primary-light-8);
}

.route-search__icon {
  flex-shrink: 0;
  color: var(--el-text-color-placeholder);
}

.route-search__input {
  width: 180px;
  max-width: 30vw;
  border: 0;
  outline: none;
  background: transparent;
  font: inherit;
  font-size: 13px;
  color: var(--el-text-color-primary);
}

.route-search__input::placeholder {
  color: var(--el-text-color-placeholder);
}

.route-search__input::-webkit-search-cancel-button {
  cursor: pointer;
}

.route-search__results,
.route-search__empty {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  z-index: 3000;
  width: 340px;
  max-width: 80vw;
  margin: 0;
  padding: 4px;
  list-style: none;
  background: var(--el-bg-color-overlay);
  border: 1px solid var(--el-border-color-light);
  border-radius: 8px;
  box-shadow: var(--el-box-shadow-light);
}

.route-search__empty {
  padding: 10px 12px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.route-search__result {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 7px 8px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: var(--el-text-color-primary);
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.route-search__result.is-active {
  background: var(--el-color-primary-light-9);
}

.route-search__result-text {
  display: flex;
  flex-direction: column;
  min-width: 0;
  flex: 1;
}

.route-search__result-title {
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.route-search__result-trail {
  font-size: 11px;
  color: var(--el-text-color-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.route-search__result-path {
  flex-shrink: 0;
  max-width: 40%;
  font-size: 11px;
  color: var(--el-text-color-placeholder);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { Icon } from '@iconify/vue'
import { usePermissionStore } from '@/store/modules/permission'
import { useAppStore } from '@/store/modules/app'
import { useI18n } from '@/hooks/web/useI18n'
import { buildRouteSearchIndex, searchRoutes, type RouteSearchItem } from './routeSearchIndex'

const router = useRouter()
const permissionStore = usePermissionStore()
const appStore = useAppStore()
const { t } = useI18n()

const rootRef = ref<HTMLElement | null>(null)
const inputRef = ref<HTMLInputElement | null>(null)
const mobileInputRef = ref<HTMLInputElement | null>(null)
const query = ref('')
const open = ref(false)
const activeIndex = ref(0)

/** Under 768px the header has no room for a field — use a full-screen sheet instead. */
const isMobile = computed(() => appStore.getMobile)

/** Rebuilt whenever the user's routes change (login, role/programme switch). */
const searchIndex = computed(() => buildRouteSearchIndex(permissionStore.getRouters, t))
const results = computed(() => searchRoutes(searchIndex.value, query.value, isMobile.value ? 20 : 8))
const showEmpty = computed(
  () => open.value && query.value.trim().length >= 2 && results.value.length === 0
)

watch(results, () => {
  activeIndex.value = 0
})

const focusInput = () => {
  nextTick(() => (isMobile.value ? mobileInputRef.value : inputRef.value)?.focus())
}

const openSearch = () => {
  open.value = true
  focusInput()
}

const closeSearch = () => {
  open.value = false
  if (isMobile.value) query.value = ''
}

const go = (item?: RouteSearchItem) => {
  const target = item ?? results.value[activeIndex.value]
  if (!target) return
  query.value = ''
  open.value = false
  inputRef.value?.blur()
  mobileInputRef.value?.blur()
  router.push(target.path)
}

const onArrow = (delta: number) => {
  if (!results.value.length) return
  open.value = true
  const next = activeIndex.value + delta
  activeIndex.value = (next + results.value.length) % results.value.length
}

const handleDocumentClick = (event: MouseEvent) => {
  // The mobile sheet is modal and closes via its own control.
  if (isMobile.value) return
  if (!rootRef.value?.contains(event.target as Node)) open.value = false
}

/** Ctrl/Cmd+K opens the search from anywhere in the app. */
const handleShortcut = (event: KeyboardEvent) => {
  if (event.key?.toLowerCase() !== 'k' || !(event.metaKey || event.ctrlKey)) return
  event.preventDefault()
  openSearch()
}

// Keep the page behind the sheet from scrolling under the user's finger.
watch([open, isMobile], ([isOpen, mobile]) => {
  document.body.style.overflow = isOpen && mobile ? 'hidden' : ''
})

// Switching between layouts mid-search would strand the sheet or the dropdown.
watch(isMobile, () => {
  open.value = false
  query.value = ''
})

onMounted(() => {
  document.addEventListener('click', handleDocumentClick)
  document.addEventListener('keydown', handleShortcut)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleDocumentClick)
  document.removeEventListener('keydown', handleShortcut)
  document.body.style.overflow = ''
})
</script>

<template>
  <div ref="rootRef" class="route-search">
    <!-- Mobile: icon only; the sheet below does the work -->
    <button
      v-if="isMobile"
      type="button"
      class="route-search__trigger"
      aria-label="Search pages"
      title="Search pages"
      @click="openSearch"
    >
      <Icon icon="mdi:magnify" width="18" height="18" />
    </button>

    <div v-else class="route-search__field">
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
        @keydown.esc="closeSearch"
      />
    </div>

    <!-- Desktop dropdown -->
    <template v-if="!isMobile">
      <ul
        v-if="open && results.length"
        id="route-search-results"
        class="route-search__results"
        role="listbox"
      >
        <li
          v-for="(item, index) in results"
          :key="item.path"
          role="option"
          :aria-selected="index === activeIndex"
        >
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
    </template>

    <!-- Mobile sheet: teleported so header stacking/overflow can't clip it -->
    <Teleport to="body">
      <div v-if="isMobile && open" class="route-search-sheet" role="dialog" aria-label="Search pages">
        <div class="route-search-sheet__bar">
          <Icon icon="mdi:magnify" width="20" height="20" class="route-search__icon" />
          <input
            ref="mobileInputRef"
            v-model="query"
            type="search"
            class="route-search-sheet__input"
            placeholder="Search pages…"
            autocomplete="off"
            enterkeyhint="go"
            aria-label="Search pages"
            @keydown.enter.prevent="go()"
            @keydown.esc="closeSearch"
          />
          <button type="button" class="route-search-sheet__close" aria-label="Close search" @click="closeSearch">
            <Icon icon="mdi:close" width="20" height="20" />
          </button>
        </div>

        <ul v-if="results.length" class="route-search-sheet__results" role="listbox">
          <li v-for="item in results" :key="item.path" role="option" :aria-selected="false">
            <button type="button" class="route-search-sheet__result" @click="go(item)">
              <Icon :icon="item.icon || 'mdi:file-outline'" width="20" height="20" />
              <span class="route-search__result-text">
                <span class="route-search-sheet__title">{{ item.title }}</span>
                <span class="route-search__result-trail">
                  {{ item.trail.length ? item.trail.join(' / ') : item.path }}
                </span>
              </span>
            </button>
          </li>
        </ul>

        <p v-else-if="query.trim().length >= 2" class="route-search-sheet__hint" role="status">
          No pages match “{{ query }}”
        </p>
        <p v-else class="route-search-sheet__hint">
          Type to find any page you have access to.
        </p>
      </div>
    </Teleport>
  </div>
</template>

<style lang="less" scoped>
.route-search {
  position: relative;
  margin-right: 8px;
}

.route-search__trigger {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: var(--top-header-text-color);
  cursor: pointer;
}

.route-search__trigger:hover {
  background: var(--el-fill-color-light);
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

<style lang="less">
/* Sheet is teleported to <body>, so these rules can't be scoped to the component. */
.route-search-sheet {
  position: fixed;
  inset: 0;
  z-index: 3100;
  display: flex;
  flex-direction: column;
  background: var(--el-bg-color);
  padding-top: env(safe-area-inset-top, 0);
  padding-bottom: env(safe-area-inset-bottom, 0);
}

.route-search-sheet__bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-bottom: 1px solid var(--el-border-color-light);
}

.route-search-sheet__input {
  flex: 1;
  min-width: 0;
  height: 40px;
  border: 0;
  outline: none;
  background: transparent;
  font: inherit;
  font-size: 16px; /* keeps iOS from zooming on focus */
  color: var(--el-text-color-primary);
}

.route-search-sheet__close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  flex-shrink: 0;
  border: 0;
  border-radius: 8px;
  background: var(--el-fill-color-light);
  color: var(--el-text-color-primary);
  cursor: pointer;
}

.route-search-sheet__results {
  flex: 1;
  margin: 0;
  padding: 4px 0;
  list-style: none;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.route-search-sheet__result {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  min-height: 52px;
  padding: 8px 16px;
  border: 0;
  background: transparent;
  color: var(--el-text-color-primary);
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.route-search-sheet__result:active {
  background: var(--el-color-primary-light-9);
}

.route-search-sheet__title {
  font-size: 15px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.route-search-sheet__hint {
  margin: 0;
  padding: 20px 16px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}
</style>

<template>
  <section class="gok-hero" aria-labelledby="gok-hero-heading">
    <div class="gok-hero__photo" aria-hidden="true">
      <div class="gok-hero__slides">
        <img
          v-for="(src, i) in HERO_IMAGES"
          :key="src"
          :src="src"
          alt=""
          class="gok-hero__img"
          :class="{ 'is-active': i === activeSlide }"
          :width="1600"
          :height="900"
          :fetchpriority="i === 0 ? 'high' : 'low'"
          :loading="i === 0 ? 'eager' : 'lazy'"
          decoding="async"
        />
      </div>
      <div class="gok-hero__overlay"></div>
      <div class="gok-hero__dots" role="presentation">
        <span
          v-for="(_, i) in HERO_IMAGES"
          :key="i"
          class="gok-hero__dot"
          :class="{ 'is-active': i === activeSlide }"
        ></span>
      </div>
    </div>

    <div class="gok-container gok-hero__stage">
      <div class="gok-hero__panel">
        <div class="gok-hero__panel-main">
          <div class="gok-hero__intro">
            <p class="gok-hero__brand">
              <span class="gok-hero__brand-full">{{ INSTITUTION.fullName }}</span>
              <span class="gok-hero__brand-short">{{ INSTITUTION.systemName }}</span>
            </p>
            <h1 id="gok-hero-heading" class="gok-hero__title">{{ HERO.headline }}</h1>
          </div>

          <form class="gok-hero__search" role="search" @submit.prevent="runSearch">
            <Icon icon="mdi:magnify" width="22" height="22" class="gok-hero__search-icon" aria-hidden="true" />
            <label class="sr-only" for="gok-hero-search">{{ HERO.searchPlaceholder }}</label>
            <input
              id="gok-hero-search"
              v-model="query"
              type="search"
              :placeholder="HERO.searchPlaceholder"
              autocomplete="off"
            />

            <!-- Desktop: two explicit search targets -->
            <div class="gok-hero__search-actions gok-hero__search-actions--desktop">
              <button type="button" class="gok-btn gok-btn--search gok-btn--compact" @click="searchSettlements">
                Settlements
              </button>
              <button type="button" class="gok-btn gok-btn--search-ghost gok-btn--compact" @click="searchProjects">
                Projects
              </button>
            </div>

            <!-- Mobile: compact target toggle + one Search -->
            <div class="gok-hero__search-mobile">
              <div class="gok-hero__target" role="group" aria-label="Search in">
                <button
                  type="button"
                  class="gok-hero__target-btn"
                  :class="{ 'is-active': searchTarget === 'settlements' }"
                  @click="searchTarget = 'settlements'"
                >
                  Settlements
                </button>
                <button
                  type="button"
                  class="gok-hero__target-btn"
                  :class="{ 'is-active': searchTarget === 'projects' }"
                  @click="searchTarget = 'projects'"
                >
                  Projects
                </button>
              </div>
              <button type="submit" class="gok-btn gok-btn--search gok-btn--compact">
                Search
              </button>
            </div>
          </form>

          <nav class="gok-hero__quick" aria-label="Quick services">
            <button
              v-for="item in HERO_QUICK_LINKS"
              :key="item.id"
              type="button"
              class="gok-hero__quick-item"
              :class="{ 'gok-hero__quick-item--hide-mobile': item.hideOnMobile }"
              @click="emit('action', item.action)"
            >
              <span class="gok-hero__quick-icon" aria-hidden="true">
                <Icon :icon="item.icon" width="28" height="28" />
              </span>
              <span class="gok-hero__quick-label">{{ item.label }}</span>
            </button>
          </nav>
        </div>

        <!-- Bottom: get started + Sign in / Sign up -->
        <div class="gok-hero__panel-foot">
          <p class="gok-hero__get-started">{{ HERO.getStarted }}</p>
          <div class="gok-hero__actions">
            <button
              type="button"
              class="gok-btn gok-btn--ghost"
              @click="emit('action', HERO.primaryCta.action)"
            >
              {{ HERO.primaryCta.label }}
            </button>
            <button
              type="button"
              class="gok-btn gok-btn--register"
              @click="emit('action', HERO.secondaryCta.action)"
            >
              {{ HERO.secondaryCta.label }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { Icon } from '@iconify/vue'
import { HERO, HERO_IMAGES, HERO_QUICK_LINKS, INSTITUTION } from '../config/landing.config'

const emit = defineEmits<{
  (e: 'action', action: string): void
  (e: 'search', query: string, target: 'settlements' | 'projects'): void
}>()

const query = ref('')
const searchTarget = ref<'settlements' | 'projects'>('settlements')
const activeSlide = ref(0)
const SLIDE_MS = 6500
let timer: ReturnType<typeof setInterval> | null = null

function searchSettlements() {
  emit('search', query.value.trim(), 'settlements')
}

function searchProjects() {
  emit('search', query.value.trim(), 'projects')
}

function runSearch() {
  emit('search', query.value.trim(), searchTarget.value)
}

function nextSlide() {
  activeSlide.value = (activeSlide.value + 1) % HERO_IMAGES.length
}

onMounted(() => {
  const reduceMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (reduceMotion || HERO_IMAGES.length < 2) return

  HERO_IMAGES.slice(1).forEach((src) => {
    const img = new Image()
    img.src = src
  })

  timer = setInterval(nextSlide, SLIDE_MS)
})

onBeforeUnmount(() => {
  if (timer) clearInterval(timer)
})
</script>

<style scoped>
.gok-hero {
  position: relative;
  overflow: visible;
  padding-bottom: clamp(3.5rem, 10vh, 6.5rem);
  margin-bottom: 1.5rem;
  font-family: var(--gok-font, 'Montserrat', sans-serif);
}

.gok-hero__photo {
  position: relative;
  height: min(62vh, 560px);
  overflow: hidden;
  background: #0b2e1c;
}

.gok-hero__slides {
  position: absolute;
  inset: 0;
}

.gok-hero__img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  display: block;
  opacity: 0;
  transform: scale(1.04);
  transition:
    opacity 1.15s ease-in-out,
    transform 7.5s ease-out;
  will-change: opacity;
}

.gok-hero__img.is-active {
  opacity: 1;
  transform: scale(1);
  z-index: 1;
}

.gok-hero__overlay {
  position: absolute;
  inset: 0;
  z-index: 2;
  background:
    linear-gradient(
      105deg,
      rgba(62, 39, 18, 0.72) 0%,
      rgba(92, 58, 28, 0.55) 42%,
      rgba(0, 0, 0, 0.32) 100%
    );
}

.gok-hero__dots {
  position: absolute;
  right: 1.25rem;
  bottom: 1rem;
  z-index: 3;
  display: flex;
  gap: 0.4rem;
}

.gok-hero__dot {
  width: 7px;
  height: 7px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.45);
  transition: background 0.25s ease, width 0.25s ease;
}

.gok-hero__dot.is-active {
  width: 18px;
  background: #fff;
}

.gok-hero__stage {
  position: absolute;
  left: 50%;
  bottom: 0;
  z-index: 4;
  width: min(100% - 2rem, var(--gok-max, 1160px));
  transform: translate(-50%, 18%);
}

.gok-hero__intro {
  margin: 0 0 1.1rem;
  max-width: none;
  width: 100%;
  color: #fff;
}

.gok-hero__brand {
  margin: 0 0 0.45rem;
  font-size: clamp(1.15rem, 2.4vw, 1.55rem);
  font-weight: 800;
  letter-spacing: -0.02em;
  line-height: 1.2;
  color: #fff;
}

.gok-hero__brand-short {
  display: none;
}

.gok-hero__title {
  margin: 0;
  width: 100%;
  font-size: clamp(0.98rem, 1.55vw, 1.2rem);
  font-weight: 600;
  line-height: 1.4;
  letter-spacing: -0.01em;
  color: rgba(255, 255, 255, 0.95);
  text-wrap: balance;
}

.gok-hero__panel {
  width: 100%;
  border-radius: 16px;
  overflow: hidden;
  border: 1.5px solid rgba(255, 255, 255, 0.55);
  box-shadow: 0 14px 40px rgba(0, 0, 0, 0.28);
  backdrop-filter: blur(16px) saturate(1.1);
  -webkit-backdrop-filter: blur(16px) saturate(1.1);
  animation: gok-hero-in 0.55s ease-out both;
}

.gok-hero__panel-main {
  padding: 1.25rem 1.35rem 1.15rem;
  background: color-mix(in srgb, #1a2228 75%, transparent);
}

.gok-hero__search {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  background: var(--gok-panel, #fff);
  border: 1px solid color-mix(in srgb, var(--gok-border, #e3e8e5) 80%, transparent);
  border-radius: 999px;
  padding: 0.35rem 0.4rem 0.35rem 1rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.12);
}

.gok-hero__search-icon {
  flex-shrink: 0;
  color: var(--gok-muted, #8a968e);
}

.gok-hero__search input {
  flex: 1;
  min-width: 0;
  border: 0;
  background: transparent;
  color: var(--gok-charcoal, #212121);
  padding: 0.55rem 0.25rem;
  font: inherit;
  font-size: 0.95rem;
  font-weight: 500;
}

.gok-hero__search input::placeholder {
  color: var(--gok-muted, #8a968e);
  font-weight: 400;
}

.gok-hero__search input:focus {
  outline: none;
}

.gok-hero__search-actions {
  display: flex;
  flex-shrink: 0;
  gap: 0.35rem;
}

.gok-hero__search-mobile {
  display: none;
}

.gok-hero__target {
  display: flex;
  flex: 1;
  min-width: 0;
  padding: 3px;
  border-radius: 999px;
  background: var(--gok-grey, #eef2f0);
}

.gok-hero__target-btn {
  appearance: none;
  flex: 1;
  border: 0;
  border-radius: 999px;
  padding: 0.45rem 0.5rem;
  background: transparent;
  color: var(--gok-muted, #5c6b63);
  font: inherit;
  font-size: 0.78rem;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease, box-shadow 0.15s ease;
}

.gok-hero__target-btn.is-active {
  background: var(--gok-panel, #fff);
  color: var(--gok-green, #00843d);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.gok-hero__quick {
  display: grid;
  grid-template-columns: repeat(8, minmax(0, 1fr));
  gap: 0.35rem;
  margin-top: 1.15rem;
}

.gok-hero__quick-item {
  appearance: none;
  border: 0;
  background: transparent;
  color: #fff;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.45rem;
  padding: 0.45rem 0.2rem;
  border-radius: 10px;
  transition: background 0.15s ease, transform 0.15s ease;
  font: inherit;
}

.gok-hero__quick-item:hover {
  background: rgba(255, 255, 255, 0.08);
  transform: translateY(-1px);
}

.gok-hero__quick-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.6rem;
  height: 2.6rem;
  color: #fff;
}

.gok-hero__quick-label {
  font-size: 0.72rem;
  font-weight: 600;
  line-height: 1.25;
  text-align: center;
  color: rgba(255, 255, 255, 0.92);
}

.gok-hero__panel-foot {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.85rem;
  padding: 0.95rem 1.35rem;
  background: color-mix(in srgb, var(--gok-green, #00843d) 92%, #003d1c);
}

.gok-hero__get-started {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 600;
  color: #fff;
}

.gok-hero__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.55rem;
  margin-left: auto;
}

.gok-btn {
  appearance: none;
  border: 1px solid transparent;
  border-radius: 999px;
  padding: 0.62rem 1.25rem;
  font-family: inherit;
  font-size: 0.9rem;
  font-weight: 700;
  cursor: pointer;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;
}

.gok-btn--compact {
  padding: 0.5rem 0.95rem;
  font-size: 0.82rem;
}

.gok-btn--search {
  background: var(--gok-green, #00843d);
  color: #fff;
}

.gok-btn--search:hover {
  background: var(--gok-green-dark, #006b32);
}

.gok-btn--search-ghost {
  background: transparent;
  color: var(--gok-green, #00843d);
  border-color: color-mix(in srgb, var(--gok-green, #00843d) 35%, transparent);
}

.gok-btn--search-ghost:hover {
  background: var(--gok-green-soft, #e8f5ee);
}

.gok-btn--ghost {
  background: #fff;
  color: #1a2228;
}

.gok-btn--ghost:hover {
  background: #f3f5f4;
}

.gok-btn--register {
  background: #16a34a;
  color: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.18);
}

.gok-btn--register:hover {
  background: #15803d;
}

@keyframes gok-hero-in {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  border: 0;
}

@media (max-width: 960px) {
  .gok-hero__quick {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .gok-hero {
    padding-bottom: 1.25rem;
    margin-bottom: 0.75rem;
  }

  .gok-hero__photo {
    height: min(42vh, 300px);
  }

  .gok-hero__stage {
    width: min(100% - 1.25rem, var(--gok-max, 1160px));
    transform: translate(-50%, 8%);
  }

  .gok-hero__brand-full {
    display: none;
  }

  .gok-hero__brand-short {
    display: inline;
  }

  .gok-hero__intro {
    margin-bottom: 0.75rem;
  }

  .gok-hero__title {
    font-size: clamp(0.92rem, 3.4vw, 1.05rem);
    white-space: normal;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .gok-hero__panel-main {
    padding: 0.85rem;
  }

  .gok-hero__search {
    flex-wrap: wrap;
    border-radius: 14px;
    padding: 0.55rem 0.65rem;
    gap: 0.5rem;
  }

  .gok-hero__search-icon {
    display: none;
  }

  .gok-hero__search input {
    width: 100%;
    flex: 1 1 100%;
    padding: 0.35rem 0.15rem;
  }

  .gok-hero__search-actions--desktop {
    display: none;
  }

  .gok-hero__search-mobile {
    display: flex;
    width: 100%;
    align-items: center;
    gap: 0.45rem;
  }

  .gok-hero__search-mobile .gok-btn {
    flex-shrink: 0;
  }

  /* Mobile: search + Sign in / Sign up only */
  .gok-hero__quick {
    display: none;
  }

  .gok-hero__panel-foot {
    padding: 0.75rem 0.85rem;
  }

  .gok-hero__get-started {
    display: none;
  }

  .gok-hero__actions {
    width: 100%;
    margin-left: 0;
  }

  .gok-hero__actions .gok-btn {
    flex: 1;
  }
}

@media (prefers-reduced-motion: reduce) {
  .gok-hero__panel {
    animation: none;
  }

  .gok-hero__img {
    transition: opacity 0.01ms;
    transform: none;
  }
}
</style>

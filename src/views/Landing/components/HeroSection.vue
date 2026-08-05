<template>
  <section class="gok-hero" aria-labelledby="gok-hero-heading">
    <div class="gok-hero__photo" aria-hidden="true">
      <img
        :src="INSTITUTION.heroImage"
        alt=""
        class="gok-hero__img"
        width="1600"
        height="900"
        fetchpriority="high"
      />
      <div class="gok-hero__overlay"></div>
    </div>

    <div class="gok-container gok-hero__stage">
      <div class="gok-hero__panel">
        <div class="gok-hero__panel-main">
          <p class="gok-hero__eyebrow">{{ INSTITUTION.government }}</p>
          <p class="gok-hero__brand">
            <span class="gok-hero__brand-full">{{ INSTITUTION.fullName }}</span>
            <span class="gok-hero__brand-short">{{ INSTITUTION.systemName }}</span>
          </p>
          <h1 id="gok-hero-heading" class="gok-hero__title">{{ HERO.headline }}</h1>
          <p class="gok-hero__support">{{ HERO.support }}</p>

          <div class="gok-hero__actions">
            <button
              type="button"
              class="gok-btn gok-btn--primary"
              @click="emit('action', HERO.primaryCta.action)"
            >
              <Icon icon="mdi:login" width="18" height="18" aria-hidden="true" />
              {{ HERO.primaryCta.label }}
            </button>
            <button
              type="button"
              class="gok-btn gok-btn--secondary gok-hero__cta-secondary"
              @click="emit('action', HERO.secondaryCta.action)"
            >
              <Icon icon="mdi:account-plus-outline" width="18" height="18" aria-hidden="true" />
              {{ HERO.secondaryCta.label }}
            </button>
            <button
              type="button"
              class="gok-btn gok-btn--secondary gok-hero__cta-tertiary"
              @click="emit('action', HERO.tertiaryCta.action)"
            >
              <Icon icon="mdi:message-alert-outline" width="18" height="18" aria-hidden="true" />
              {{ HERO.tertiaryCta.label }}
            </button>
          </div>
        </div>

        <div class="gok-hero__panel-foot">
          <form class="gok-hero__search" role="search" @submit.prevent="searchSettlements">
            <label class="sr-only" for="gok-hero-search">{{ HERO.searchPlaceholder }}</label>
            <input
              id="gok-hero-search"
              v-model="query"
              type="search"
              :placeholder="HERO.searchPlaceholder"
              autocomplete="off"
            />
            <div class="gok-hero__search-actions">
              <button
                type="button"
                class="gok-btn gok-btn--primary gok-btn--compact"
                @click="searchSettlements"
              >
                Settlements
              </button>
              <button
                type="button"
                class="gok-btn gok-btn--secondary gok-btn--compact"
                @click="searchProjects"
              >
                Projects
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Icon } from '@iconify/vue'
import { HERO, INSTITUTION } from '../config/landing.config'

const emit = defineEmits<{
  (e: 'action', action: string): void
  (e: 'search', query: string, target: 'settlements' | 'projects'): void
}>()

const query = ref('')

function searchSettlements() {
  emit('search', query.value.trim(), 'settlements')
}

function searchProjects() {
  emit('search', query.value.trim(), 'projects')
}
</script>

<style scoped>
.gok-hero {
  position: relative;
  overflow: visible;
  /* Room for the small panel foot that hangs below the photo */
  padding-bottom: clamp(3.5rem, 10vh, 6.5rem);
  margin-bottom: 1.5rem;
  font-family: var(--gok-font, 'Montserrat', sans-serif);
}

.gok-hero__photo {
  position: relative;
  height: min(52vh, 460px);
  overflow: hidden;
}

.gok-hero__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  display: block;
}

.gok-hero__overlay {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(
      105deg,
      rgba(0, 107, 50, 0.72) 0%,
      rgba(0, 132, 61, 0.55) 42%,
      rgba(0, 0, 0, 0.28) 100%
    );
}

/* Anchor to photo bottom; only ~18% of the panel hangs below */
.gok-hero__stage {
  position: absolute;
  left: 50%;
  bottom: 0;
  z-index: 2;
  width: min(100% - 2rem, var(--gok-max, 1160px));
  transform: translate(-50%, 18%);
}

.gok-hero__panel {
  width: min(100%, 85%);
  max-width: 56rem;
  min-width: min(100%, 22rem);
  border-radius: 14px;
  overflow: hidden;
  box-shadow: var(--gok-shadow, 0 10px 36px rgba(0, 0, 0, 0.16));
  color: var(--gok-charcoal, #212121);
  animation: gok-hero-in 0.55s ease-out both;
  transition: box-shadow 0.2s ease, color 0.2s ease;
}

.gok-hero__panel-main {
  padding: 1.75rem 1.75rem 1.35rem;
  background: var(--gok-panel, #ffffff);
  transition: background-color 0.2s ease;
}

/* Lower band hangs below the photo — same panel, softer treatment */
.gok-hero__panel-foot {
  padding: 1rem 1.75rem 1.2rem;
  background: linear-gradient(
    180deg,
    var(--gok-panel-foot, #f4f8f5) 0%,
    var(--gok-panel-foot-end, #eef4f0) 100%
  );
  border-top: 1px solid color-mix(in srgb, var(--gok-green, #00843d) 18%, transparent);
  transition: background 0.2s ease, border-color 0.2s ease;
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

.gok-hero__eyebrow {
  margin: 0 0 0.35rem;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--gok-green, #00843d);
}

.gok-hero__brand {
  margin: 0 0 0.85rem;
  font-size: clamp(1.2rem, 2.6vw, 1.75rem);
  font-weight: 800;
  letter-spacing: -0.02em;
  color: var(--gok-charcoal, #212121);
  line-height: 1.2;
}

.gok-hero__brand-short {
  display: none;
}

.gok-hero__title {
  margin: 0 0 0.75rem;
  font-size: clamp(1.15rem, 2.4vw, 1.45rem);
  font-weight: 600;
  line-height: 1.35;
  letter-spacing: -0.01em;
  color: var(--gok-charcoal, #243029);
}

.gok-hero__support {
  margin: 0 0 1.35rem;
  font-size: 0.95rem;
  font-weight: 400;
  line-height: 1.55;
  color: var(--gok-muted, #5c6b63);
}

.gok-hero__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.65rem;
}

.gok-btn {
  appearance: none;
  border: 1px solid transparent;
  border-radius: 8px;
  padding: 0.72rem 1.2rem;
  font-family: inherit;
  font-size: 0.9rem;
  font-weight: 700;
  cursor: pointer;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;
}

.gok-btn--primary {
  background: var(--gok-green, #00843d);
  color: #fff;
  box-shadow: 0 2px 8px rgba(0, 132, 61, 0.28);
}

.gok-btn--primary:hover {
  background: var(--gok-green-dark, #006b32);
}

.gok-btn--secondary {
  background: var(--gok-panel, #fff);
  color: var(--gok-green, #00843d);
  border-color: color-mix(in srgb, var(--gok-green, #00843d) 35%, transparent);
}

.gok-btn--secondary:hover {
  background: var(--gok-green-soft, #e8f5ee);
  border-color: var(--gok-green, #00843d);
}

.gok-btn--compact {
  padding: 0.55rem 1rem;
  font-size: 0.85rem;
}

.gok-hero__search {
  display: flex;
  gap: 0.45rem;
  align-items: stretch;
  background: var(--gok-white, #fff);
  border: 1px solid color-mix(in srgb, var(--gok-green, #00843d) 16%, var(--gok-border, #e3e8e5));
  border-radius: 8px;
  padding: 0.3rem;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
  transition: background-color 0.2s ease, border-color 0.2s ease;
}

.gok-hero__search-actions {
  display: flex;
  flex-shrink: 0;
  flex-wrap: wrap;
  gap: 0.35rem;
  justify-content: flex-end;
}

.gok-hero__search input {
  flex: 1;
  min-width: 0;
  border: 0;
  background: transparent;
  color: var(--gok-charcoal, #212121);
  padding: 0.5rem 0.7rem;
  font: inherit;
  font-size: 0.9rem;
  font-weight: 500;
}

.gok-hero__search input::placeholder {
  color: var(--gok-muted, #8a968e);
  font-weight: 400;
}

.gok-hero__search input:focus {
  outline: none;
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

/* Mobile: lean hero — brand, headline, one CTA */
@media (max-width: 640px) {
  .gok-hero {
    padding-bottom: 1.25rem;
    margin-bottom: 0.75rem;
  }

  .gok-hero__photo {
    height: min(38vh, 280px);
  }

  .gok-hero__stage {
    width: min(100% - 1.25rem, var(--gok-max, 1160px));
    transform: translate(-50%, 12%);
  }

  .gok-hero__panel {
    width: 100%;
    max-width: none;
    min-width: 0;
    border-radius: 12px;
  }

  .gok-hero__panel-main {
    padding: 1.15rem 1.1rem 1.15rem;
  }

  .gok-hero__eyebrow,
  .gok-hero__support,
  .gok-hero__panel-foot {
    display: none;
  }

  .gok-hero__brand-full {
    display: none;
  }

  .gok-hero__brand-short {
    display: inline;
  }

  .gok-hero__brand {
    margin-bottom: 0.55rem;
    font-size: 1.35rem;
  }

  .gok-hero__title {
    margin-bottom: 1rem;
    font-size: 1.05rem;
    line-height: 1.4;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .gok-hero__actions .gok-btn {
    width: 100%;
  }
}

@media (prefers-reduced-motion: reduce) {
  .gok-hero__panel {
    animation: none;
  }
}
</style>

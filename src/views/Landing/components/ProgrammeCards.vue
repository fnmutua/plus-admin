<template>
  <section id="interventions" class="gok-section gok-programmes" aria-labelledby="gok-programmes-title">
    <div class="gok-container">
      <p class="gok-eyebrow">Interventions</p>
      <h2 id="gok-programmes-title" class="gok-section-title">Projects and interventions</h2>
      <p class="gok-section-lead gok-programmes__lead">
        Two main programmes under the State Department for Housing and Urban Development.
      </p>

      <ul class="gok-programmes__grid">
        <li v-for="item in PROGRAMMES" :key="item.id">
          <article class="gok-programme-card gok-programme-card--featured">
            <div class="gok-programme-card__top">
              <span class="gok-programme-card__icon" aria-hidden="true">
                <Icon :icon="item.icon" width="28" height="28" />
              </span>
              <span class="gok-programme-card__cat">{{ item.category }}</span>
            </div>
            <h3>{{ item.title }}</h3>
            <p class="gok-programme-card__full">{{ item.fullTitle }}</p>
            <p>{{ item.description }}</p>
            <button
              type="button"
              class="gok-programme-card__link"
              @click="emit('select', item)"
            >
              {{ item.ctaLabel }}
            </button>
          </article>
        </li>
      </ul>

      <div class="gok-programme-explorer">
        <div class="gok-programme-explorer__copy">
          <span class="gok-programme-explorer__icon" aria-hidden="true">
            <Icon :icon="PROJECT_EXPLORER_CTA.icon" width="22" height="22" />
          </span>
          <div>
            <h3>{{ PROJECT_EXPLORER_CTA.title }}</h3>
            <p>{{ PROJECT_EXPLORER_CTA.description }}</p>
          </div>
        </div>
        <button
          type="button"
          class="gok-programme-explorer__btn"
          @click="emit('select', PROJECT_EXPLORER_CTA)"
        >
          {{ PROJECT_EXPLORER_CTA.ctaLabel }}
        </button>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { PROGRAMMES, PROJECT_EXPLORER_CTA } from '../config/landing.config'

export type ProgrammeSelectItem =
  | (typeof PROGRAMMES)[number]
  | typeof PROJECT_EXPLORER_CTA

const emit = defineEmits<{ (e: 'select', item: ProgrammeSelectItem): void }>()
</script>

<style scoped>
.gok-programmes {
  background: var(--gok-white);
}

.gok-programmes__lead {
  max-width: none;
  white-space: nowrap;
}

.gok-programmes__grid {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1.15rem;
}

.gok-programme-card {
  height: 100%;
  border: 1px solid var(--gok-border);
  border-radius: var(--gok-radius);
  padding: 1.35rem 1.45rem;
  background: var(--gok-grey);
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
}

.gok-programme-card--featured {
  min-height: 16rem;
}

.gok-programme-card__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.gok-programme-card__icon {
  width: 2.75rem;
  height: 2.75rem;
  border-radius: 999px;
  background: var(--gok-white);
  border: 1px solid var(--gok-border);
  color: var(--gok-charcoal);
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.gok-programme-card__cat {
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--gok-muted);
}

.gok-programme-card h3 {
  margin: 0;
  font-size: 1.45rem;
  letter-spacing: 0.02em;
}

.gok-programme-card__full {
  margin: 0;
  font-size: 0.92rem;
  font-weight: 650;
  color: var(--gok-charcoal);
  line-height: 1.35;
  white-space: nowrap;
}

.gok-programme-card p {
  margin: 0;
  color: var(--gok-muted);
  line-height: 1.5;
  flex: 1;
}

.gok-programme-card__link {
  align-self: flex-start;
  appearance: none;
  border: 0;
  background: transparent;
  color: var(--gok-green);
  font: inherit;
  font-weight: 700;
  padding: 0;
  cursor: pointer;
  text-decoration: underline;
  text-underline-offset: 3px;
}

.gok-programme-explorer {
  margin-top: 1.15rem;
  padding: 1.1rem 1.25rem;
  border: 1px solid var(--gok-border);
  border-radius: var(--gok-radius);
  background: var(--gok-grey);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.25rem;
  flex-wrap: wrap;
}

.gok-programme-explorer__copy {
  display: flex;
  align-items: flex-start;
  gap: 0.85rem;
  min-width: min(100%, 22rem);
  flex: 1;
}

.gok-programme-explorer__icon {
  width: 2.35rem;
  height: 2.35rem;
  border-radius: 999px;
  background: var(--gok-white);
  border: 1px solid var(--gok-border);
  color: var(--gok-charcoal);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.gok-programme-explorer h3 {
  margin: 0 0 0.25rem;
  font-size: 1.05rem;
}

.gok-programme-explorer p {
  margin: 0;
  color: var(--gok-muted);
  line-height: 1.45;
  font-size: 0.92rem;
}

.gok-programme-explorer__btn {
  appearance: none;
  border: 1px solid var(--gok-green, #00843d);
  background: var(--gok-green, #00843d);
  color: #fff;
  border-radius: var(--gok-radius);
  padding: 0.65rem 1.1rem;
  font: inherit;
  font-weight: 650;
  cursor: pointer;
  white-space: nowrap;
}

.gok-programme-explorer__btn:hover {
  background: var(--gok-green-dark, #006b32);
  border-color: var(--gok-green-dark, #006b32);
}

.gok-programme-explorer__btn:focus-visible {
  outline: 3px solid var(--gok-green, #00843d);
  outline-offset: 2px;
}

@media (max-width: 720px) {
  .gok-programmes__lead {
    white-space: normal;
  }

  .gok-programme-card__full {
    white-space: normal;
  }

  .gok-programmes__grid {
    grid-template-columns: 1fr;
  }

  .gok-programme-explorer {
    align-items: stretch;
  }

  .gok-programme-explorer__btn {
    width: 100%;
  }
}
</style>

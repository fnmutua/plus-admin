<template>
  <section id="interventions" class="gok-section gok-programmes" aria-labelledby="gok-programmes-title">
    <div class="gok-container">
      <p class="gok-eyebrow">Interventions</p>
      <h2 id="gok-programmes-title" class="gok-section-title">Projects and interventions</h2>
      <p class="gok-section-lead">
        Key intervention areas. Open the project explorer for live project locations on the map.
      </p>

      <ul class="gok-programmes__grid">
        <li v-for="item in PROGRAMMES" :key="item.id">
          <article class="gok-programme-card">
            <div class="gok-programme-card__top">
              <span class="gok-programme-card__icon" aria-hidden="true">
                <Icon :icon="item.icon" width="24" height="24" />
              </span>
              <span class="gok-programme-card__cat">{{ item.category }}</span>
            </div>
            <h3>{{ item.title }}</h3>
            <p>{{ item.description }}</p>
            <button
              v-if="item.to || item.section || item.portalPath"
              type="button"
              class="gok-programme-card__link"
              @click="emit('select', item)"
            >
              {{ item.portalPath ? 'Open explorer' : 'Learn more' }}
            </button>
          </article>
        </li>
      </ul>
    </div>
  </section>
</template>

<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { PROGRAMMES } from '../config/landing.config'

const emit = defineEmits<{ (e: 'select', item: (typeof PROGRAMMES)[number]): void }>()
</script>

<style scoped>
.gok-programmes {
  background: var(--gok-white);
}

.gok-programmes__grid {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
}

.gok-programme-card {
  height: 100%;
  border: 1px solid var(--gok-border);
  border-radius: var(--gok-radius);
  padding: 1.25rem 1.35rem;
  background: var(--gok-grey);
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
}

.gok-programme-card__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.gok-programme-card__icon {
  width: 2.4rem;
  height: 2.4rem;
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
  font-size: 1.15rem;
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

@media (max-width: 720px) {
  .gok-programmes__grid {
    grid-template-columns: 1fr;
  }
}
</style>

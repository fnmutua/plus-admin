<template>
  <section id="stats" class="gok-section gok-stats" aria-labelledby="gok-stats-title">
    <div class="gok-container">
      <p class="gok-eyebrow">National overview</p>
      <h2 id="gok-stats-title" class="gok-section-title">Programme figures at a glance</h2>
      <p class="gok-section-lead">
        Key platform indicators drawn from live KeSMIS data where available.
      </p>

      <dl class="gok-stats__grid">
        <div v-for="item in items" :key="item.key" class="gok-stat">
          <dt>{{ item.label }}</dt>
          <dd>
            <span class="gok-stat__value">{{ item.display }}</span>
            <span v-if="item.placeholder" class="gok-stat__note">Pending data source</span>
          </dd>
        </div>
      </dl>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { STATS_CONFIG } from '../config/landing.config'

const props = defineProps<{
  settlements: string
  population: string
  projects: string
  counties?: string
  loading?: boolean
}>()

const items = computed(() => [
  {
    key: 'settlements',
    label: 'Settlements mapped',
    display: props.loading ? '…' : props.settlements || '0',
    placeholder: false,
  },
  {
    key: 'population',
    label: 'Estimated population',
    display: props.loading ? '…' : props.population || '0',
    placeholder: false,
  },
  {
    key: 'projects',
    label: 'Active projects',
    display: props.loading ? '…' : props.projects || '0',
    placeholder: false,
  },
  {
    key: 'counties',
    label: STATS_CONFIG.countiesCovered.label,
    display: props.loading ? '…' : props.counties || '0',
    placeholder: false,
  },
])
</script>

<style scoped>
.gok-stats {
  background: var(--gok-white);
  color: var(--gok-charcoal);
  border-block: 1px solid var(--gok-border);
}

.gok-stats__grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 1rem;
  margin: 0;
}

.gok-stat {
  background: var(--gok-grey);
  border: 1px solid var(--gok-border);
  border-radius: var(--gok-radius);
  padding: 1.15rem 1.2rem;
}

.gok-stat dt {
  font-size: 0.88rem;
  color: var(--gok-muted);
  margin-bottom: 0.45rem;
}

.gok-stat dd {
  margin: 0;
}

.gok-stat__value {
  display: block;
  font-size: clamp(1.75rem, 3vw, 2.35rem);
  font-weight: 800;
  letter-spacing: -0.02em;
  line-height: 1.1;
  color: var(--gok-charcoal);
}

.gok-stat__note {
  display: block;
  margin-top: 0.35rem;
  font-size: 0.72rem;
  color: var(--gok-muted);
}

@media (max-width: 900px) {
  .gok-stats__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 480px) {
  .gok-stats__grid {
    grid-template-columns: 1fr;
  }
}
</style>

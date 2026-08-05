<template>
  <section id="services" class="gok-section gok-services" aria-labelledby="gok-services-title">
    <div class="gok-container">
      <p class="gok-eyebrow">Digital services</p>
      <h2 id="gok-services-title" class="gok-section-title">Key service actions</h2>
      <p class="gok-section-lead">
        Quick access to the main public services available on KeSMIS.
      </p>

      <ul class="gok-services__grid">
        <li v-for="card in SERVICE_CARDS" :key="card.id">
          <button
            type="button"
            class="gok-service-card"
            :aria-label="card.title"
            @click="emit('select', card)"
          >
            <span class="gok-service-card__icon" aria-hidden="true">
              <Icon :icon="card.icon" width="26" height="26" />
            </span>
            <span class="gok-service-card__title">{{ card.title }}</span>
            <span class="gok-service-card__desc">{{ card.description }}</span>
            <span v-if="card.pendingRoute" class="gok-service-card__pending">Route pending</span>
          </button>
        </li>
      </ul>
    </div>
  </section>
</template>

<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { SERVICE_CARDS, type ServiceCard } from '../config/landing.config'

const emit = defineEmits<{ (e: 'select', card: ServiceCard): void }>()
</script>

<style scoped>
.gok-services {
  background: var(--gok-white);
  border-bottom: 1px solid var(--gok-border);
}

.gok-services__grid {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1rem;
}

.gok-service-card {
  width: 100%;
  height: 100%;
  text-align: left;
  background: var(--gok-grey);
  border: 1px solid var(--gok-border);
  border-radius: var(--gok-radius);
  padding: 1.15rem 1.2rem 1.25rem;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  transition: border-color 0.15s ease, box-shadow 0.15s ease, transform 0.15s ease;
  color: inherit;
  font: inherit;
}

.gok-service-card:hover,
.gok-service-card:focus-visible {
  border-color: var(--gok-green);
  box-shadow: var(--gok-shadow);
  transform: translateY(-1px);
}

.gok-service-card__icon {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 999px;
  background: var(--gok-white);
  border: 1px solid var(--gok-border);
  color: var(--gok-charcoal);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 0.25rem;
}

.gok-service-card__title {
  font-weight: 700;
  font-size: 1.05rem;
  color: var(--gok-charcoal);
}

.gok-service-card__desc {
  color: var(--gok-muted);
  font-size: 0.95rem;
  line-height: 1.45;
}

.gok-service-card__pending {
  margin-top: auto;
  font-size: 0.75rem;
  color: var(--gok-red);
  font-weight: 600;
}

@media (max-width: 900px) {
  .gok-services__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 560px) {
  .gok-services__grid {
    grid-template-columns: 1fr;
  }
}
</style>

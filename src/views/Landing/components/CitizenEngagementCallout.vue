<template>
  <section id="grievances" class="gok-section gok-engage" aria-labelledby="gok-engage-title">
    <div class="gok-container">
      <div class="gok-engage__panel">
        <div class="gok-engage__accent" aria-hidden="true"></div>
        <div class="gok-engage__copy">
          <p class="gok-eyebrow">Public participation</p>
          <h2 id="gok-engage-title" class="gok-section-title">{{ ENGAGEMENT.title }}</h2>
          <p class="gok-section-lead">{{ ENGAGEMENT.body }}</p>
          <div class="gok-engage__actions">
            <button
              v-for="action in ENGAGEMENT.actions"
              :key="action.label"
              type="button"
              class="gok-engage__btn"
              :class="{ 'gok-engage__btn--primary': action.primary }"
              @click="emit('action', action.to)"
            >
              {{ action.label }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ENGAGEMENT } from '../config/landing.config'

const emit = defineEmits<{ (e: 'action', to: string): void }>()
</script>

<style scoped>
.gok-engage {
  background: var(--gok-grey);
}

.gok-engage__panel {
  position: relative;
  background: var(--gok-white);
  border: 1px solid var(--gok-border);
  border-radius: var(--gok-radius);
  overflow: hidden;
  box-shadow: var(--gok-shadow);
}

.gok-engage__accent {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 5px;
  background: var(--gok-red);
}

.gok-engage__copy {
  padding: 1.75rem 1.75rem 1.75rem 1.9rem;
}

.gok-engage__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.65rem;
}

.gok-engage__btn {
  appearance: none;
  border: 1px solid var(--gok-border);
  background: var(--gok-white);
  color: var(--gok-charcoal);
  border-radius: var(--gok-radius);
  padding: 0.6rem 1rem;
  font: inherit;
  font-weight: 650;
  cursor: pointer;
}

.gok-engage__btn--primary {
  background: var(--gok-green);
  border-color: var(--gok-green);
  color: #fff;
}

.gok-engage__btn--primary:hover {
  background: var(--gok-green-dark);
}

.gok-engage__btn:not(.gok-engage__btn--primary):hover {
  border-color: var(--gok-green);
  color: var(--gok-green);
}
</style>

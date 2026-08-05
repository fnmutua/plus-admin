<template>
  <section id="publications" class="gok-section gok-pubs" aria-labelledby="gok-pubs-title">
    <div class="gok-container">
      <p class="gok-eyebrow">Publications and resources</p>
      <h2 id="gok-pubs-title" class="gok-section-title">Official resources</h2>
      <p class="gok-section-lead">
        Guidelines, policies and data services. Additional document repository items require portal access.
      </p>

      <ul class="gok-pubs__list">
        <li v-for="item in PUBLICATIONS" :key="item.id">
          <article class="gok-pub">
            <div class="gok-pub__meta">
              <span class="gok-pub__cat">{{ item.category }}</span>
              <span class="gok-pub__type">{{ item.fileType }}</span>
              <time :datetime="item.date">{{ formatDate(item.date) }}</time>
            </div>
            <h3 class="gok-pub__title">{{ item.title }}</h3>
            <button type="button" class="gok-pub__action" @click="emit('select', item)">
              View
            </button>
          </article>
        </li>
      </ul>
    </div>
  </section>
</template>

<script setup lang="ts">
import { PUBLICATIONS } from '../config/landing.config'

const emit = defineEmits<{ (e: 'select', item: (typeof PUBLICATIONS)[number]): void }>()

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return iso
  }
}
</script>

<style scoped>
.gok-pubs {
  background: var(--gok-grey);
}

.gok-pubs__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.gok-pub {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 0.5rem 1rem;
  align-items: center;
  background: var(--gok-white);
  border: 1px solid var(--gok-border);
  border-radius: var(--gok-radius);
  padding: 1rem 1.15rem;
}

.gok-pub__meta {
  grid-column: 1 / -1;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 0.85rem;
  font-size: 0.8rem;
  color: var(--gok-muted);
}

.gok-pub__cat {
  color: var(--gok-green);
  font-weight: 700;
}

.gok-pub__title {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 650;
}

.gok-pub__action {
  appearance: none;
  border: 1px solid var(--gok-green);
  background: transparent;
  color: var(--gok-green);
  border-radius: var(--gok-radius);
  padding: 0.45rem 0.85rem;
  font: inherit;
  font-weight: 650;
  cursor: pointer;
}

.gok-pub__action:hover {
  background: var(--gok-green);
  color: #fff;
}

@media (max-width: 560px) {
  .gok-pub {
    grid-template-columns: 1fr;
  }

  .gok-pub__action {
    justify-self: start;
  }
}
</style>

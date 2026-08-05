<template>
  <section id="news" class="gok-section gok-news" aria-labelledby="gok-news-title">
    <div class="gok-container">
      <p class="gok-eyebrow">News and updates</p>
      <h2 id="gok-news-title" class="gok-section-title">Latest updates</h2>
      <p class="gok-section-lead">
        Official announcements and service updates.
        <!-- CONFIG: replace NEWS_UPDATES when a public articles API is available -->
      </p>

      <ul class="gok-news__grid">
        <li v-for="item in NEWS_UPDATES" :key="item.id">
          <article class="gok-news-card">
            <div v-if="item.image" class="gok-news-card__media">
              <img :src="item.image" :alt="''" loading="lazy" width="640" height="360" />
            </div>
            <div class="gok-news-card__body">
              <time :datetime="item.date">{{ formatDate(item.date) }}</time>
              <h3>{{ item.title }}</h3>
              <p>{{ item.summary }}</p>
              <button type="button" class="gok-news-card__link" @click="emit('select', item)">
                Read more
              </button>
            </div>
          </article>
        </li>
      </ul>
    </div>
  </section>
</template>

<script setup lang="ts">
import { NEWS_UPDATES } from '../config/landing.config'

const emit = defineEmits<{ (e: 'select', item: (typeof NEWS_UPDATES)[number]): void }>()

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
.gok-news {
  background: var(--gok-white);
}

.gok-news__grid {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1rem;
}

.gok-news-card {
  height: 100%;
  border: 1px solid var(--gok-border);
  border-radius: var(--gok-radius);
  overflow: hidden;
  background: var(--gok-grey);
  display: flex;
  flex-direction: column;
}

.gok-news-card__media {
  aspect-ratio: 16 / 9;
  background: #dce3df;
  overflow: hidden;
}

.gok-news-card__media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.gok-news-card__body {
  padding: 1rem 1.1rem 1.2rem;
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  flex: 1;
}

.gok-news-card__body time {
  font-size: 0.8rem;
  color: var(--gok-muted);
}

.gok-news-card__body h3 {
  margin: 0;
  font-size: 1.05rem;
  line-height: 1.35;
}

.gok-news-card__body p {
  margin: 0;
  color: var(--gok-muted);
  font-size: 0.95rem;
  line-height: 1.45;
  flex: 1;
}

.gok-news-card__link {
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

@media (max-width: 900px) {
  .gok-news__grid {
    grid-template-columns: 1fr;
  }
}
</style>

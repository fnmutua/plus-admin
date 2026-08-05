<template>
  <footer class="gok-footer" role="contentinfo">
    <div class="gok-container gok-footer__grid">
      <div class="gok-footer__brand">
        <img :src="INSTITUTION.logoSrcWhite" alt="KeSMIS" class="gok-footer__logo" width="200" height="50" loading="lazy" />
        <div>
          <p class="gok-footer__full">{{ INSTITUTION.systemName }}</p>
        </div>
      </div>

      <div>
        <h3>Contact</h3>
        <ul>
          <li>{{ INSTITUTION.address }}</li>
          <li>
            <a :href="`tel:${INSTITUTION.helplineTel}`">{{ INSTITUTION.helpline }}</a>
          </li>
          <li>
            <a :href="`mailto:${INSTITUTION.email}`">{{ INSTITUTION.email }}</a>
          </li>
        </ul>
      </div>

      <div>
        <h3>Useful links</h3>
        <ul>
          <li v-for="l in FOOTER.usefulLinks" :key="l.label">
            <router-link :to="l.to">{{ l.label }}</router-link>
          </li>
        </ul>
      </div>

      <div>
        <h3>Services</h3>
        <ul>
          <li v-for="l in FOOTER.services" :key="l.label">
            <button type="button" class="gok-footer__btn" @click="onServiceClick(l)">
              {{ l.label }}
            </button>
          </li>
        </ul>
      </div>

      <div>
        <h3>Policies</h3>
        <ul>
          <li v-for="l in FOOTER.policies" :key="l.label + l.to">
            <router-link :to="l.to">{{ l.label }}</router-link>
          </li>
        </ul>
      </div>
    </div>

    <div class="gok-footer__bottom">
      <div class="gok-container gok-footer__bottom-inner">
        <p>&copy; {{ year }} {{ INSTITUTION.systemName }}. {{ INSTITUTION.government }}.</p>
        <p class="gok-footer__attr">An official digital service of the {{ INSTITUTION.government }}.</p>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { INSTITUTION, FOOTER } from '../config/landing.config'

const router = useRouter()
const emit = defineEmits<{
  (e: 'section', id: string): void
  (e: 'portal', path: string): void
}>()
const year = new Date().getFullYear()

function onServiceClick(l: (typeof FOOTER.services)[number]) {
  if (l.portalPath) {
    emit('portal', l.portalPath)
    return
  }
  if (l.to) {
    router.push(l.to)
    return
  }
  if (l.section) emit('section', l.section)
}
</script>

<style scoped>
.gok-footer {
  /* Stay charcoal in light and dark — --gok-charcoal flips in dark mode */
  --footer-bg: #212121;
  --footer-bg-bottom: #1a1a1a;
  --footer-text: rgba(255, 255, 255, 0.92);
  --footer-muted: rgba(255, 255, 255, 0.78);
  --footer-link: rgba(255, 255, 255, 0.9);
  --footer-border: rgba(255, 255, 255, 0.15);

  background: var(--footer-bg);
  color: var(--footer-text);
  margin-top: auto;
}

.gok-footer__grid {
  display: grid;
  grid-template-columns: 1.4fr repeat(4, minmax(0, 1fr));
  gap: 1.75rem;
  padding: 2.75rem 0 2rem;
}

.gok-footer__brand {
  display: flex;
  gap: 0.85rem;
  align-items: flex-start;
}

.gok-footer__logo {
  width: auto;
  height: 44px;
  max-width: 180px;
  object-fit: contain;
  object-position: left center;
  flex-shrink: 0;
  background: transparent;
}

.gok-footer__name {
  margin: 0 0 0.25rem;
  font-size: 1.2rem;
  color: var(--footer-text);
}

.gok-footer__full,
.gok-footer__desc {
  margin: 0;
  font-size: 0.9rem;
  line-height: 1.45;
  color: var(--footer-muted);
}

.gok-footer h3 {
  margin: 0 0 0.75rem;
  font-size: 0.85rem;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #fff;
}

.gok-footer ul {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  font-size: 0.92rem;
  color: var(--footer-muted);
}

.gok-footer li {
  color: var(--footer-muted);
}

.gok-footer a,
.gok-footer :deep(a),
.gok-footer__btn {
  color: var(--footer-link) !important;
  text-decoration: none;
  background: none;
  border: 0;
  padding: 0;
  font: inherit;
  cursor: pointer;
  text-align: left;
}

.gok-footer a:hover,
.gok-footer :deep(a:hover),
.gok-footer__btn:hover {
  color: #fff !important;
  text-decoration: underline;
}

.gok-footer__bottom {
  background: var(--footer-bg-bottom);
  border-top: 1px solid var(--footer-border);
  padding: 1rem 0 1.25rem;
  font-size: 0.85rem;
  color: var(--footer-muted);
}

.gok-footer__bottom-inner {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 0.5rem 1rem;
}

.gok-footer__bottom p {
  margin: 0;
  color: var(--footer-muted);
}

.gok-footer__attr {
  opacity: 0.9;
}

@media (max-width: 960px) {
  .gok-footer__grid {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 560px) {
  .gok-footer__grid {
    grid-template-columns: 1fr;
  }
}
</style>

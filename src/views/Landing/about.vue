<template>
  <BaseLayout>
    <div class="about-container">
      <div class="about-content">
        <h1 class="about-title">About KeSMIS</h1>
        
        <div class="about-sections">
          <section class="about-section">
            <div class="section-card">
              <h2 class="section-title">
                <Icon icon="mdi:information-outline" class="section-icon" />
                Introduction
              </h2>
              <p class="section-text">
                The Kenya Slum Management Information System (KeSMIS) is the national geodatabase and information management system for slums and informal settlements across Kenya. Implemented under the Kenya Informal Settlements Improvement Project (KISIP), KeSMIS facilitates comprehensive data collection, grievance management, and project monitoring to support evidence-based decision-making in urban development.
              </p>
            </div>
          </section>
          
          <section class="about-section">
            <div class="section-card">
              <h2 class="section-title">
                <Icon icon="mdi:target" class="section-icon" />
                Our Mission
              </h2>
              <p class="section-text">
                KeSMIS aims to provide government agencies, development partners, and communities with reliable data and analytical tools necessary for effective slum management, urban planning, and evidence-based policy formulation. The system supports the transformation of informal settlements into sustainable and livable environments through comprehensive information management.
              </p>
            </div>
          </section>
          
          <section class="about-section">
            <div class="section-card">
              <h2 class="section-title">
                <Icon icon="mdi:office-building-outline" class="section-icon" />
                Project Background
              </h2>
              <p class="section-text">
                KeSMIS is a key component of the Kenya Informal Settlements Improvement Project (KISIP), a government initiative aimed at improving living conditions in informal settlements across Kenya. The system supports KISIP's objectives by providing a centralized platform for data collection, management, and analysis related to informal settlements, infrastructure, and community services.
              </p>
            </div>
          </section>

          <section class="about-section">
            <div class="section-card">
              <h2 class="section-title">
                <Icon icon="mdi:chart-box-outline" class="section-icon" />
                Key Features
              </h2>
              <ul class="features-list">
                <li>
                  <Icon icon="mdi:check-circle" class="list-icon" />
                  <span>National geodatabase for slums and informal settlements</span>
                </li>
                <li>
                  <Icon icon="mdi:check-circle" class="list-icon" />
                  <span>Electronic Grievance Redress Mechanism (e-GRM)</span>
                </li>
                <li>
                  <Icon icon="mdi:check-circle" class="list-icon" />
                  <span>Project monitoring and reporting capabilities</span>
                </li>
                <li>
                  <Icon icon="mdi:check-circle" class="list-icon" />
                  <span>Real-time data collection and synchronization</span>
                </li>
                <li>
                  <Icon icon="mdi:check-circle" class="list-icon" />
                  <span>Climate risk assessment</span>
                </li>
                <li>
                  <Icon icon="mdi:check-circle" class="list-icon" />
                  <span>Multi-level access control and user management</span>
                </li>
              </ul>
            </div>
          </section>
        </div>
      </div>
    </div>
  </BaseLayout>
</template>

<script setup lang="ts">
import BaseLayout from './BaseLayout.vue';
import { useHead } from '@unhead/vue';
import { Icon } from '@iconify/vue';

useHead({
  title: 'About KeSMIS | Kenya Slum Management Information System',
  meta: [
    { name: 'description', content: 'Learn about KeSMIS (Kenya Slum Management Information System) - the national geodatabase and information management system for slums and informal settlements across Kenya, implemented under KISIP.' },
    { name: 'keywords', content: 'about KeSMIS, Kenya slum management, KISIP project, urban development Kenya, slum improvement, informal settlements Kenya, data collection platform' },
    { name: 'author', content: 'Kenya Informal Settlements Improvement Project (KISIP)' },
    { name: 'robots', content: 'index, follow' },
    
    // Open Graph tags (for WhatsApp, Facebook, LinkedIn)
    { property: 'og:title', content: 'About KeSMIS - Kenya Slum Management Information System' },
    { property: 'og:description', content: 'Learn about KeSMIS - the national geodatabase and information management system for slums and informal settlements across Kenya.' },
    { property: 'og:type', content: 'website' },
    { property: 'og:url', content: 'https://kesmis.go.ke/about' },
    { property: 'og:image', content: 'https://kesmis.go.ke/logo.png' },
    { property: 'og:image:width', content: '1200' },
    { property: 'og:image:height', content: '630' },
    { property: 'og:image:alt', content: 'KeSMIS Logo - Kenya Slum Management Information System' },
    { property: 'og:site_name', content: 'KeSMIS' },
    { property: 'og:locale', content: 'en_KE' },
    
    // Twitter Card tags
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: 'About KeSMIS - Kenya Slum Management Information System' },
    { name: 'twitter:description', content: 'Learn about KeSMIS - the national geodatabase and information management system for slums and informal settlements across Kenya.' },
    { name: 'twitter:image', content: 'https://kesmis.go.ke/twitter-card.jpg' },
    { name: 'twitter:image:alt', content: 'KeSMIS Logo - Kenya Slum Management Information System' },
    
    // Additional meta tags for better SEO
    { name: 'theme-color', content: '#00DC82' },
    { name: 'msapplication-TileColor', content: '#00DC82' },
    { name: 'viewport', content: 'width=device-width, initial-scale=1.0' },
    { name: 'format-detection', content: 'telephone=no' }
  ]
})
</script>

<style scoped>
.about-container {
  min-height: 100vh;
  color: var(--text-primary);
  transition: all 0.3s ease;
  padding: 4rem 2rem;
}

.about-content {
  max-width: 1280px;
  margin: 0 auto;
}

.about-title {
  text-align: left;
  margin-bottom: 3rem;
  color: var(--text-primary);
  font-size: 2.5rem;
  font-weight: 800;
  letter-spacing: -0.02em;
  line-height: 1.2;
}

.about-sections {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.about-section {
  scroll-margin-top: 100px;
}

.section-card {
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  padding: 2.5rem;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.section-card:hover {
  box-shadow: 0 8px 24px rgba(0, 220, 130, 0.1);
  border-color: rgba(0, 220, 130, 0.3);
}

.section-title {
  display: flex;
  align-items: center;
  gap: 1rem;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid rgba(0, 220, 130, 0.2);
}

.section-icon {
  font-size: 1.75rem;
  color: #00DC82;
  flex-shrink: 0;
}

.section-text {
  color: var(--text-secondary);
  line-height: 1.8;
  font-size: 1rem;
  margin: 0;
}

.features-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.features-list li {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  color: var(--text-secondary);
  line-height: 1.7;
  font-size: 1rem;
}

.list-icon {
  font-size: 1.25rem;
  color: #00DC82;
  flex-shrink: 0;
  margin-top: 0.125rem;
}

@media (max-width: 768px) {
  .about-container {
    padding: 2rem 1rem;
  }

  .about-title {
    font-size: 2rem;
    margin-bottom: 2rem;
  }

  .section-card {
    padding: 2rem 1.5rem;
  }

  .section-title {
    font-size: 1.25rem;
    gap: 0.75rem;
  }

  .section-icon {
    font-size: 1.5rem;
  }

  .about-sections {
    gap: 1.5rem;
  }
}

@media (max-width: 480px) {
  .about-container {
    padding: 1.5rem 1rem;
  }
  
  .about-title {
    font-size: 1.75rem;
  }

  .section-card {
    padding: 1.5rem 1rem;
  }

  .section-title {
    font-size: 1.125rem;
    flex-wrap: wrap;
  }
}

/* Dark Mode Support */
.dark-mode .section-card {
  background: var(--bg-primary);
  border-color: var(--border-color);
}

.dark-mode .section-card:hover {
  border-color: rgba(0, 220, 130, 0.4);
  box-shadow: 0 8px 24px rgba(0, 220, 130, 0.15);
}
</style>

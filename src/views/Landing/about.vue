<template>
  <BaseLayout>
    <div class="hero" :class="{ 'dark-mode': isDarkMode }"> 
      <div class="about-content">
        <h1 class="title">About KeSMIS</h1>
        <div class="content-wrapper">
          <section>
            <h2 class="visually-hidden">Introduction</h2>
            <p class="intro-text">Kenya Slum Management Information System (KeSMIS) is an innovative platform aimed at improving the living conditions in slums across Kenya. Through comprehensive data collection, management, and analysis, KeSMIS provides critical insights that inform policy decisions and development strategies.</p>
          </section>
          
          <section>
            <h2 class="visually-hidden">Our Mission</h2>
            <p class="mission-text">Our mission is to empower communities and stakeholders by providing access to reliable information and tools necessary for effective slum management and urban planning.</p>
          </section>
          
          <section>
            <h2 class="visually-hidden">Project Background</h2>
            <p class="project-text">KeSMIS is part of the Kenya Informal Settlements Improvement Project (KISIP), which is committed to transforming informal settlements into sustainable and livable environments.</p>
          </section>
          
          <el-button type="primary" size="large" class="cta-button">
            Learn More
            <i class="el-icon-arrow-right"></i>
          </el-button>
        </div>
      </div>
    </div>
  </BaseLayout>
</template>

<script setup lang="ts">
import { ElButton } from 'element-plus';
import BaseLayout from './BaseLayout.vue';
import { ref, onMounted } from 'vue';

// SEO Meta Tags Setup
onMounted(() => {
  document.title = 'About KeSMIS - Kenya Slum Management Information System | KISIP';
  
  const metaTags = [
    { name: 'description', content: 'Learn about KeSMIS (Kenya Slum Management Information System) - an innovative platform improving living conditions in slums across Kenya through comprehensive data collection and analysis.' },
    { name: 'keywords', content: 'about KeSMIS, Kenya slum management, KISIP project, urban development Kenya, slum improvement, informal settlements Kenya, data collection platform' },
    { name: 'robots', content: 'index, follow' },
    { property: 'og:title', content: 'About KeSMIS - Kenya Slum Management Information System' },
    { property: 'og:description', content: 'Learn about KeSMIS - an innovative platform improving living conditions in slums across Kenya through comprehensive data collection and analysis.' },
    { property: 'og:type', content: 'website' },
    { property: 'og:url', content: 'https://kesmis.go.ke/about' }
  ];

  metaTags.forEach(tag => {
    const meta = document.createElement('meta');
    if (tag.name) meta.setAttribute('name', tag.name);
    if (tag.property) meta.setAttribute('property', tag.property);
    meta.setAttribute('content', tag.content);
    document.head.appendChild(meta);
  });

  const canonicalLink = document.createElement('link');
  canonicalLink.setAttribute('rel', 'canonical');
  canonicalLink.setAttribute('href', 'https://kesmis.go.ke/about');
  document.head.appendChild(canonicalLink);

  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "AboutPage",
    "name": "About KeSMIS",
    "description": "Learn about the Kenya Slum Management Information System and its mission to improve living conditions in slums across Kenya",
    "url": "https://kesmis.go.ke/about",
    "mainEntity": {
      "@type": "SoftwareApplication",
      "name": "KeSMIS",
      "description": "Kenya Slum Management Information System",
      "applicationCategory": "Data Collection Platform",
      "operatingSystem": "Web-based"
    }
  });
  document.head.appendChild(script);
});

const isDarkMode = ref(false);

// Function to check system dark mode preference
const checkDarkMode = () => {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const savedTheme = localStorage.getItem('theme');
  isDarkMode.value = savedTheme ? savedTheme === 'dark' : prefersDark;
};

// Watch for system theme changes
onMounted(() => {
  checkDarkMode();
  
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (!localStorage.getItem('theme')) {
      isDarkMode.value = e.matches;
    }
  });
});
</script>

<style scoped>
:root {
  --bg-primary: #ffffff;
  --bg-secondary: rgba(255, 255, 255, 0.95);
  --text-primary: #2c3e50;
  --text-secondary: #34495e;
  --border-color: #3498db;
  --shadow-color: rgba(0, 0, 0, 0.05);
  --gradient-start: #2c3e50;
  --gradient-end: #3498db;
  --button-gradient-start: #3498db;
  --button-gradient-end: #2980b9;
  --button-shadow: rgba(52, 152, 219, 0.3);
}

.dark-mode {
  --bg-primary: #1a1a1a;
  --bg-secondary: rgba(30, 30, 30, 0.95);
  --text-primary: #e0e0e0;
  --text-secondary: #b0b0b0;
  --border-color: #4a9eff;
  --shadow-color: rgba(0, 0, 0, 0.2);
  --gradient-start: #4a9eff;
  --gradient-end: #6eb5ff;
  --button-gradient-start: #4a9eff;
  --button-gradient-end: #6eb5ff;
  --button-shadow: rgba(74, 158, 255, 0.3);
}

.about-page {
  font-family: 'Helvetica Neue', Arial, sans-serif;
}

.about-content {
  padding: 80px 20px;
  text-align: center;
  max-width: 900px;
  margin: 0 auto;
}

.title {
  font-size: 3.5rem;
  margin-bottom: 2rem;
  font-weight: 800;
  background: linear-gradient(45deg, var(--gradient-start), var(--gradient-end));
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: fadeInDown 0.8s ease-out;
}

.content-wrapper {
  background: var(--bg-secondary);
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 4px 20px var(--shadow-color);
  animation: fadeIn 1s ease-out;
  transition: all 0.3s ease;
}

.intro-text, .mission-text, .project-text {
  font-size: 1.2rem;
  line-height: 1.8;
  margin-bottom: 1.5rem;
  color: var(--text-primary);
  transition: color 0.3s ease;
}

.mission-text {
  font-weight: 500;
  color: var(--text-secondary);
  border-left: 4px solid var(--border-color);
  padding-left: 1rem;
  margin: 2rem 0;
  transition: all 0.3s ease;
}

.cta-button {
  margin-top: 2rem;
  padding: 10px 24px;
  font-size: 1rem;
  border-radius: 25px;
  transition: all 0.3s ease;
  background: linear-gradient(45deg, var(--button-gradient-start), var(--button-gradient-end));
  border: none;
}

.cta-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px var(--button-shadow);
}

.hero {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  text-align: center;
  padding: 60px 20px;
  min-height: 80vh;
  overflow: hidden;
  background-color: var(--bg-primary);
  transition: background-color 0.3s ease;
}

.hero::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(45deg, transparent 49%, var(--text-secondary) 49% 51%, transparent 51%), 
              linear-gradient(-45deg, transparent 49%, var(--text-secondary) 49% 51%, transparent 51%);
  background-color: var(--bg-primary);
  background-image: url('@/assets/imgs/background.png');
  opacity: 0.15;
  z-index: -1;
  transition: all 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Accessibility */
.visually-hidden {
  position: absolute !important;
  width: 1px !important;
  height: 1px !important;
  padding: 0 !important;
  margin: -1px !important;
  overflow: hidden !important;
  clip: rect(0, 0, 0, 0) !important;
  white-space: nowrap !important;
  border: 0 !important;
}

@media (max-width: 768px) {
  .title {
    font-size: 2.5rem;
  }
  
  .content-wrapper {
    padding: 1.5rem;
  }
  
  .intro-text, .mission-text, .project-text {
    font-size: 1.1rem;
  }
}
</style>

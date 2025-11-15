<template>
  <BaseLayout>
    <div class="faqs-container">
          <div class="faqs-content">
            <h1 class="faqs-title">Frequently Asked Questions</h1>
            
            <el-collapse accordion>
              <el-collapse-item title="What is the Kenya Slum Information System?">
                <div class="faq-answer">
                  The Kenya Slum Information System (KSIS) is a comprehensive digital platform designed to collect, manage, and analyze data about informal settlements across Kenya. It helps in understanding and addressing the needs of slum communities through data-driven insights.
                </div>
              </el-collapse-item>

              <el-collapse-item title="What is SlumMapper and how does it work?">
                <div class="faq-answer">
                  SlumMapper is a mobile application that allows users to map and document informal settlements. It enables field workers and community members to collect data about infrastructure, services, and living conditions in slum areas. The app uses GPS technology to accurately map locations and can work offline in areas with limited connectivity.
                </div>
              </el-collapse-item>

              <el-collapse-item title="How can I access the SlumMapper app?">
                <div class="faq-answer">
                  The SlumMapper app is available for download on both Android and iOS devices. You can download it from the Google Play Store or Apple App Store. To use the app, you'll need to create an account and receive proper training on data collection procedures.
                </div>
              </el-collapse-item>

              <el-collapse-item title="What kind of data does the system collect?">
                <div class="faq-answer">
                  The system collects various types of data including:
                  <ul>
                    <li>Basic demographic information</li>
                    <li>Infrastructure and service availability</li>
                    <li>Housing conditions</li>
                    <li>Environmental factors</li>
                    <li>Community facilities</li>
                    <li>Access to basic services</li>
                  </ul>
                </div>
              </el-collapse-item>

              <el-collapse-item title="How is my data protected?">
                <div class="faq-answer">
                  We take data privacy and security very seriously. All personal information is encrypted and stored securely. We only collect necessary information and never share personal data with third parties without consent. Users have the right to request data deletion at any time.
                </div>
              </el-collapse-item>

              <el-collapse-item title="Can I use the system without internet connection?">
                <div class="faq-answer">
                  Yes, the SlumMapper app is designed to work offline. You can collect data without an internet connection, and the information will be synchronized once you're back online.
                </div>
              </el-collapse-item>

              <el-collapse-item title="How can I report issues or get support?">
                <div class="faq-answer">
                  For technical support or to report issues, you can:
                  <ul>
                    <li>Email us at <a href="mailto:kisip2info@housingandurban.go.ke">kisip2info@housingandurban.go.ke</a></li>
                    <li>Use the in-app feedback feature</li>
                    <li>Contact our support team through the website</li>
                  </ul>
                </div>
              </el-collapse-item>

              <el-collapse-item title="How can I contribute to the system?">
                <div class="faq-answer">
                  There are several ways to contribute:
                  <ul>
                    <li>Become a trained data collector</li>
                    <li>Report issues in your community</li>
                    <li>Participate in community mapping exercises</li>
                    <li>Provide feedback on system improvements</li>
                  </ul>
                </div>
              </el-collapse-item>
                    </el-collapse>
          </div>
        </div>
  </BaseLayout>
</template>

<script setup lang="ts">
import { ElCollapse, ElCollapseItem } from 'element-plus';
import BaseLayout from './BaseLayout.vue';
import { useHead } from '@unhead/vue'

useHead({
  title: 'FAQs | KeSMIS Kenya Slum Management Information System',
  meta: [
    { name: 'description', content: 'Frequently Asked Questions about KeSMIS (Kenya Slum Management Information System). Find answers about SlumMapper app, data collection, privacy, and technical support.' },
    { name: 'keywords', content: 'KeSMIS FAQ, SlumMapper questions, Kenya slum management help, KISIP support, data collection FAQ, technical support' },
    { name: 'author', content: 'Kenya Informal Settlements Improvement Project (KISIP)' },
    { name: 'robots', content: 'index, follow' },
    
    // Open Graph tags (for WhatsApp, Facebook, LinkedIn)
    { property: 'og:title', content: 'FAQs - KeSMIS Kenya Slum Management Information System' },
    { property: 'og:description', content: 'Frequently Asked Questions about KeSMIS. Find answers about SlumMapper app, data collection, privacy, and technical support.' },
    { property: 'og:type', content: 'website' },
    { property: 'og:url', content: 'https://kesmis.go.ke/faq' },
    { property: 'og:image', content: 'https://kesmis.go.ke/logo.png' },
    { property: 'og:image:width', content: '1200' },
    { property: 'og:image:height', content: '630' },
    { property: 'og:image:alt', content: 'KeSMIS Logo - Kenya Slum Management Information System' },
    { property: 'og:site_name', content: 'KeSMIS' },
    { property: 'og:locale', content: 'en_KE' },
    
    // Twitter Card tags
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: 'FAQs - KeSMIS Kenya Slum Management Information System' },
    { name: 'twitter:description', content: 'Frequently Asked Questions about KeSMIS. Find answers about SlumMapper app, data collection, privacy, and technical support.' },
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

<style>
.form-container {
  max-height: 768px;
  overflow-y: auto;
}

.faqs-container {
  min-height: 100vh;
  color: var(--text-primary);
  transition: all 0.3s ease;
  padding: 4rem 2rem;
}

.faqs-content {
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  padding: 3rem;
  margin: 0 auto;
  max-width: 1280px;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
}

.faqs-title {
  text-align: left;
  margin-bottom: 3rem;
  color: var(--text-primary);
  font-size: 2.5rem;
  font-weight: 800;
  letter-spacing: -0.02em;
  line-height: 1.2;
}

.faq-answer {
  color: var(--text-secondary);
  line-height: 1.7;
  font-size: 1rem;
  padding: 0.5rem 0;
}

.faq-answer ul {
  margin-top: 0.75rem;
  padding-left: 1.5rem;
}

.faq-answer li {
  margin-bottom: 0.75rem;
}

.faq-answer a {
  color: #00DC82;
  text-decoration: none;
  transition: color 0.3s ease;
}

.faq-answer a:hover {
  color: #00B86B;
  text-decoration: underline;
}

/* Element Plus Collapse Styling */
:deep(.el-collapse) {
  border: none;
}

:deep(.el-collapse-item) {
  margin-bottom: 1rem;
  border: 1px solid var(--border-color);
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s ease;
}

:deep(.el-collapse-item:hover) {
  border-color: #00DC82;
  box-shadow: 0 4px 12px rgba(0, 220, 130, 0.1);
}

:deep(.el-collapse-item__header) {
  padding: 1.25rem 1.5rem;
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary);
  background: var(--bg-primary);
  border-bottom: none;
  transition: all 0.3s ease;
}

:deep(.el-collapse-item__header:hover) {
  color: #00DC82;
  background: var(--bg-secondary);
}

:deep(.el-collapse-item__header.is-active) {
  color: #00DC82;
  border-bottom: 1px solid var(--border-color);
}

:deep(.el-collapse-item__wrap) {
  background: var(--bg-primary);
  border-top: none;
}

:deep(.el-collapse-item__content) {
  padding: 1.5rem;
  background: var(--bg-secondary);
  color: var(--text-secondary);
}

:deep(.el-collapse-item__arrow) {
  color: var(--text-primary);
  font-size: 1.25rem;
  transition: all 0.3s ease;
}

:deep(.el-collapse-item__header:hover .el-collapse-item__arrow) {
  color: #00DC82;
}

:deep(.el-collapse-item__header.is-active .el-collapse-item__arrow) {
  color: #00DC82;
}

@media (max-width: 768px) {
  .faqs-container {
    padding: 2rem 1rem;
  }
  
  .faqs-content {
    padding: 2rem 1.5rem;
  }
  
  .faqs-title {
    font-size: 2rem;
    margin-bottom: 2rem;
  }

  :deep(.el-collapse-item__header) {
    padding: 1rem 1.25rem;
    font-size: 1rem;
  }

  :deep(.el-collapse-item__content) {
    padding: 1.25rem;
  }
}

@media (max-width: 480px) {
  .faqs-container {
    padding: 1.5rem 1rem;
  }
  
  .faqs-content {
    padding: 1.5rem 1rem;
  }
  
  .faqs-title {
    font-size: 1.75rem;
  }
}

/* Dark Mode Support */
.dark-mode .faqs-content {
  background: var(--bg-primary);
  border-color: var(--border-color);
}

.dark-mode :deep(.el-collapse-item) {
  border-color: var(--border-color);
  background: var(--bg-primary);
}

.dark-mode :deep(.el-collapse-item:hover) {
  border-color: #00DC82;
  box-shadow: 0 4px 12px rgba(0, 220, 130, 0.15);
}

.dark-mode :deep(.el-collapse-item__header) {
  background: var(--bg-primary);
  color: var(--text-primary);
}

.dark-mode :deep(.el-collapse-item__header:hover) {
  background: var(--bg-secondary);
}

.dark-mode :deep(.el-collapse-item__content) {
  background: var(--bg-secondary);
  color: var(--text-secondary);
}
</style>
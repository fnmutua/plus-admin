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
  padding: 2rem;
}

.faqs-content {
  border-radius: 12px;
  box-shadow: var(--card-shadow);
  padding: 2rem;
  margin: 0 auto;
  max-width: 1200px;
}

.faqs-title {
  text-align: center;
  margin-bottom: 2rem;
  color: var(--text-primary);
  font-size: 2rem;
}

.faq-answer {
  color: var(--text-secondary);
  line-height: 1.6;
}

.faq-answer ul {
  margin-top: 0.5rem;
  padding-left: 1.5rem;
}

.faq-answer li {
  margin-bottom: 0.5rem;
}

@media (max-width: 768px) {
  .faqs-container {
    padding: 1rem;
  }
  
  .faqs-content {
    padding: 1rem;
  }
  
  .faqs-title {
    font-size: 1.5rem;
  }
}
</style>
<template>
  <BaseLayout>
    <div class="contact-wrapper">
          <section class="contact-info" aria-label="Contact Information">
            <h2>Get in Touch</h2>
            <p>We'd love to hear from you. Send us a message and we'll respond as soon as possible.</p>
            <div class="contact-details">
              <div class="contact-item">
                <Icon icon="mdi:map-marker" class="contact-icon" />
                <span>Nairobi, Kenya</span>
              </div>
              <div class="contact-item">
                <Icon icon="mdi:email" class="contact-icon" />
                <a href="mailto:kisip2info@gmail.com" aria-label="Send email to KISIP">kisip2info@gmail.com</a>
              </div>
              <div class="contact-item">
                <Icon icon="mdi:phone" class="contact-icon" />
                <a href="tel:0800724349" aria-label="Call KISIP helpline">0800 724 349</a>
              </div>
            </div>
          </section>

          <el-form 
            :model="contactForm" 
            :rules="rules"
            ref="formRef"
            label-position="top" 
            class="contact-form"
          >
            <el-card shadow="hover" class="form-card">
              <template #header>
                <div class="card-header">
                  <span>Send us a Message</span>
                </div>
              </template>

              <el-row :gutter="20">
                <el-col :xs="24" :sm="24" :md="12">
                  <el-form-item label="Name" prop="name">
                    <el-input 
                      v-model="contactForm.name" 
                      placeholder="Enter your name"
                      :prefix-icon="User"
                    />
                  </el-form-item>
                </el-col>

                <el-col :xs="24" :sm="24" :md="6">
                  <el-form-item label="Country Code" prop="country_code">
                    <el-select 
                      v-model="contactForm.country_code" 
                      placeholder="Select country"
                      filterable
                      style="width: 100%"
                    >
                      <el-option
                        v-for="country in countryCodeOptions"
                        :key="country.value"
                        :label="country.label"
                        :value="country.value"
                      />
                    </el-select>
                  </el-form-item>
                </el-col>
                <el-col :xs="24" :sm="24" :md="6">
                  <el-form-item label="Phone" prop="phone">
                    <el-input 
                      v-model="contactForm.phone" 
                      placeholder="Enter phone number"
                      :prefix-icon="Phone"
                    />
                  </el-form-item>
                </el-col>

                <el-col :xs="24" :sm="24" :md="24">
                  <el-form-item label="Email" prop="email">
                    <el-input 
                      v-model="contactForm.email" 
                      placeholder="Enter your email"
                      :prefix-icon="Message"
                    />
                  </el-form-item>
                </el-col>

                <el-col :xs="24" :sm="24" :md="24">
                  <el-form-item label="Message" prop="message">
                    <el-input
                      v-model="contactForm.message"
                      type="textarea"
                      :rows="4"
                      placeholder="Enter your message"
                      resize="none"
                    />
                  </el-form-item>
                </el-col>
              </el-row>

              <template #footer>
                <div class="form-footer">
                  <el-button @click="submitForm" class="reset-btn">
                    Send Message
                    <i class="el-icon-right"></i>
                  </el-button>
                  <el-button @click="resetForm" class="reset-btn">Reset</el-button>
                </div>
              </template>
            </el-card>
          </el-form>
        </div>
  </BaseLayout>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { ElButton, ElCard, ElForm, ElFormItem, ElInput, ElRow, ElCol, ElMessage, ElSelect, ElOption } from 'element-plus';
import { User, Phone, Message } from '@element-plus/icons-vue';
import type { FormInstance, FormRules } from 'element-plus';
import BaseLayout from './BaseLayout.vue';
import countryPhoneCodes from '@/utils/countryPhoneCodes.json';
import { useHead } from '@unhead/vue';
import { Icon } from '@iconify/vue';
import { setUserFeedback } from '@/api/users';

useHead({
  title: 'Contact KeSMIS | Kenya Slum Management Information System',
  meta: [
    { name: 'description', content: 'Contact the KeSMIS team for support, inquiries, or feedback. Get in touch with KISIP for assistance with the Kenya Slum Management Information System.' },
    { name: 'keywords', content: 'contact KeSMIS, KISIP support, Kenya slum management contact, technical support, feedback form, helpline Kenya' },
    { name: 'author', content: 'Kenya Informal Settlements Improvement Project (KISIP)' },
    { name: 'robots', content: 'index, follow' },
    
    // Open Graph tags (for WhatsApp, Facebook, LinkedIn)
    { property: 'og:title', content: 'Contact KeSMIS - Kenya Slum Management Information System' },
    { property: 'og:description', content: 'Contact the KeSMIS team for support, inquiries, or feedback. Get in touch with KISIP for assistance.' },
    { property: 'og:type', content: 'website' },
    { property: 'og:url', content: 'https://kesmis.go.ke/contact' },
    { property: 'og:image', content: 'https://kesmis.go.ke/logo.png' },
    { property: 'og:image:width', content: '1200' },
    { property: 'og:image:height', content: '630' },
    { property: 'og:image:alt', content: 'KeSMIS Logo - Kenya Slum Management Information System' },
    { property: 'og:site_name', content: 'KeSMIS' },
    { property: 'og:locale', content: 'en_KE' },
    
    // Twitter Card tags
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: 'Contact KeSMIS - Kenya Slum Management Information System' },
    { name: 'twitter:description', content: 'Contact the KeSMIS team for support, inquiries, or feedback. Get in touch with KISIP for assistance.' },
    { name: 'twitter:image', content: 'https://kesmis.go.ke/twitter-card.jpg' },
    { name: 'twitter:image:alt', content: 'KeSMIS Logo - Kenya Slum Management Information System' },
    
    // Additional meta tags for better SEO
    { name: 'theme-color', content: '#00DC82' },
    { name: 'msapplication-TileColor', content: '#00DC82' },
    { name: 'viewport', content: 'width=device-width, initial-scale=1.0' },
    { name: 'format-detection', content: 'telephone=no' }
  ]
})

const formRef = ref<FormInstance>();

// Create country code options for the dropdown
const countryCodeOptions = countryPhoneCodes.map(country => ({
  value: country.dial_code,
  label: `${country.flag} ${country.name} (${country.dial_code})`
}));

const validatePhone = (_rule: any, value: string, callback: any) => {
  if (!value) {
    callback(new Error('Please input your phone number'));
    return;
  }
  
  // Basic phone number validation - just numbers
  if (!/^\d+$/.test(value)) {
    callback(new Error('Phone number should contain only digits'));
    return;
  }
  
  callback();
};

const rules = ref<FormRules>({
  name: [
    { required: true, message: 'Please input your name', trigger: 'blur' },
    { min: 2, message: 'Name must be at least 2 characters', trigger: 'blur' }
  ],
  country_code: [
    { required: true, message: 'Please select a country code', trigger: 'change' }
  ],
  phone: [
    { required: true, message: 'Please input your phone number', trigger: 'blur' },
    { validator: validatePhone, trigger: 'blur' }
  ],
  email: [
    { required: true, message: 'Please input your email', trigger: 'blur' },
    { type: 'email', message: 'Please enter a valid email address', trigger: 'blur' }
  ],
  message: [
    { required: true, message: 'Please input your message', trigger: 'blur' },
    { min: 10, message: 'Message must be at least 10 characters', trigger: 'blur' }
  ]
});

const contactForm = ref({
  name: '',
  country_code: '+254', // Default to Kenya
  phone: '',
  email: '',
  message: '',
});

const submitForm = async () => {
  if (!formRef.value) return;
  
  try {
    await formRef.value.validate();
  } catch (error) {
    console.error('Validation failed:', error);
    ElMessage.error('Please check your input and try again');
    return;
  }

  try {
    // Combine country code and phone number
    const fullPhone = contactForm.value.country_code + contactForm.value.phone;
    const formData = { ...contactForm.value, phone: fullPhone };

    await setUserFeedback(formData as any);
    resetForm();
  } catch (error) {
    console.error('Feedback submit failed:', error);
  }
};

const resetForm = () => {
  if (!formRef.value) return;
  formRef.value.resetFields();
};
</script>

<style scoped>
.form-container {
  min-height: 100vh;
  background-color: #f5f7fa;
  padding: 2rem;
}

.contact-wrapper {
  max-width: 1280px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 3rem;
  padding: 4rem 2rem;
}

.contact-info {
  padding: 2.5rem;
  background: linear-gradient(135deg, #00DC82 0%, #00B86B 100%);
  color: white;
  border-radius: 16px;
  box-shadow: 0 8px 24px rgba(0, 220, 130, 0.2);
}

.contact-info h2 {
  font-size: 2.5rem;
  margin-bottom: 1rem;
  font-weight: 800;
  letter-spacing: -0.02em;
  line-height: 1.2;
}

.contact-info p {
  margin-bottom: 2.5rem;
  line-height: 1.7;
  font-size: 1.125rem;
  opacity: 0.95;
}

.contact-details {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.contact-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  transition: all 0.3s ease;
  padding: 0.75rem;
  border-radius: 8px;
  background: transparent;
  border: 2px solid rgba(255, 255, 255, 0.3);
}

.contact-item:hover {
  transform: translateX(8px);
  border-color: rgba(255, 255, 255, 0.6);
}

.contact-icon {
  font-size: 1.5rem;
  color: white;
  opacity: 0.9;
  flex-shrink: 0;
  padding: 0.5rem;
  background: transparent;
  border: 2px solid rgba(255, 255, 255, 0.5);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
}

.contact-item a {
  color: white;
  text-decoration: none;
  transition: opacity 0.3s ease;
}

.contact-item a:hover {
  opacity: 0.8;
  text-decoration: underline;
}

.form-card {
  border: none;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  border-radius: 16px;
  overflow: hidden;
}

.card-header {
  text-align: left;
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--text-primary);
  padding: 1rem 0;
  letter-spacing: -0.01em;
}

.el-form-item {
  margin-bottom: 1.5rem;
}

.el-input :deep(.el-input__wrapper) {
  box-shadow: none;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  transition: all 0.3s ease;
}

.el-input :deep(.el-input__wrapper:hover),
.el-input :deep(.el-input__wrapper.is-focus) {
  border-color: #00DC82;
  box-shadow: 0 0 0 2px rgba(0, 220, 130, 0.2);
}

.el-textarea :deep(.el-textarea__inner) {
  border: 1px solid var(--border-color);
  border-radius: 8px;
  transition: all 0.3s ease;
}

.el-textarea :deep(.el-textarea__inner:hover),
.el-textarea :deep(.el-textarea__inner:focus) {
  border-color: #00DC82;
  box-shadow: 0 0 0 2px rgba(0, 220, 130, 0.2);
}

.form-footer {
  display: flex;
  justify-content: flex-start;
  gap: 1rem;
  padding-top: 1.5rem;
}

.reset-btn {
  background: #00DC82 !important;
  border: 1px solid #00DC82 !important;
  color: white !important;
  padding: 0.875rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.9375rem;
  transition: all 0.3s ease;
}

.reset-btn:hover {
  background: #00B86B !important;
  border-color: #00B86B !important;
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 220, 130, 0.3);
}

.reset-btn:first-child {
  background: #00DC82 !important;
  border-color: #00DC82 !important;
}

.reset-btn:last-child {
  background: transparent !important;
  border: 1px solid var(--border-color) !important;
  color: var(--text-primary) !important;
}

.reset-btn:last-child:hover {
  background: rgba(0, 220, 130, 0.1) !important;
  border-color: #00DC82 !important;
  color: #00DC82 !important;
}

@media (max-width: 768px) {
  .contact-wrapper {
    grid-template-columns: 1fr;
    padding: 2rem 1rem;
    gap: 2rem;
  }

  .contact-info {
    order: 2;
    padding: 2rem;
  }

  .contact-info h2 {
    font-size: 2rem;
  }

  .contact-form {
    order: 1;
  }

  .card-header {
    font-size: 1.5rem;
  }

  .form-footer {
    flex-direction: column;
    gap: 0.75rem;
  }

  .reset-btn {
    width: 100%;
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .contact-wrapper {
    padding: 20px 10px;
  }

  .reset-btn {
    padding: 8px 16px;
    font-size: 0.85rem;
  }
}

/* Dark Mode Support */
.dark-mode .contact-wrapper {
  background: transparent;
}

.dark-mode .form-card {
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
}

.dark-mode .card-header {
  color: var(--text-primary);
}

.dark-mode .el-input :deep(.el-input__wrapper) {
  background: var(--bg-secondary);
  border-color: var(--border-color);
}

.dark-mode .el-input :deep(.el-input__wrapper:hover),
.dark-mode .el-input :deep(.el-input__wrapper.is-focus) {
  border-color: #00DC82;
  box-shadow: 0 0 0 2px rgba(0, 220, 130, 0.2);
}

.dark-mode .el-textarea :deep(.el-textarea__inner) {
  background: var(--bg-secondary);
  border-color: var(--border-color);
  color: var(--text-primary);
}

.dark-mode .el-textarea :deep(.el-textarea__inner:hover),
.dark-mode .el-textarea :deep(.el-textarea__inner:focus) {
  border-color: #00DC82;
  box-shadow: 0 0 0 2px rgba(0, 220, 130, 0.2);
}

.dark-mode .el-select :deep(.el-select__wrapper) {
  background: var(--bg-secondary);
  border-color: var(--border-color);
}

.dark-mode .el-select :deep(.el-select__wrapper:hover),
.dark-mode .el-select :deep(.el-select__wrapper.is-focused) {
  border-color: #00DC82;
  box-shadow: 0 0 0 2px rgba(0, 220, 130, 0.2);
}

.dark-mode .reset-btn:last-child {
  border-color: var(--border-color);
  color: var(--text-primary);
}

.dark-mode .reset-btn:last-child:hover {
  background: rgba(0, 220, 130, 0.15) !important;
  border-color: #00DC82 !important;
  color: #00DC82 !important;
}

:deep(.el-form-item__error) {
  color: #f56c6c;
  font-size: 0.9rem;
  margin-top: 4px;
}

:deep(.el-input.is-error .el-input__wrapper) {
  box-shadow: 0 0 0 1px #f56c6c inset;
}

:deep(.el-textarea.is-error .el-textarea__inner) {
  box-shadow: 0 0 0 1px #f56c6c inset;
}
</style>

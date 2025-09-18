<template>
  <BaseLayout>
    <div class="contact-wrapper">
          <section class="contact-info" aria-label="Contact Information">
            <h2>Get in Touch</h2>
            <p>We'd love to hear from you. Send us a message and we'll respond as soon as possible.</p>
            <div class="contact-details">
              <div class="contact-item">
                <i class="el-icon-location" aria-hidden="true"></i>
                <span>Nairobi, Kenya</span>
              </div>
              <div class="contact-item">
                <i class="el-icon-message" aria-hidden="true"></i>
                <a href="mailto:kisip2info@gmail.com" aria-label="Send email to KISIP">kisip2info@gmail.com</a>
              </div>
              <div class="contact-item">
                <i class="el-icon-phone" aria-hidden="true"></i>
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
                  <el-form-item label="Name">
                    <el-input 
                      v-model="contactForm.name" 
                      placeholder="Enter your name"
                      :prefix-icon="User"
                    />
                  </el-form-item>
                </el-col>

                <el-col :xs="24" :sm="24" :md="6">
                  <el-form-item label="Country Code">
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
                  <el-form-item label="Phone">
                    <el-input 
                      v-model="contactForm.phone" 
                      placeholder="Enter phone number"
                      :prefix-icon="Phone"
                    />
                  </el-form-item>
                </el-col>

                <el-col :xs="24" :sm="24" :md="24">
                  <el-form-item label="Email">
                    <el-input 
                      v-model="contactForm.email" 
                      placeholder="Enter your email"
                      :prefix-icon="Message"
                    />
                  </el-form-item>
                </el-col>

                <el-col :xs="24" :sm="24" :md="24">
                  <el-form-item label="Message">
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
import { ref, onMounted } from 'vue';
import { ElButton, ElCard, ElForm, ElFormItem, ElInput, ElRow, ElCol, ElMessage, ElSelect, ElOption } from 'element-plus';
import { User, Phone, Message } from '@element-plus/icons-vue';
import type { FormInstance, FormRules } from 'element-plus';
import BaseLayout from './BaseLayout.vue';
import countryPhoneCodes from '@/utils/countryPhoneCodes.json';

// SEO Meta Tags Setup
onMounted(() => {
  document.title = 'Contact KeSMIS - Kenya Slum Management Information System | KISIP';
  
  const metaTags = [
    { name: 'description', content: 'Contact the KeSMIS team for support, inquiries, or feedback. Get in touch with KISIP for assistance with the Kenya Slum Management Information System.' },
    { name: 'keywords', content: 'contact KeSMIS, KISIP support, Kenya slum management contact, technical support, feedback form, helpline Kenya' },
    { name: 'robots', content: 'index, follow' },
    { property: 'og:title', content: 'Contact KeSMIS - Kenya Slum Management Information System' },
    { property: 'og:description', content: 'Contact the KeSMIS team for support, inquiries, or feedback. Get in touch with KISIP for assistance.' },
    { property: 'og:type', content: 'website' },
    { property: 'og:url', content: 'https://kesmis.go.ke/contact' }
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
  canonicalLink.setAttribute('href', 'https://kesmis.go.ke/contact');
  document.head.appendChild(canonicalLink);

  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "ContactPage",
    "name": "Contact KeSMIS",
    "description": "Contact information for the Kenya Slum Management Information System",
    "url": "https://kesmis.go.ke/contact",
    "mainEntity": {
      "@type": "Organization",
      "name": "Kenya Informal Settlements Improvement Project (KISIP)",
      "email": "kisip2info@gmail.com",
      "telephone": "0800 724 349",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": "Nairobi",
        "addressCountry": "Kenya"
      }
    }
  });
  document.head.appendChild(script);
});

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
    // Combine country code and phone number
    const fullPhone = contactForm.value.country_code + contactForm.value.phone;
    
    const formData = {
      ...contactForm.value,
      phone: fullPhone
    };
    
    console.log('Form submitted:', formData);
    ElMessage.success('Message sent successfully!');
    resetForm();
  } catch (error) {
    console.error('Validation failed:', error);
    ElMessage.error('Please check your input and try again');
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
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 2rem;
  background-color: #ffffff;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  padding: 2rem;
}

.contact-info {
  padding: 2rem;
  background: linear-gradient(135deg, #684035 0%, #8b5a2b 100%);
  color: white;
  border-radius: 8px;
}

.contact-info h2 {
  font-size: 2rem;
  margin-bottom: 1rem;
  font-weight: 600;
}

.contact-info p {
  margin-bottom: 2rem;
  line-height: 1.6;
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
  transition: transform 0.3s ease;
}

.contact-item:hover {
  transform: translateX(10px);
}

.contact-item i {
  font-size: 1.5rem;
  color: #ffd700;
}

.form-card {
  border: none;
  box-shadow: none;
}

.card-header {
  text-align: center;
  font-size: 1.5rem;
  font-weight: 600;
  color: #684035;
  padding: 1rem 0;
}

.el-form-item {
  margin-bottom: 1.5rem;
}

.el-input :deep(.el-input__wrapper) {
  box-shadow: none;
  border: 1px solid #dcdfe6;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.el-input :deep(.el-input__wrapper:hover),
.el-input :deep(.el-input__wrapper.is-focus) {
  border-color: #684035;
  box-shadow: 0 0 0 2px rgba(104, 64, 53, 0.2);
}

.el-textarea :deep(.el-textarea__inner) {
  border: 1px solid #dcdfe6;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.el-textarea :deep(.el-textarea__inner:hover),
.el-textarea :deep(.el-textarea__inner:focus) {
  border-color: #684035;
  box-shadow: 0 0 0 2px rgba(104, 64, 53, 0.2);
}

.form-footer {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding-top: 1rem;
}

.reset-btn {
  background: linear-gradient(135deg, #684035 0%, #8b5a2b 100%);
  border: none;
  color: white;
  padding: 0.6rem 1.2rem;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.9rem;
  transition: all 0.3s ease;
}

.reset-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(104, 64, 53, 0.3);
  opacity: 0.9;
}

@media (max-width: 768px) {
  .contact-wrapper {
    grid-template-columns: 1fr;
    padding: 1rem;
  }

  .contact-info {
    order: 2;
  }

  .contact-form {
    order: 1;
  }

  .card-header {
    font-size: 1.3rem;
  }

  .form-footer {
    flex-direction: column;
    gap: 1rem;
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

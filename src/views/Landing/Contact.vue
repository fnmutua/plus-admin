<template>
  <div class="form-container">
    <BaseLayout>
      <el-main>
        <el-form :model="contactForm" label-position="top">
          <el-card shadow="hover">
            <template #header>
              <div class="card-header">
                <span>Contact Us</span>
              </div>
            </template>

            <el-row>
              <el-col :xs="24" :sm="24" :md="12">
                <el-form-item label="Name">
                  <el-input v-model="contactForm.name" placeholder="Enter your name" />
                </el-form-item>
              </el-col>

              <el-col :xs="24" :sm="24" :md="12">
                <el-form-item label="Phone" style="margin-left: 5px;">
                  <el-input v-model="contactForm.phone" placeholder="Enter your phone number" />
                </el-form-item>
              </el-col>

              <el-col :xs="24" :sm="24" :md="12">
                <el-form-item label="Email">
                  <el-input v-model="contactForm.email" placeholder="Enter your email" />
                </el-form-item>
              </el-col>

              <el-col :xs="24" :sm="24" :md="24">
                <el-form-item label="Message">
                  <el-input
                    v-model="contactForm.message"
                    type="textarea"
                    rows="4"
                    placeholder="Enter your message"
                  />
                </el-form-item>
              </el-col>
            </el-row>

            <template #footer>
              <el-button type="primary" @click="submitForm">Submit</el-button>
              <el-button @click="resetForm">Reset</el-button>
            </template>
          </el-card>
        </el-form>
      </el-main>
    </BaseLayout>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { ElMain, ElButton, ElCard, ElForm, ElFormItem, ElInput, ElRow, ElCol } from 'element-plus';
import BaseLayout from './BaseLayout.vue';

const contactForm = ref({
  name: '',
  phone: '',
  email: '',
  message: '',
});

const submitForm = () => {
  console.log('Form submitted:', contactForm.value);
};

const resetForm = () => {
  contactForm.value = {
    name: '',
    phone: '',
    email: '',
    message: '',
  };
};
</script>

<style scoped>
.form-container {
  max-height: 768px;
  overflow-y: auto;
}

.card-header {
  padding: 20px 0;
  text-align: center;
  font-size: 1.5em;
  color: #333;
}

.el-form-item {
  margin-bottom: 20px;
}
</style>

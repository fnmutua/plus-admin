<template>
  <div class="phone-input-container">
    <div class="phone-input-wrapper">
      <!-- Country Code Selector -->
      <div class="country-selector" @click="toggleCountryDropdown">
        <span class="flag">{{ selectedCountry.flag }}</span>
        <span class="dial-code">{{ selectedCountry.dial_code }}</span>
        <i class="el-icon-arrow-down" :class="{ 'is-reverse': showCountryDropdown }"></i>
      </div>
      
      <!-- Phone Number Input -->
      <input
        v-model="phoneNumber"
        type="tel"
        class="phone-input"
        :placeholder="placeholder"
        @input="handlePhoneInput"
        @focus="onFocus"
        @blur="onBlur"
      />
    </div>

    <!-- Country Dropdown -->
    <div v-if="showCountryDropdown" class="country-dropdown">
      <div class="search-box">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search countries..."
          class="search-input"
          @input="filterCountries"
        />
      </div>
      <div class="countries-list">
        <div
          v-for="country in filteredCountries"
          :key="country.code"
          class="country-option"
          :class="{ 'selected': country.dial_code === selectedCountry.dial_code }"
          @click="selectCountry(country)"
        >
          <span class="flag">{{ country.flag }}</span>
          <span class="country-name">{{ country.name }}</span>
          <span class="dial-code">{{ country.dial_code }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import countryPhoneCodes from '@/utils/countryPhoneCodes.json'

interface Country {
  name: string
  code: string
  dial_code: string
  flag: string
}

interface Props {
  modelValue?: string
  placeholder?: string
  defaultCountry?: string
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  placeholder: 'Enter phone number',
  defaultCountry: '+254'
})

const emit = defineEmits(['update:modelValue', 'change'])

const phoneNumber = ref('')
const showCountryDropdown = ref(false)
const searchQuery = ref('')
const selectedCountry = ref<Country>(countryPhoneCodes.find(c => c.dial_code === props.defaultCountry) || countryPhoneCodes[0])

// Filter countries based on search
const filteredCountries = computed(() => {
  if (!searchQuery.value) return countryPhoneCodes
  const query = searchQuery.value.toLowerCase()
  return countryPhoneCodes.filter(country => 
    country.name.toLowerCase().includes(query) ||
    country.dial_code.includes(query) ||
    country.code.toLowerCase().includes(query)
  )
})

// Toggle country dropdown
const toggleCountryDropdown = () => {
  showCountryDropdown.value = !showCountryDropdown.value
  if (showCountryDropdown.value) {
    searchQuery.value = ''
  }
}

// Select a country
const selectCountry = (country: Country) => {
  selectedCountry.value = country
  showCountryDropdown.value = false
  emitChange()
}

// Handle phone input
const handlePhoneInput = () => {
  // Remove any non-digit characters from phone input
  phoneNumber.value = phoneNumber.value.replace(/\D/g, '')
  emitChange()
}

// Emit change event
const emitChange = () => {
  const fullPhone = selectedCountry.value.dial_code + phoneNumber.value
  emit('update:modelValue', fullPhone)
  emit('change', fullPhone)
}

// Focus and blur handlers
const onFocus = () => {
  // Keep dropdown closed on input focus
}

const onBlur = () => {
  // Close dropdown when clicking outside
  setTimeout(() => {
    showCountryDropdown.value = false
  }, 200)
}

// Click outside to close dropdown
const handleClickOutside = (event: Event) => {
  const target = event.target as HTMLElement
  if (!target.closest('.phone-input-container')) {
    showCountryDropdown.value = false
  }
}

// Initialize phone number from modelValue
const initializePhoneNumber = () => {
  if (props.modelValue) {
    const country = countryPhoneCodes.find(c => props.modelValue.startsWith(c.dial_code))
    if (country) {
      selectedCountry.value = country
      phoneNumber.value = props.modelValue.replace(country.dial_code, '')
    }
  }
}

// Watch for external changes
watch(() => props.modelValue, initializePhoneNumber, { immediate: true })

// Lifecycle
onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  initializePhoneNumber()
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.phone-input-container {
  position: relative;
  width: 100%;
}

.phone-input-wrapper {
  display: flex;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  overflow: hidden;
  background: #fff;
  transition: border-color 0.2s;
}

.phone-input-wrapper:focus-within {
  border-color: #409eff;
}

.country-selector {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #f5f7fa;
  border-right: 1px solid #dcdfe6;
  cursor: pointer;
  min-width: 120px;
  transition: background-color 0.2s;
}

.country-selector:hover {
  background: #e4e7ed;
}

.flag {
  font-size: 16px;
}

.dial-code {
  font-weight: 500;
  color: #606266;
}

.el-icon-arrow-down {
  transition: transform 0.2s;
  color: #c0c4cc;
}

.el-icon-arrow-down.is-reverse {
  transform: rotate(180deg);
}

.phone-input {
  flex: 1;
  border: none;
  outline: none;
  padding: 8px 12px;
  font-size: 14px;
  background: transparent;
}

.phone-input::placeholder {
  color: #c0c4cc;
}

.country-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: #fff;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  z-index: 1000;
  max-height: 300px;
  overflow: hidden;
}

.search-box {
  padding: 12px;
  border-bottom: 1px solid #ebeef5;
}

.search-input {
  width: 100%;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  padding: 8px 12px;
  outline: none;
  font-size: 14px;
}

.search-input:focus {
  border-color: #409eff;
}

.countries-list {
  max-height: 250px;
  overflow-y: auto;
}

.country-option {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.country-option:hover {
  background: #f5f7fa;
}

.country-option.selected {
  background: #ecf5ff;
  color: #409eff;
}

.country-option .flag {
  font-size: 16px;
  min-width: 20px;
}

.country-option .country-name {
  flex: 1;
  font-size: 14px;
}

.country-option .dial-code {
  font-size: 14px;
  color: #909399;
  font-weight: 500;
}

/* Scrollbar styling */
.countries-list::-webkit-scrollbar {
  width: 6px;
}

.countries-list::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.countries-list::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.countries-list::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>

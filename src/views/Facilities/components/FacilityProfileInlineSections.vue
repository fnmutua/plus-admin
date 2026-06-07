<!-- eslint-disable prettier/prettier -->
<script setup lang="ts">
// @ts-nocheck
import { computed, toRef } from 'vue'
import { ElCollapse, ElCollapseItem } from 'element-plus'
import InlineEditableDescriptions from '@/views/Settlement/components/InlineEditableDescriptions.vue'
import { useFacilityProfileInlineEdit } from '@/views/Facilities/composables/useFacilityProfileInlineEdit'
import { useFacilityDetailsMobile } from '@/views/Facilities/composables/useFacilityDetailsMobile'

const props = defineProps<{
  featureType: string
  record: Record<string, unknown>
  updateModel?: string
}>()

const { descriptionColumn } = useFacilityDetailsMobile()

const {
  inlineSections,
  expandedSections,
  recordData,
  savingField,
  selectOptions,
  fieldTypes,
  activeSelectFields,
  canEdit,
  getSectionReadonlyFields,
  saveInline,
} = useFacilityProfileInlineEdit({
  record: toRef(props, 'record'),
  featureType: toRef(props, 'featureType'),
  updateModel: computed(() => props.updateModel || props.featureType),
})

const hasSections = computed(() => inlineSections.value.length > 0)
</script>

<template>
  <div v-if="hasSections" class="facility-profile-inline">
    <ElCollapse v-model="expandedSections" class="facility-profile-inline__collapse">
      <ElCollapseItem
        v-for="section in inlineSections"
        :key="section.title"
        :name="section.title"
      >
        <template #title>
          <span class="facility-profile-inline__section-title">{{ section.title }}</span>
        </template>
        <InlineEditableDescriptions
          :data="recordData"
          :schema="section.schema"
          :column="descriptionColumn"
          table-class="feature-descriptions"
          :boolean-tags="true"
          :editable="canEdit"
          :readonly-fields="getSectionReadonlyFields(section.title)"
          :textarea-fields="fieldTypes.textareaFields"
          :clamp-fields="fieldTypes.textareaFields"
          :number-fields="fieldTypes.numberFields"
          :boolean-fields="fieldTypes.booleanFields"
          :select-options="selectOptions"
          :select-fields="activeSelectFields"
          :multiselect-fields="fieldTypes.multiselectFields"
          :saving-field="savingField"
          @save="saveInline"
        />
      </ElCollapseItem>
    </ElCollapse>
  </div>
  <p v-else class="facility-profile-inline__empty">No profile fields available.</p>
</template>

<style scoped>
.facility-profile-inline__collapse :deep(.el-collapse-item__header) {
  font-weight: 600;
  padding-left: 4px;
}

.facility-profile-inline__collapse :deep(.el-collapse-item__content) {
  padding: 0 4px 12px;
}

.facility-profile-inline__empty {
  color: var(--el-text-color-secondary);
  padding: 12px 4px;
  margin: 0;
}
</style>

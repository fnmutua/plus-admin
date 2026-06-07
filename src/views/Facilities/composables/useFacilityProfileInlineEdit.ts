// @ts-nocheck
import { computed, reactive, ref, watch, type Ref } from 'vue'
import { ElMessage } from 'element-plus'
import { updateOneRecord } from '@/api/settlements'
import {
  buildFacilityProfileInlineSections,
  collectDrawerFieldTypes,
  normalizeFacilityProperties,
  prepareFacilityProfileRecordData,
  type DrawerInlineSection,
} from '@/views/Components/settlementMapDrawer'
import {
  buildFacilitySelectOptions,
  canEditDrawerRecord,
  coerceDrawerValueForApi,
  displayValueAfterSave,
  getDrawerReadonlyFields,
  getFacilitySelectFields,
  mergeDrawerFieldTypes,
  type DrawerRecordMeta,
} from '@/views/Components/settlementMapDrawerInline'
import {
  flattenFacilityProfileProperties,
  resolveFacilitySchemaType,
} from '@/views/Facilities/facilityProfileInlineEdit'
import { useCache } from '@/hooks/web/useCache'
import { useAppStoreWithOut } from '@/store/modules/app'

export function useFacilityProfileInlineEdit(options: {
  record: Ref<Record<string, unknown>>
  featureType: Ref<string> | string
  updateModel?: Ref<string> | string
}) {
  const { wsCache } = useCache()
  const appStore = useAppStoreWithOut()
  const userInfo = wsCache.get(appStore.getUserInfo)

  const isSuperAdmin =
    userInfo?.roles?.some(
      (role: { name?: string }) => role.name === 'super_admin' || role.name === 'root_admin'
    ) ?? false

  const processedRoles = (userInfo?.roles || []).map((role: any) => {
    let field = null
    let fieldvalue = null
    if (role.user_roles?.location_level === 'county') {
      field = 'county_id'
      fieldvalue = role.user_roles.county_id
    } else if (role.user_roles?.location_level === 'settlement') {
      field = 'settlement_id'
      fieldvalue = role.user_roles.settlement_id
    }
    return {
      field,
      value: fieldvalue,
      location_level: role.user_roles?.location_level,
      roleName: role.name,
    }
  })

  const schemaFeatureType = computed(() => {
    const raw = typeof options.featureType === 'string'
      ? options.featureType
      : options.featureType.value
    return resolveFacilitySchemaType(raw)
  })

  const apiModel = computed(() => {
    if (options.updateModel != null) {
      return typeof options.updateModel === 'string'
        ? options.updateModel
        : options.updateModel.value
    }
    return schemaFeatureType.value
  })

  const inlineSections = ref<DrawerInlineSection[]>([])
  const expandedSections = ref<string[]>([])
  const recordData = reactive<Record<string, unknown>>({})
  const savingField = ref<string | null>(null)
  const selectOptions = ref<Record<string, Array<{ label: string; value: string | number | boolean }>>>({})

  const recordMeta = computed<DrawerRecordMeta>(() => {
    const flat = flattenFacilityProfileProperties(options.record.value || {})
    return {
      id: flat.id ?? null,
      county_id: flat.county_id != null ? Number(flat.county_id) : null,
    }
  })

  const fieldTypes = computed(() =>
    mergeDrawerFieldTypes(
      'facility',
      schemaFeatureType.value,
      collectDrawerFieldTypes('facility', schemaFeatureType.value)
    )
  )

  const activeSelectFields = computed(() => getFacilitySelectFields(schemaFeatureType.value))

  const canEdit = computed(() => {
    const permissionType = apiModel.value
    if (canEditDrawerRecord('facility', permissionType, recordMeta.value, {
      isSuperAdmin,
      permissions: userInfo?.permissions || [],
      processedRoles,
    })) {
      return true
    }

    if (permissionType !== schemaFeatureType.value) {
      return canEditDrawerRecord('facility', schemaFeatureType.value, recordMeta.value, {
        isSuperAdmin,
        permissions: userInfo?.permissions || [],
        processedRoles,
      })
    }

    return false
  })

  const getSectionReadonlyFields = (sectionTitle: string) =>
    getDrawerReadonlyFields('facility', sectionTitle)

  const syncFromRecord = () => {
    const raw = options.record.value || {}
    const flat = flattenFacilityProfileProperties(raw)
    const normalized = normalizeFacilityProperties(schemaFeatureType.value, flat)
    inlineSections.value = buildFacilityProfileInlineSections(normalized, schemaFeatureType.value)
    selectOptions.value = buildFacilitySelectOptions(schemaFeatureType.value)

    Object.keys(recordData).forEach((key) => delete recordData[key])
    Object.assign(recordData, prepareFacilityProfileRecordData(normalized, schemaFeatureType.value))

    if (inlineSections.value.length > 0 && expandedSections.value.length === 0) {
      expandedSections.value = [inlineSections.value[0].title]
    }
  }

  watch(
    () => [options.record.value, schemaFeatureType.value],
    syncFromRecord,
    { immediate: true, deep: true }
  )

  const syncRecordField = (field: string, apiValue: unknown) => {
    if (!options.record.value) return
    options.record.value[field] = apiValue
  }

  async function saveInline(payload: { field: string; value: unknown }) {
    const { field, value } = payload
    const recordId = recordMeta.value.id

    if (recordId == null) {
      ElMessage.warning('This facility cannot be edited.')
      return
    }

    if (!canEdit.value) {
      ElMessage.warning('You do not have permission to edit this facility.')
      return
    }

    try {
      savingField.value = field
      const apiValue = coerceDrawerValueForApi('facility', field, value)
      const res = await updateOneRecord(
        {
          model: apiModel.value,
          id: Number(recordId),
          [field]: apiValue,
        } as any,
        { silent: true }
      )

      const responseCode = res?.code ?? res?.data?.code
      if (responseCode && String(responseCode) !== '0000') {
        throw new Error(res?.message || res?.data?.message || 'Update failed')
      }

      const displayVal = displayValueAfterSave(field, apiValue, 'facility')
      recordData[field] = displayVal
      syncRecordField(field, apiValue)
      ElMessage.success('Saved')
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Save failed'
      ElMessage.error(msg)
    } finally {
      savingField.value = null
    }
  }

  return {
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
  }
}

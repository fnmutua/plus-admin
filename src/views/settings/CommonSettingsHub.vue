<script setup lang="ts">
import SettingsTabHub from '@/components/settings/SettingsTabHub.vue'
import { COMMON_TABS } from '@/config/settings/reference-data.config'
</script>

<template>
  <SettingsTabHub :tabs="COMMON_TABS" default-tab="evaluation-types" />
</template>

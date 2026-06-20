<script setup lang="ts">
import SettingsTabHub from '@/components/settings/SettingsTabHub.vue'
import { PROGRAMME_TABS } from '@/config/settings/programme.config'
</script>

<template>
  <SettingsTabHub :tabs="PROGRAMME_TABS" default-tab="programmes" />
</template>

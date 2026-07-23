<template>
  <el-row class="users-toolbar" :gutter="10">
    <el-col :xs="24" :sm="24" :md="14" :lg="16" class="users-toolbar__filters">
      <slot name="filters"></slot>
    </el-col>
    <el-col :xs="24" :sm="24" :md="10" :lg="8" class="users-toolbar__actions-col">
      <div class="users-toolbar__actions">
        <slot name="actions"></slot>
      </div>
    </el-col>
  </el-row>
</template>

<style scoped>
.users-toolbar {
  align-items: center;
  margin-bottom: 4px;
}

.users-toolbar__filters {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
}

.users-toolbar__filters :deep(.users-toolbar__back) {
  flex-shrink: 0;
}

.users-toolbar__filters :deep(.users-toolbar__county-select),
.users-toolbar__filters :deep(.users-toolbar__search-select) {
  flex: 1 1 180px;
  min-width: 160px;
  max-width: 320px;
}

.users-toolbar__actions-col {
  display: flex;
  justify-content: flex-end;
}

.users-toolbar__actions {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 4px 6px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 8px;
  background: var(--el-fill-color-blank);
}

@media (max-width: 768px) {
  .users-toolbar__actions-col {
    justify-content: flex-start;
    margin-top: 8px;
  }

  .users-toolbar__filters :deep(.users-toolbar__county-select),
  .users-toolbar__filters :deep(.users-toolbar__search-select) {
    max-width: 100%;
    width: 100%;
  }
}
</style>

<template>
  <div class="users-toolbar">
    <div class="users-toolbar__filters">
      <slot name="filters"></slot>
    </div>
    <div class="users-toolbar__actions">
      <slot name="actions"></slot>
    </div>
  </div>
</template>

<style scoped>
.users-toolbar {
  display: flex;
  flex-wrap: nowrap;
  align-items: center;
  gap: 10px;
  margin-bottom: 4px;
}

.users-toolbar__filters {
  display: flex;
  flex-wrap: nowrap;
  align-items: center;
  gap: 10px;
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
}

.users-toolbar__filters :deep(.users-toolbar__back) {
  flex-shrink: 0;
}

.users-toolbar__filters :deep(.el-select) {
  flex: 0 1 200px;
  min-width: 160px;
  max-width: 220px;
}

.users-toolbar__filters :deep(.users-toolbar__search-select),
.users-toolbar__filters :deep(.el-select:last-of-type) {
  flex: 1 1 360px;
  min-width: 280px;
  max-width: 480px;
}

.users-toolbar__actions {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
  padding: 4px 6px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 8px;
  background: var(--el-fill-color-blank);
  flex-shrink: 0;
}

.users-toolbar__actions :deep(.el-button) {
  margin: 0;
  vertical-align: middle;
}

@media (max-width: 768px) {
  .users-toolbar {
    flex-wrap: wrap;
  }

  .users-toolbar__filters {
    flex-wrap: wrap;
    width: 100%;
  }

  .users-toolbar__filters :deep(.el-select) {
    max-width: 100%;
    width: 100%;
    flex: 1 1 100%;
  }

  .users-toolbar__actions {
    margin-left: 0;
    width: 100%;
    justify-content: flex-start;
  }
}
</style>

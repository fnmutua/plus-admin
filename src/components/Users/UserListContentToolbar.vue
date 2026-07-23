<template>
  <div class="users-content-toolbar">
    <div class="users-content-toolbar__filters">
      <slot name="filters"></slot>
    </div>
    <div class="users-content-toolbar__actions">
      <slot name="actions"></slot>
    </div>
  </div>
</template>

<style scoped>
.users-content-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.users-content-toolbar__filters {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  flex: 1 1 auto;
  min-width: 0;
}

.users-content-toolbar__filters :deep(.el-select) {
  width: 300px;
  max-width: 100%;
}

.users-content-toolbar__actions {
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

@media (max-width: 768px) {
  .users-content-toolbar__actions {
    margin-left: 0;
    width: 100%;
    justify-content: flex-start;
  }

  .users-content-toolbar__filters :deep(.el-select) {
    width: 100%;
  }
}
</style>

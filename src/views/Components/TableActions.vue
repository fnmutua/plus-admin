<template>
  <div>
    <el-dropdown trigger="click" placement="bottom-end">
      <el-button type="primary" size="small" :icon="Setting" circle />
      <template #dropdown>
        <el-dropdown-menu>
          <!-- View Actions -->
          <el-dropdown-item 
            v-if="buttons.includes('viewOnMap')" 
            @click="onViewOnMap(item)"
            divided>
            <el-icon><Position /></el-icon>
            <span style="margin-left: 8px;">View on Map</span>
          </el-dropdown-item>

          <el-dropdown-item 
            v-if="buttons.includes('preview')" 
            @click="onPreview(item)">
            <el-icon><TopRight /></el-icon>
            <span style="margin-left: 8px;">Preview</span>
          </el-dropdown-item>

          <!-- Edit Actions -->
          <el-dropdown-item 
            v-if="buttons.includes('edit')" 
            @click="onEdit(item)"
            :divided="!buttons.includes('viewOnMap') && !buttons.includes('preview')">
            <el-icon><Edit /></el-icon>
            <span style="margin-left: 8px;">Edit</span>
          </el-dropdown-item>

          <el-dropdown-item 
            v-if="buttons.includes('addGeometry')" 
            @click="onAddGeometry(item)">
            <el-icon><Position /></el-icon>
            <span style="margin-left: 8px;">Add Geometry</span>
          </el-dropdown-item>

          <el-dropdown-item 
            v-if="buttons.includes('merge')" 
            @click="onMerge(item)">
            <el-icon><TopRight /></el-icon>
            <span style="margin-left: 8px;">Merge with Another</span>
          </el-dropdown-item>

          <el-dropdown-item 
            v-if="buttons.includes('updateLocation')" 
            @click="onUpdateLocation(item)">
            <el-icon><Location /></el-icon>
            <span style="margin-left: 8px;">Update Location</span>
          </el-dropdown-item>

          <!-- Review Actions -->
          <el-dropdown-item 
            v-if="buttons.includes('review')" 
            @click="onReview(item)"
            :divided="!buttons.includes('edit') && !buttons.includes('addGeometry')">
            <el-icon><View /></el-icon>
            <span style="margin-left: 8px;">Review</span>
          </el-dropdown-item>

          <!-- Share/Download Actions -->
          <el-dropdown-item 
            v-if="buttons.includes('download')" 
            @click="onDownload(item)"
            :divided="!buttons.includes('review')">
            <el-icon><Download /></el-icon>
            <span style="margin-left: 8px;">Download</span>
          </el-dropdown-item>

          <el-dropdown-item 
            v-if="buttons.includes('share')" 
            @click="onShare(item)">
            <el-icon><TopRight /></el-icon>
            <span style="margin-left: 8px;">Share</span>
          </el-dropdown-item>

          <!-- Dangerous Actions (with dividers and confirmation) -->
          <el-dropdown-item 
            v-if="buttons.includes('decommission')" 
            @click="onDecommission(item)"
            divided
            class="danger-action">
            <el-icon><TakeawayBox /></el-icon>
            <span style="margin-left: 8px;">Decommission</span>
          </el-dropdown-item>

          <el-dropdown-item 
            v-if="buttons.includes('delete')" 
            @click="handleDeleteClick(item)"
            class="danger-action">
            <el-icon><Delete /></el-icon>
            <span style="margin-left: 8px;">Delete</span>
          </el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>

    <!-- Confirmation Dialog for Delete -->
    <el-dialog
      v-model="deleteDialogVisible"
      title="Confirm Delete"
      width="400px"
      :before-close="handleDeleteCancel">
      <p>Are you sure you want to delete this record? This action cannot be undone.</p>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="handleDeleteCancel">Cancel</el-button>
          <el-button type="danger" @click="confirmDelete">Delete</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import { ref, PropType } from 'vue';
import { ElButton, ElIcon, ElDropdown, ElDropdownMenu, ElDropdownItem, ElDialog } from 'element-plus';
import { Setting, Edit, TopRight, Position, Delete, View, Download, TakeawayBox, Location } from '@element-plus/icons-vue';

const props = defineProps({
  item: Object,
  buttons: {
    type: Array as PropType<string[]>,
    default: () => []
  },
});

const emit = defineEmits(["edit", "viewOnMap", "review", "preview", "delete", "download", "decommission", "addGeometry", "share", "merge", "updateLocation"]);

// Confirmation dialog state for delete
const deleteDialogVisible = ref(false);
const pendingAction = ref<{ type: string; item: any } | null>(null);

const onEdit = (item) => {
  emit("edit", item);
};

const onViewOnMap = (item) => {
  emit("viewOnMap", item);
};

const onReview = (item) => {
  emit("review", item);
};

const onPreview = (item) => {
  emit("preview", item);
};

const onDownload = (item) => {
  emit("download", item);
};

const onShare = (item) => {
  emit("share", item);
};

const onAddGeometry = (item) => {
  emit("addGeometry", item);
};

const onMerge = (item) => {
  emit("merge", item);
};

const onUpdateLocation = (item) => {
  emit("updateLocation", item);
};

const onDecommission = (item) => {
  emit("decommission", item);
};

// Handle delete with confirmation
const handleDeleteClick = (item) => {
  pendingAction.value = { type: 'delete', item };
  deleteDialogVisible.value = true;
};

const confirmDelete = () => {
  if (pendingAction.value && pendingAction.value.type === 'delete') {
    emit("delete", pendingAction.value.item);
    deleteDialogVisible.value = false;
    pendingAction.value = null;
  }
};

const handleDeleteCancel = () => {
  deleteDialogVisible.value = false;
  pendingAction.value = null;
};

</script>

<style scoped>
.danger-action {
  color: var(--el-color-danger);
}

.danger-action:hover {
  background-color: var(--el-color-danger-light-9);
}
</style>
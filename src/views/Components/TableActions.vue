<template>
  <div>
    <el-dropdown trigger="click" placement="bottom-end">
      <!-- Desktop / tablet: circular settings button -->
      <el-button
        v-if="!isMobile"
        type="primary"
        size="small"
        :icon="Setting"
        circle
      />
      <!-- Mobile: icon-only button (no circle) -->
      <el-button
        v-else
        link
        size="small"
      >
        <el-icon>
          <Setting />
        </el-icon>
      </el-button>
      <template #dropdown>
        <el-dropdown-menu>
          <!-- View Actions -->
          <el-dropdown-item
            v-if="buttons.includes('viewProfile')"
            @click="onViewProfile(item)">
            <el-icon><View /></el-icon>
            <span style="margin-left: 8px;">View Profile</span>
          </el-dropdown-item>

          <el-dropdown-item
            v-if="buttons.includes('viewOnMap')"
            @click="onViewOnMap(item)"
            divided>
            <el-icon><Position /></el-icon>
            <span style="margin-left: 8px;">View on Map</span>
          </el-dropdown-item>

          <el-dropdown-item 
            v-if="buttons.includes('addFacility')" 
            @click="onAddFacility(item)">
            <el-icon><Plus /></el-icon>
            <span style="margin-left: 8px;">Add Facility</span>
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

          <el-dropdown-item
            v-if="buttons.includes('linkToSettlement')"
            @click="onLinkToSettlement(item)">
            <el-icon><Connection /></el-icon>
            <span style="margin-left: 8px;">Link</span>
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
            v-if="buttons.includes('undoDecommission')"
            @click="onUndoDecommission(item)"
            divided>
            <el-icon><RefreshLeft /></el-icon>
            <span style="margin-left: 8px;">Undo Decommission</span>
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
      width="450px"
      :before-close="handleDeleteCancel"
      :modal="true"
      :modal-append-to-body="true"
      :append-to-body="true"
      :close-on-click-modal="false"
      :close-on-press-escape="true"
      :z-index="3000"
      align-center
      class="delete-confirm-dialog">
      <div style="padding: 10px 0;">
        <el-alert
          type="warning"
          :closable="false"
          style="margin-bottom: 20px;">
          <template #title>
            <div style="font-size: 14px; line-height: 1.6;">
              <p v-if="pendingAction?.item" style="margin: 0 0 8px 0;">
                Are you sure you want to delete <strong style="color: #E6A23C;">{{ pendingAction.item.name || 'this settlement' }}</strong>?
              </p>
              <p v-else style="margin: 0 0 8px 0;">
                Are you sure you want to delete this record?
              </p>
              <p style="margin: 0; font-size: 13px; color: #606266;">
                This action will move it to the Deleted tab and can be restored later.
              </p>
            </div>
          </template>
        </el-alert>
      </div>
      <template #footer>
        <span class="dialog-footer" style="display: flex; justify-content: flex-end; gap: 10px;">
          <el-button @click="handleDeleteCancel">Cancel</el-button>
          <el-button type="danger" @click="confirmDelete">Delete</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import { ref, PropType, computed } from 'vue';
import { ElButton, ElIcon, ElDropdown, ElDropdownMenu, ElDropdownItem, ElDialog, ElAlert } from 'element-plus';
import { Setting, Edit, TopRight, Position, Delete, View, Download, TakeawayBox, Location, Plus, Connection, RefreshLeft } from '@element-plus/icons-vue';

const props = defineProps({
  item: Object,
  buttons: {
    type: Array as PropType<string[]>,
    default: () => []
  },
});

const emit = defineEmits(["edit", "viewOnMap", "viewProfile", "review", "preview", "delete", "download", "decommission", "undoDecommission", "addGeometry", "share", "merge", "updateLocation", "addFacility", "linkToSettlement"]);

// Simple mobile detection for per-row actions (non-reactive to resize, good enough)
const isMobile = computed(() => window.innerWidth <= 768);

// Confirmation dialog state for delete
const deleteDialogVisible = ref(false);
const pendingAction = ref<{ type: string; item: any } | null>(null);

const onViewProfile = (item) => {
  emit("viewProfile", item);
};

const onEdit = (item) => {
  emit("edit", item);
};

const onViewOnMap = (item) => {
  emit("viewOnMap", item);
};

const onAddFacility = (item) => {
  emit("addFacility", item);
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

const onUndoDecommission = (item) => {
  emit("undoDecommission", item);
};

const onLinkToSettlement = (item) => {
  emit("linkToSettlement", item);
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

<style>
/* Ensure delete dialog appears on top and doesn't affect table */
.delete-confirm-dialog {
  z-index: 3000 !important;
}

.delete-confirm-dialog.el-dialog {
  position: fixed !important;
  margin: 0 !important;
  top: 50% !important;
  left: 50% !important;
  transform: translate(-50%, -50%) !important;
}

/* Ensure overlay is on top */
.delete-confirm-dialog + .el-overlay {
  z-index: 2999 !important;
}

/* Prevent dialog from affecting table layout */
:deep(.delete-confirm-dialog) {
  z-index: 3000 !important;
}

:deep(.delete-confirm-dialog + .el-overlay) {
  z-index: 2999 !important;
}

/* Center dialog wrapper */
:deep(.delete-confirm-dialog.el-dialog__wrapper) {
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
}
</style>
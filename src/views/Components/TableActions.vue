<template>
    <el-dropdown v-if="isMobile">
      <span class="el-dropdown-link">
        <Icon icon="ic:sharp-keyboard-arrow-down" width="24" />
      </span>
      <template #dropdown>
        <el-dropdown-menu>
          <el-dropdown-item
            v-if="showEditButtons" @click="handleEdit"
            :icon="Edit">Edit</el-dropdown-item>
          <el-dropdown-item
            v-if="showAdminButtons" @click="handleDelete"
            :icon="Delete" color="red">Delete</el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>
    <div v-else>
      <el-tooltip content="Edit" placement="top">
        <el-button
           type="success" size="small" :icon="Edit"
          @click="handleEdit" :disabled="row.status == 'Approved'" circle />
      </el-tooltip>
      <el-tooltip content="Delete" placement="top">
        <el-popconfirm
          confirm-button-text="Yes" cancel-button-text="No" :icon="InfoFilled" icon-color="#626AEF"
          title="Are you sure to delete this report?" @confirm="handleDelete">
          <template #reference>
            <el-button v-if="showAdminButtons" type="danger" size="small" :icon="Delete" circle />
          </template>
        </el-popconfirm>
      </el-tooltip>
    </div>
  </template>
  
  <script setup>
  import { ref } from 'vue';
  import { ElMessageBox,ElButton,ElTooltip,ElPopconfirm,ElDropdown,ElDropdownItem,ElDropdownMenu } from 'element-plus';
  
  import {
  Plus,
  Edit,
  Download,
  Filter,
  Delete,
  UploadFilled,
  Back,
  InfoFilled
} from '@element-plus/icons-vue'



  // Props
  const props = defineProps({
    row: Object,             // The current row data
    isMobile: Boolean,       // Whether the current device is mobile
    showEditButtons: Boolean, // Control visibility of the edit button
    showAdminButtons: Boolean // Control visibility of the delete button
  });
  
  // Emit events
  const emit = defineEmits(['editRecord', 'deleteRecord']);
  
  // Methods for handling actions
  const handleEdit = () => {
    emit('editRecord', props.row);
  };
  
  const handleDelete = () => {
    emit('deleteRecord', props.row);
  };
  </script>
  
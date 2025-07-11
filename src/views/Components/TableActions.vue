<template>
  <div>
    <!-- For medium and large screens -->
    <div class="actions-buttons" v-if="!isSmallScreen">


      <el-tooltip content="Edit" placement="top">
        <el-button
v-if="buttons.includes('edit')" type="success" size="small" :icon="Edit" @click="onEdit(item)"
          plain />
      </el-tooltip>

      <el-tooltip content="View on Map" placement="top">
        <el-button
v-if="buttons.includes('viewOnMap')" type="warning" size="small" :icon="Position"
          @click="onViewOnMap(item)" plain />
      </el-tooltip>

      <el-tooltip content="Review" placement="top">
        <el-button
v-if="buttons.includes('review')" type="primary" size="small" :icon="View" @click="onReview(item)"
          plain />
      </el-tooltip>

      <el-tooltip content="Download" placement="top">
        <el-button
v-if="buttons.includes('download')" type="info" size="small" :icon="Download"
          @click="onDownload(item)" plain />
      </el-tooltip>

      <el-tooltip content="Preview" placement="top">
        <el-button
v-if="buttons.includes('preview')" type="warning" size="small" :icon="TopRight"
          @click="onPreview(item)" plain />
      </el-tooltip>


      <el-tooltip content="Delete" placement="top">
        <template #default>
          <el-popconfirm
width="300" confirm-button-text="Yes" cancel-button-text="No" :icon="InfoFilled"
            icon-color="#626AEF" title="Are you sure to delete this record?" @confirm="onDelete(item)">
            <template #reference>
              <el-button v-if="buttons.includes('delete')" type="danger" size="small" :icon="Delete" plain />
            </template>
          </el-popconfirm>
        </template>
      </el-tooltip>



    </div>

    <!-- For small screens -->

    <el-dropdown trigger="click" v-else>
      <span class="el-dropdown-link">
        Actions <el-icon class="el-icon--right">
          <ArrowDown />
        </el-icon>
      </span>
      <template #dropdown>
        <el-dropdown-menu>
          <el-dropdown-item v-if="buttons.includes('edit')" @click="onEdit(item)">
            <el-icon>
              <Edit />
            </el-icon>

          </el-dropdown-item>
          <el-dropdown-item v-if="buttons.includes('viewOnMap')" @click="onViewOnMap(item)">
            <el-icon>
              <Position />
            </el-icon>
          </el-dropdown-item>

          <el-dropdown-item v-if="buttons.includes('review')" @click="onReview(item)">
            <el-icon>
              <View />
            </el-icon>
          </el-dropdown-item>

          <el-dropdown-item v-if="buttons.includes('preview')" @click="onPreview(item)">
            <el-icon>
              <TopRight />
            </el-icon>
          </el-dropdown-item>


          <el-dropdown-item v-if="buttons.includes('delete')" @click="onDelete(item)">
            <el-icon>
              <Delete />
            </el-icon>
          </el-dropdown-item>



          <el-dropdown-item v-if="buttons.includes('download')" @click="onDownload(item)">
            <el-icon>
              <Delete />
            </el-icon>
          </el-dropdown-item>



        </el-dropdown-menu>
      </template>
    </el-dropdown>

  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, watch, defineProps, onUnmounted, PropType } from 'vue';
import { ElButton, ElIcon, ElDropdown, ElDropdownMenu, ElDropdownItem, ElTooltip, ElPopconfirm } from 'element-plus';
import { ArrowDown, Edit, TopRight, Position, Delete, InfoFilled, View, Download } from '@element-plus/icons-vue';

const props = defineProps({
  item: Object,
  buttons: {
    type: Array as PropType<string[]>,
    default: () => []
  },
});

const emit = defineEmits(["edit", "viewOnMap", "review", "preview", "delete", "download",]);


 console.log('Table Actions:::::', props)




watch(
  () => ({
    item: props.item,
    buttons: props.buttons,
  }),
  () => {
    // Watcher for debugging if needed
  },
  { immediate: true }
);

const onEdit = (item) => {
  emit("edit", item);
};

const onViewOnMap = (item) => {
  emit("viewOnMap", item);
};

const onDelete = (item) => {
  emit("delete", item);
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




const isSmallScreen = ref(false);


const handleResize = () => {
  isSmallScreen.value = window.innerWidth <= 768; // Small screen breakpoint
};

onMounted(() => {
  handleResize();
  window.addEventListener("resize", handleResize);
});

onUnmounted(() => {
  window.removeEventListener("resize", handleResize);
});

</script>

<style scoped>
.actions-buttons {
  display: flex;
  gap: 8px;
}
</style>

<style scoped>
.example-showcase .el-dropdown-link {
  cursor: pointer;
  color: var(--el-color-primary);
  display: flex;
  align-items: center;
}
</style>
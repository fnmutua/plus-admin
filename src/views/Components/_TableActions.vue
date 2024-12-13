<template>
  <div>
    <!-- For medium and large screens -->
    <div class="actions-buttons" v-if="!isSmallScreen">
      <el-button v-if="buttons.includes('edit')" size="small" type="primary" @click="onEdit(item)">
        Edit
      </el-button>
      <el-button v-if="buttons.includes('viewOnMap')" size="small" type="info" @click="onViewOnMap(item)">
        View on Map
      </el-button>
      <el-button v-if="buttons.includes('delete')" size="small" type="danger" @click="onDelete(item)">
        Delete
      </el-button>
    </div>

    <!-- For small screens -->
    <el-dropdown v-else>
      <el-button size="small">
        Actions <i class="el-icon-arrow-down el-icon--right"></i>
      </el-button>
      <el-dropdown-menu>
        <el-dropdown-item v-if="buttons.includes('edit')" @click="onEdit(item)">
          Edit
        </el-dropdown-item>
        <el-dropdown-item v-if="buttons.includes('viewOnMap')" @click="onViewOnMap(item)">
          View on Map
        </el-dropdown-item>
        <el-dropdown-item v-if="buttons.includes('delete')" @click="onDelete(item)">
          Delete
        </el-dropdown-item>
      </el-dropdown-menu>
    </el-dropdown>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted } from "vue";
import { ElButton, } from 'element-plus'

export default {
  name: "TableActions",
  props: {
    item: {
      type: Object,
      required: true,
    },
    buttons: {
      type: Array,
      default: () => ["edit", "viewOnMap", "delete"], // Default to all buttons
    },
  },
  setup(props, { emit }) {
    const isSmallScreen = ref(false);

    const handleResize = () => {
      isSmallScreen.value = window.innerWidth <= 768; // Small screen breakpoint
    };

    const onEdit = (item) => {
      emit("edit", item);
    };

    const onViewOnMap = (item) => {
      emit("viewOnMap", item);
    };

    const onDelete = (item) => {
      emit("delete", item);
    };

    onMounted(() => {
      handleResize();
      window.addEventListener("resize", handleResize);
    });

    onUnmounted(() => {
      window.removeEventListener("resize", handleResize);
    });

    return {
      isSmallScreen,
      onEdit,
      onViewOnMap,
      onDelete,
    };
  },
};
</script>

<style scoped>
.actions-buttons {
  display: flex;
  gap: 8px;
}
</style>
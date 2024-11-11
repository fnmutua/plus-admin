<template>
  <div>
    <el-table :data="duplicates" @selection-change="handleSelection">
      <el-table-column type="selection" width="55"></el-table-column>
      <el-table-column prop="id" label="ID" width="100"></el-table-column>
      <el-table-column prop="name" label="Name" width="180"></el-table-column>
      <!-- Add columns as needed -->
    </el-table>
    <el-button type="primary" @click="mergeRecords" :disabled="!primaryRecord">
      Merge Selected Records
    </el-button>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  data() {
    return {
      duplicates: [],
      selectedRecords: [],
      primaryRecord: null,
    };
  },
  methods: {
    async fetchDuplicates() {
      try {
        const response = await axios.get('/api/duplicates', {
          params: { fieldName: 'name' } // Specify field to check for duplicates
        });
        this.duplicates = response.data;
      } catch (error) {
        console.error('Error fetching duplicates:', error);
      }
    },
    handleSelection(selection) {
      // Allow selecting only one primary record at a time
      if (selection.length > 0) {
        this.primaryRecord = selection[0];
        this.selectedRecords = selection.map((record) => record.id).filter((id) => id !== this.primaryRecord.id);
      } else {
        this.primaryRecord = null;
        this.selectedRecords = [];
      }
    },
    async mergeRecords() {
      if (!this.primaryRecord || this.selectedRecords.length === 0) {
        this.$message.error('Please select a primary record and duplicates to merge.');
        return;
      }

      try {
        await axios.post('/api/merge-records', {
          primaryId: this.primaryRecord.id,
          duplicateIds: this.selectedRecords,
        });
        this.$message.success('Records merged successfully.');
        this.fetchDuplicates(); // Refresh duplicates after merging
      } catch (error) {
        console.error('Error merging records:', error);
        this.$message.error('Failed to merge records.');
      }
    }
  },
  created() {
    this.fetchDuplicates(); // Fetch duplicates on component load
  }
};
</script>

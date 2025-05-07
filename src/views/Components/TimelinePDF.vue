<template>
  <div class="timeline-container">
    <h1 class="title">Event Timeline</h1>
    <el-button type="primary" @click="generatePDF" class="generate-btn">
      Generate & Print PDF
    </el-button>

    <!-- PDF Section -->
    <vue3-html2pdf
      ref="html2Pdf"
      :filename="pdfFileName"
      :pdf-quality="2"
      :enable-download="false"
      :preview-modal="false"
      :manual-pagination="true"
      pdf-format="a4"
      pdf-orientation="portrait"
    >
      <section class="pdf-content">
        <h2 class="pdf-title">Project Timeline</h2>

        <el-timeline v-if="events && events.length">
          <el-timeline-item
            v-for="(event, index) in events"
            :key="index"
            :timestamp="formatDate(event.date)"
            placement="top"
            type="primary"
            size="large"
          >
            <el-card shadow="hover" class="event-card">
              <h3 class="event-title">{{ event.event }}</h3>
              <p v-if="event.description" class="event-description">{{ event.description }}</p>
            </el-card>
          </el-timeline-item>
        </el-timeline>

        <p v-else class="no-data">No events provided</p>
      </section>
    </vue3-html2pdf>
  </div>
</template>

<script setup>
import { ref, defineProps } from 'vue'
import Vue3Html2pdf from 'vue3-html2pdf'
import {
  ElButton,
  ElTimeline,
  ElTimelineItem,
  ElCard,
} from 'element-plus'

// Optional: import Element Plus styles (only needed if not globally included)
import 'element-plus/es/components/button/style/css'
import 'element-plus/es/components/timeline/style/css'
import 'element-plus/es/components/timeline-item/style/css'
import 'element-plus/es/components/card/style/css'

// Props
const props = defineProps({
  events: {
    type: Array,
    default: () => [],
    validator: (events) =>
      events.every(
        (event) => typeof event === 'object' && 'date' in event && 'event' in event
      ),
  },
})

// PDF
const html2Pdf = ref(null)
const pdfFileName = 'project-timeline'

const generatePDF = () => {
  if (html2Pdf.value && props.events.length) {
    html2Pdf.value.generatePdf()
  } else {
    alert('No events to generate PDF.')
  }
}

const formatDate = (dateString) => {
  try {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date(dateString))
  } catch {
    return 'Invalid Date'
  }
}
</script>

<style scoped>
.timeline-container {
  padding: 20px;
  max-width: 900px;
  margin: 0 auto;
}

.title {
  font-size: 24px;
  margin-bottom: 20px;
  text-align: center;
}

.generate-btn {
  margin-bottom: 20px;
  display: block;
  margin-left: auto;
  margin-right: auto;
}

.pdf-content {
  padding: 20px;
}

.pdf-title {
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 20px;
  text-align: center;
}

.event-card {
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
}

.event-title {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 8px;
}

.event-description {
  font-size: 14px;
  color: #606266;
}

.no-data {
  text-align: center;
  font-size: 16px;
  color: #909399;
}

:deep(.el-timeline-item__timestamp) {
  font-size: 14px;
  color: #909399;
}

:deep(.el-timeline-item__node--large) {
  width: 16px;
  height: 16px;
}
</style>

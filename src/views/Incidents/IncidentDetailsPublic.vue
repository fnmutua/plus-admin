<script setup lang="ts">
import { onMounted, ref, computed, onUnmounted } from 'vue'
 
import { ElButton, ElDescriptions, ElDescriptionsItem, ElCard, ElMessage, ElEmpty } from 'element-plus'
import { getPublicIncident, getIncidentHistory } from '@/api/incident'
import { getIncidentDocuments, downloadIncidentFile } from '@/api/incident'
import { useRoute, useRouter } from 'vue-router'
import { Download, ArrowRight, Back } from '@element-plus/icons-vue'
import { useAppStore } from '@/store/modules/app'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const appStore = useAppStore()
const route = useRoute()
const router = useRouter()
const { push } = useRouter()
const isMobile = computed(() => appStore.getMobile)

const incident = ref({
  id: null as number | null,
  code: null as string | null,
  reported_by: null as string | null,
  reporter_phone: null as string | null,
  county: null as string | null,
  settlement: null as string | null,
  incident_types: null as string[] | null,
  severity: null as string | null,
  description: null as string | null,
  status: null as string | null,
  location_text: null as string | null,
  date_reported: null as string | null,
  last_action: null as string | null,
  occurred_date: null as string | null,
  occurred_time: null as string | null,
  site_supervisor: null as string | null,
  department: null as string | null,
  worker_name: null as string | null,
  designation: null as string | null,
  mechanisms: null as string[] | null,
  indirect_causes: null as string[] | null,
  direct_causes: null as string[] | null,
  activity_leading: null as string[] | null,
  root_cause: null as string[] | null,
  consequences: null as string | null,
  immediate_action: null as string | null,
  prepared_by_name: null as string | null,
  prepared_by_job_title: null as string | null,
  prepared_by_date: null as string | null,
})

const fullIncidentData = ref<any>()
const incidentHistory = ref<any[]>([])
const incidentFound = ref(true)

// Documentation state
const docsLoading = ref(false)
const docs = ref<any[]>([])

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(date)
}

const formatSentence = (text: string | null) => {
  if (!text) return 'N/A'
  let formattedText = String(text).replace(/_/g, ' ')
  formattedText = formattedText.charAt(0).toUpperCase() + formattedText.slice(1)
  return formattedText
}

const formatArrayForMobile = (arr: any[] | null) => {
  if (!arr || !Array.isArray(arr) || arr.length === 0) return 'N/A'
  if (isMobile.value && arr.length > 2) {
    return arr.slice(0, 2).join(', ') + ` (+${arr.length - 2} more)`
  }
  return arr.join(', ')
}

const formatDateOnly = (dateString: string | null) => {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date)
}

const fetchIncident = async () => {
  try {
    const id = route.params.id
    const res = await getPublicIncident({ id: id as string })

    console.log(res.data)
    if (!res.data || !res.data.incident || !res.data.incident.code) {
      incidentFound.value = false
      return
    }
    
    fullIncidentData.value = res.data
    const incidentData = res.data.incident
    
    incident.value = {
      id: incidentData.id,
      code: incidentData.code,
      reported_by: incidentData.reported_by,
      reporter_phone: incidentData.reporter_phone ? 
        incidentData.reporter_phone.substring(0, 3) + '*****' + incidentData.reporter_phone.substring(incidentData.reporter_phone.length - 2) : 'N/A',
      county: incidentData.county?.name || 'N/A',
      settlement: incidentData.settlement?.name || 'N/A',
      incident_types: incidentData.incident_types,
      severity: incidentData.severity,
      description: incidentData.description,
      status: incidentData.status,
      location_text: incidentData.location_text,
      date_reported: formatDate(incidentData.createdAt),
      last_action: null,
      occurred_date: incidentData.occurred_date,
      occurred_time: incidentData.occurred_time,
      site_supervisor: incidentData.site_supervisor,
      department: incidentData.department,
      worker_name: incidentData.worker_name,
      designation: incidentData.designation,
      mechanisms: incidentData.mechanisms,
      indirect_causes: incidentData.indirect_causes,
      direct_causes: incidentData.direct_causes,
      activity_leading: incidentData.activity_leading,
      root_cause: incidentData.root_cause,
      consequences: incidentData.consequences,
      immediate_action: incidentData.immediate_action,
      prepared_by_name: incidentData.prepared_by_name,
      prepared_by_job_title: incidentData.prepared_by_job_title,
      prepared_by_date: incidentData.prepared_by_date,
    }
    

    console.log('incident.value' ,incident.value )
    incidentHistory.value = res.data.history || []

    // Compute last action
    if (incidentHistory.value.length > 0) {
      const lastLog = incidentHistory.value.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]
      const actionType = formatSentence(lastLog.action)
      const actionDate = formatDate(lastLog.createdAt)
      const officerName = lastLog.user?.name || 'Unknown Officer'
      incident.value.last_action = `${actionType} on ${actionDate} by ${officerName}`
    } else {
      incident.value.last_action = 'N/A'
    }
  } catch (error) {
    incidentFound.value = false
    ElMessage.error('Failed to fetch incident details')
    console.error(error)
  }
}

// History is available but not displayed in the current template
// const sortedIncidentHistory = computed(() => {
//   return incidentHistory.value
//     .map((log: any) => ({
//       ...log,
//       action: log.action === 'status_changed'
//         ? `Status changed to ${log.newValue}`
//         : log.action === 'created'
//           ? 'Incident created'
//           : log.action === 'updated'
//             ? 'Incident updated'
//             : log.action,
//     }))
//     .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
// })

// Documentation functions
const fetchIncidentDocuments = async () => {
  if (!fullIncidentData.value?.incident?.id) return
  docsLoading.value = true
  try {
    const res: any = await getIncidentDocuments({ incident_id: fullIncidentData.value.incident.id })
    if (res && res.code === '0000') {
      docs.value = res.data || []
    }
  } catch (e) {
    ElMessage.error('Failed to load documents')
  } finally {
    docsLoading.value = false
  }
}

const downloadDoc = async (doc: any) => {
  try {
    const res: any = await downloadIncidentFile({ filename: doc.name })
    const blob = new Blob([res as any])
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = doc.name
    document.body.appendChild(a)
    a.click()
    a.remove()
    window.URL.revokeObjectURL(url)
  } catch (e) {
    ElMessage.error('Download failed')
  }
}

const handleDownload = async () => {
  await generatePDF(fullIncidentData.value?.incident)
}

const handleForward = () => {
  const targetPath = `/inc/open`

  push(targetPath).catch(() => {
    push({
      path: '/login',
      query: { redirect: targetPath }
    })
  })
}

// PDF generation function
const generatePDF = async (incidentData: any) => {
  try {
    ElMessage.info('Generating PDF report...')
    
    // Use provided incident data or fallback to fullIncidentData
    const incident = incidentData || fullIncidentData.value?.incident
    if (!incident) {
      throw new Error('No incident data available')
    }
    
    // Ensure documents and history are loaded
    if (docs.value.length === 0) {
      await fetchIncidentDocuments()
    }
    if (incidentHistory.value.length === 0) {
      const res: any = await getIncidentHistory({ incident_id: incident.id })
      if (res && res.code === '0000') {
        incidentHistory.value = res.data || []
      }
    }
    
    const documents = docs.value || []
    const history = incidentHistory.value || []
    
    // Create PDF
    const doc = new jsPDF()
    
    // Set up fonts and colors
    // Get primary color from CSS variables
    const getPrimaryColor = () => {
      const root = document.documentElement
      const primaryColor = getComputedStyle(root).getPropertyValue('--el-color-primary').trim()
      
      if (primaryColor) {
        // Convert hex to RGB
        const hex = primaryColor.replace('#', '')
        const r = parseInt(hex.substr(0, 2), 16)
        const g = parseInt(hex.substr(2, 2), 16)
        const b = parseInt(hex.substr(4, 2), 16)
        return [r, g, b]
      }
      
      // Fallback to default primary color
      return [64, 158, 255] // Element Plus default blue
    }
    
    const primaryColor = getPrimaryColor()
    const lightGray = [236, 240, 241] // #ecf0f1
    
    // Helper function to format dates
    const formatDate = (date: any) => {
      if (!date) return 'N/A'
      const d = new Date(date)
      const day = String(d.getDate()).padStart(2, '0')
      const month = String(d.getMonth() + 1).padStart(2, '0')
      const year = d.getFullYear()
      return `${day}-${month}-${year}`
    }
    
    // Helper function to format time
    const formatTime = (time: any) => {
      if (!time) return 'N/A'
      
      let hours, minutes, ampm
      
      // If it's an ISO datetime string, extract just the time part
      if (typeof time === 'string' && time.includes('T')) {
        const date = new Date(time)
        hours = date.getHours()
        minutes = String(date.getMinutes()).padStart(2, '0')
      }
      // If it's already in HH:MM format, convert to 12-hour
      else if (typeof time === 'string' && time.includes(':')) {
        const [h, m] = time.split(':')
        hours = parseInt(h, 10)
        minutes = m.padStart(2, '0')
      }
      // For Date objects, extract time
      else if (time instanceof Date) {
        hours = time.getHours()
        minutes = String(time.getMinutes()).padStart(2, '0')
      }
      else {
        return time
      }
      
      // Convert to 12-hour format with AM/PM
      let hour12 = hours
      if (hours === 0) {
        hour12 = 12
        ampm = 'AM'
      } else if (hours < 12) {
        hour12 = hours
        ampm = 'AM'
      } else if (hours === 12) {
        hour12 = 12
        ampm = 'PM'
      } else {
        hour12 = hours - 12
        ampm = 'PM'
      }
      
      return `${hour12}:${minutes} ${ampm}`
    }
    
    // Helper function to format datetime
    const formatDateTime = (date: any) => {
      if (!date) return 'N/A'
      const d = new Date(date)
      const day = String(d.getDate()).padStart(2, '0')
      const month = String(d.getMonth() + 1).padStart(2, '0')
      const year = d.getFullYear()
      const hours = d.getHours()
      const minutes = String(d.getMinutes()).padStart(2, '0')
      
      let hour12 = hours
      let ampm = 'AM'
      
      if (hours === 0) {
        hour12 = 12
        ampm = 'AM'
      } else if (hours < 12) {
        hour12 = hours
        ampm = 'AM'
      } else if (hours === 12) {
        hour12 = 12
        ampm = 'PM'
      } else {
        hour12 = hours - 12
        ampm = 'PM'
      }
      
      return `${day}-${month}-${year} ${hour12}:${minutes} ${ampm}`
    }
    
    // Helper function to add text with styling
    const addText = (text: string, x: number, y: number, options: any = {}) => {
      const { fontSize = 10, fontStyle = 'normal', color = [0, 0, 0], align = 'left' } = options
      doc.setFontSize(fontSize)
      doc.setFont('helvetica', fontStyle)
      doc.setTextColor(color[0], color[1], color[2])
      doc.text(text, x, y, { align })
    }

    // Helper function to add line
    const addLine = (x1: number, y1: number, x2: number, y2: number, color = [0, 0, 0], width = 0.5) => {
      doc.setDrawColor(color[0], color[1], color[2])
      doc.setLineWidth(width)
      doc.line(x1, y1, x2, y2)
    }

    // Helper function to add rectangle
    const addRect = (x: number, y: number, width: number, height: number, fillColor: number[] | null = null, strokeColor = [0, 0, 0]) => {
      if (fillColor) {
        doc.setFillColor(fillColor[0], fillColor[1], fillColor[2])
        doc.rect(x, y, width, height, 'F')
      }
      doc.setDrawColor(strokeColor[0], strokeColor[1], strokeColor[2])
      doc.rect(x, y, width, height)
    }

    // Header
    addRect(10, 10, 190, 25, primaryColor)
    addText('INCIDENT REPORT', 105, 20, { fontSize: 16, fontStyle: 'bold', color: [255, 255, 255], align: 'center' })
    addText('Second Kenya Informal Settlement Project - KISIP 2', 105, 26, { fontSize: 10, color: [255, 255, 255], align: 'center' })
    
    // Incident Code and Status
    let yPos = 45
    addText(`Incident Code: ${incident.code || 'N/A'}`, 15, yPos, { fontSize: 12, fontStyle: 'bold', color: primaryColor })
    
    // Status badge
    const statusColor = getPDFStatusColor(incident.status)
    const statusText = getPDFStatusLabel(incident.status)
    addText('Status: ', 120, yPos, { fontSize: 12, fontStyle: 'bold' })
    addText(statusText, 140, yPos, { fontSize: 12, fontStyle: 'bold', color: statusColor })
    
    yPos += 15

    // Basic Information Section
    addText('BASIC INFORMATION', 15, yPos, { fontSize: 14, fontStyle: 'bold', color: primaryColor })
    addLine(15, yPos + 2, 195, yPos + 2, primaryColor, 1)
    yPos += 10

    // Helper function to obscure phone number
    const obscurePhone = (phone: string | null) => {
      if (!phone) return 'N/A'
      return phone.substring(0, 3) + '*****' + phone.substring(phone.length - 2)
    }

    const basicInfo = [
      ['Occurred Date:', formatDate(incident.occurred_date)],
      ['Occurred Time:', formatTime(incident.occurred_time)],
      ['Reported Date:', formatDate(incident.createdAt)],
      ['Location:', incident.location_text || 'N/A'],
      ['Severity:', incident.severity || 'N/A'],
      ['Reported By:', incident.reported_by || 'N/A'],
      ['Reporter Phone:', obscurePhone(incident.reporter_phone)]
    ]

    basicInfo.forEach(([label, value]) => {
      addText(label, 20, yPos, { fontSize: 10, fontStyle: 'bold' })
      addText(value, 80, yPos, { fontSize: 10 })
      yPos += 6
    })

    yPos += 5

    // Worker Details Section
    addText('WORKER DETAILS', 15, yPos, { fontSize: 14, fontStyle: 'bold', color: primaryColor })
    addLine(15, yPos + 2, 195, yPos + 2, primaryColor, 1)
    yPos += 10

    const workerInfo = [
      ['Worker Name:', incident.worker_name || 'N/A'],
      ['Designation:', incident.designation || 'N/A'],
      ['Site Supervisor:', incident.site_supervisor || 'N/A'],
      ['Department:', incident.department || 'N/A']
    ]

    workerInfo.forEach(([label, value]) => {
      addText(label, 20, yPos, { fontSize: 10, fontStyle: 'bold' })
      addText(value, 80, yPos, { fontSize: 10 })
      yPos += 6
    })

    yPos += 5

    // Check if we need a new page for incident details (leave space for footer)
    if (yPos > 200) {
      doc.addPage()
      yPos = 20
    }

    // Incident Categories Section
    addText('INCIDENT DETAILS', 15, yPos, { fontSize: 14, fontStyle: 'bold', color: primaryColor })
    addLine(15, yPos + 2, 195, yPos + 2, primaryColor, 1)
    yPos += 10

    // Incident Types
    if (incident.incident_types && incident.incident_types.length > 0) {
      addText('Incident Types:', 20, yPos, { fontSize: 10, fontStyle: 'bold' })
      yPos += 6
      incident.incident_types.forEach((type: string) => {
        addText(`• ${type}`, 25, yPos, { fontSize: 9 })
        yPos += 5
      })
      yPos += 3
    }

    // Mechanisms
    if (incident.mechanisms && incident.mechanisms.length > 0) {
      addText('Mechanisms:', 20, yPos, { fontSize: 10, fontStyle: 'bold' })
      yPos += 6
      incident.mechanisms.forEach((mechanism: string) => {
        addText(`• ${mechanism}`, 25, yPos, { fontSize: 9 })
        yPos += 5
      })
      yPos += 3
    }

    // Causes
    if (incident.direct_causes && incident.direct_causes.length > 0) {
      addText('Direct Causes:', 20, yPos, { fontSize: 10, fontStyle: 'bold' })
      yPos += 6
      incident.direct_causes.forEach((cause: string) => {
        addText(`• ${cause}`, 25, yPos, { fontSize: 9 })
        yPos += 5
      })
      yPos += 3
    }

    if (incident.indirect_causes && incident.indirect_causes.length > 0) {
      addText('Indirect Causes:', 20, yPos, { fontSize: 10, fontStyle: 'bold' })
      yPos += 6
      incident.indirect_causes.forEach((cause: string) => {
        addText(`• ${cause}`, 25, yPos, { fontSize: 9 })
        yPos += 5
      })
      yPos += 3
    }

    if (incident.root_cause && incident.root_cause.length > 0) {
      addText('Root Causes:', 20, yPos, { fontSize: 10, fontStyle: 'bold' })
      yPos += 6
      incident.root_cause.forEach((cause: string) => {
        addText(`• ${cause}`, 25, yPos, { fontSize: 9 })
        yPos += 5
      })
      yPos += 3
    }

    // Check if we need a new page
    if (yPos > 200) {
      doc.addPage()
      yPos = 20
    }

    // Check if we need a new page for narrative (leave space for footer)
    if (yPos > 200) {
      doc.addPage()
      yPos = 20
    }

    // Narrative Section
    addText('NARRATIVE', 15, yPos, { fontSize: 14, fontStyle: 'bold', color: primaryColor })
    addLine(15, yPos + 2, 195, yPos + 2, primaryColor, 1)
    yPos += 10

    if (incident.description) {
      addText('Description:', 20, yPos, { fontSize: 10, fontStyle: 'bold' })
      yPos += 6
      const descriptionLines = doc.splitTextToSize(incident.description, 170)
      doc.text(descriptionLines, 20, yPos)
      yPos += descriptionLines.length * 4 + 5
    }

    if (incident.consequences) {
      addText('Consequences:', 20, yPos, { fontSize: 10, fontStyle: 'bold' })
      yPos += 6
      const consequencesLines = doc.splitTextToSize(incident.consequences, 170)
      doc.text(consequencesLines, 20, yPos)
      yPos += consequencesLines.length * 4 + 5
    }

    if (incident.immediate_action) {
      addText('Immediate Action:', 20, yPos, { fontSize: 10, fontStyle: 'bold' })
      yPos += 6
      const actionLines = doc.splitTextToSize(incident.immediate_action, 170)
      doc.text(actionLines, 20, yPos)
      yPos += actionLines.length * 4 + 5
    }

    // Check if we need a new page for actions (leave space for footer)
    if (yPos > 200) {
      doc.addPage()
      yPos = 20
    }

    // Actions to Avoid Section
    if (incident.actions_to_avoid && incident.actions_to_avoid.length > 0) {
      addText('ACTIONS TAKEN', 15, yPos, { fontSize: 14, fontStyle: 'bold', color: primaryColor })
      addLine(15, yPos + 2, 195, yPos + 2, primaryColor, 1)
      yPos += 10

      // Create table for actions
      const actionsData = incident.actions_to_avoid.map((action: any, index: number) => [
        index + 1,
        action.action || 'N/A',
        action.responsible || 'N/A',
        action.priority || 'N/A',
        action.due_date || 'N/A'
      ])

      autoTable(doc, {
        head: [['#', 'Action', 'Responsible', 'Priority', 'Due Date']],
        body: actionsData,
        startY: yPos,
        styles: { fontSize: 8 },
        headStyles: { fillColor: primaryColor as [number, number, number], textColor: [255, 255, 255], fontStyle: 'bold' },
        alternateRowStyles: { fillColor: lightGray as [number, number, number] },
        margin: { left: 15, right: 15 }
      })

      yPos = (doc as any).lastAutoTable.finalY + 10
    }

    // Check if we need a new page for documents (leave space for footer)
    if (yPos > 200) {
      doc.addPage()
      yPos = 20
    }

    // Documents Section
    if (documents && documents.length > 0) {
      addText('ATTACHED DOCUMENTS', 15, yPos, { fontSize: 14, fontStyle: 'bold', color: primaryColor })
      addLine(15, yPos + 2, 195, yPos + 2, primaryColor, 1)
      yPos += 10

      const docsData = documents.map((doc: any, index: number) => [
        index + 1,
        doc.name || 'N/A',
        doc.type || 'N/A',
        doc.format || 'N/A',
        doc.size ? `${doc.size} MB` : 'N/A'
      ])

      autoTable(doc, {
        head: [['#', 'File Name', 'Type', 'Format', 'Size']],
        body: docsData,
        startY: yPos,
        styles: { fontSize: 8 },
        headStyles: { fillColor: primaryColor as [number, number, number], textColor: [255, 255, 255], fontStyle: 'bold' },
        alternateRowStyles: { fillColor: lightGray as [number, number, number] },
        margin: { left: 15, right: 15 }
      })

      yPos = (doc as any).lastAutoTable.finalY + 10
    }

    // Check if we need a new page for history (leave space for footer)
    if (yPos > 200) {
      doc.addPage()
      yPos = 20
    }

    // History Section
    if (history && history.length > 0) {
      addText('CHANGE HISTORY', 15, yPos, { fontSize: 14, fontStyle: 'bold', color: primaryColor })
      addLine(15, yPos + 2, 195, yPos + 2, primaryColor, 1)
      yPos += 10

      const historyData = history.slice(0, 10).map((item: any, index: number) => [
        index + 1,
        item.action || 'N/A',
        item.changed_by_name || item.changedByName || 'System',
        formatDateTime(item.createdAt),
        item.change_reason || item.field_name || 'N/A'
      ])

      autoTable(doc, {
        head: [['#', 'Action', 'Changed By', 'Date', 'Details']],
        body: historyData,
        startY: yPos,
        styles: { fontSize: 8 },
        headStyles: { fillColor: primaryColor as [number, number, number], textColor: [255, 255, 255], fontStyle: 'bold' },
        alternateRowStyles: { fillColor: lightGray as [number, number, number] },
        margin: { left: 15, right: 15 }
      })

      yPos = (doc as any).lastAutoTable.finalY + 10
    }

    // Footer
    const pageCount = (doc as any).internal.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i)
      
      // Footer separator line
      addLine(10, 275, 200, 275, [200, 200, 200], 0.5)
      
      // Footer content
      addText(`Page ${i} of ${pageCount}`, 105, 285, { fontSize: 9, color: [64, 64, 64], align: 'center' })
      addText(`Generated on ${formatDateTime(new Date())}`, 15, 285, { fontSize: 9, color: [64, 64, 64] })
      addText('KeSMIS - Incident Management System', 15, 290, { fontSize: 8, color: [102, 102, 102] })
    }

    // Save the PDF
    doc.save(`incident-report-${incident.code}.pdf`)
    
    ElMessage.success('PDF report downloaded successfully')
  } catch (e) {
    console.error('PDF generation error:', e)
    ElMessage.error('Failed to generate PDF report')
  }
}

// Helper functions for PDF generation
const getPDFStatusColor = (status: string): [number, number, number] => {
  const colors: { [key: string]: [number, number, number] } = {
    'open': [231, 76, 60],
    'under_investigation': [243, 156, 18],
    'action_required': [243, 156, 18],
    'in_progress': [52, 152, 219],
    'resolved': [39, 174, 96],
    'closed': [149, 165, 166]
  }
  return colors[status] || [149, 165, 166]
}

const getPDFStatusLabel = (status: string) => {
  const labels: { [key: string]: string } = {
    'open': 'Open',
    'under_investigation': 'Under Investigation',
    'action_required': 'Action Required',
    'in_progress': 'In Progress',
    'resolved': 'Resolved',
    'closed': 'Closed'
  }
  return labels[status] || status || 'Open'
}

const goBack = () => {
  router.back()
}

const columns = ref(1)
const descriptionDirection = ref<'horizontal' | 'vertical'>('horizontal')

const updateColumns = () => {
  columns.value = window.innerWidth >= 640 ? 2 : 1
  descriptionDirection.value = window.innerWidth >= 640 ? 'horizontal' : 'vertical'
}

onMounted(() => {
  fetchIncident()
  updateColumns()
  window.addEventListener('resize', updateColumns)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateColumns)
})

</script>

<template>
<div class="bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white transition-colors duration-300 px-4 sm:px-6 min-h-screen overflow-y-auto">
  <Transition name="fade">
    <el-card class="container mx-auto my-4 sm:my-4 p-4 sm:p-6 max-w-full sm:max-w-4xl mb-8">
      <template #header>
        <div class="flex flex-col space-y-3">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-3">
              <img src="/gok.png" alt="Logo" class="w-8 h-8 sm:w-12 sm:h-12" />
              <div>
                <h2 v-if="incidentFound" class="text-lg sm:text-2xl font-bold leading-tight">
                  {{ incident.code }}
                </h2>
                <h2 v-else class="text-lg sm:text-2xl font-bold">
                  Incident Not Found
                </h2>
              </div>
            </div>
            <el-button type="primary" plain :icon="Back" @click="goBack" class="w-auto">
              Back
            </el-button>
          </div>
          <div v-if="incidentFound" class="text-sm text-gray-600 dark:text-gray-400">
            Reported by: {{ incident.reported_by }}
          </div>
        </div>
      </template>

      <div v-if="incidentFound">
        <el-descriptions
          title="Incident Details"
          :column="isMobile ? 1 : 2"
          border
          :direction="descriptionDirection"
          class="mt-6"
        >
          <el-descriptions-item label="Code">
            {{ incident.code || 'N/A' }}
          </el-descriptions-item>
          <el-descriptions-item label="Reported By">
            {{ incident.reported_by || 'N/A' }}
          </el-descriptions-item>
          <el-descriptions-item label="Phone">
            {{ incident.reporter_phone || 'N/A' }}
          </el-descriptions-item>
          <el-descriptions-item label="County">
            {{ formatSentence(incident.county) }}
          </el-descriptions-item>
          <el-descriptions-item label="Settlement">
            {{ formatSentence(incident.settlement) }}
          </el-descriptions-item>
          <el-descriptions-item label="Incident Types">
            {{ formatArrayForMobile(incident.incident_types) }}
          </el-descriptions-item>
          <el-descriptions-item label="Severity">
            {{ formatSentence(incident.severity) }}
          </el-descriptions-item>
          <el-descriptions-item label="Status">
            {{ formatSentence(incident.status) }}
          </el-descriptions-item>
          <el-descriptions-item label="Occurred Date">
            {{ formatDateOnly(incident.occurred_date) }}
          </el-descriptions-item>
          <el-descriptions-item label="Occurred Time">
            {{ incident.occurred_time || 'N/A' }}
          </el-descriptions-item>
          <el-descriptions-item label="Site Supervisor">
            {{ incident.site_supervisor || 'N/A' }}
          </el-descriptions-item>
          <el-descriptions-item label="Department">
            {{ incident.department || 'N/A' }}
          </el-descriptions-item>
          <el-descriptions-item label="Worker Name">
            {{ incident.worker_name || 'N/A' }}
          </el-descriptions-item>
          <el-descriptions-item label="Designation">
            {{ incident.designation || 'N/A' }}
          </el-descriptions-item>
          <el-descriptions-item label="Mechanisms">
            {{ formatArrayForMobile(incident.mechanisms) }}
          </el-descriptions-item>
          <el-descriptions-item label="Direct Causes">
            {{ formatArrayForMobile(incident.direct_causes) }}
          </el-descriptions-item>
          <el-descriptions-item label="Indirect Causes">
            {{ formatArrayForMobile(incident.indirect_causes) }}
          </el-descriptions-item>
          <el-descriptions-item label="Activity Leading">
            {{ formatArrayForMobile(incident.activity_leading) }}
          </el-descriptions-item>
          <el-descriptions-item label="Root Cause">
            {{ formatArrayForMobile(incident.root_cause) }}
          </el-descriptions-item>
          <el-descriptions-item :span="isMobile ? 1 : 2" label="Description">
            <div class="break-words whitespace-pre-wrap">{{ incident.description || 'N/A' }}</div>
          </el-descriptions-item>
          <el-descriptions-item :span="isMobile ? 1 : 2" label="Consequences">
            <div class="break-words whitespace-pre-wrap">{{ incident.consequences || 'N/A' }}</div>
          </el-descriptions-item>
          <el-descriptions-item :span="isMobile ? 1 : 2" label="Immediate Action">
            <div class="break-words whitespace-pre-wrap">{{ incident.immediate_action || 'N/A' }}</div>
          </el-descriptions-item>
          <el-descriptions-item :span="isMobile ? 1 : 2" label="Location">
            <div class="break-words whitespace-pre-wrap">{{ incident.location_text || 'N/A' }}</div>
          </el-descriptions-item>
          <el-descriptions-item label="Prepared By">
            {{ incident.prepared_by_name || 'N/A' }}
          </el-descriptions-item>
          <el-descriptions-item label="Job Title">
            {{ incident.prepared_by_job_title || 'N/A' }}
          </el-descriptions-item>
          <el-descriptions-item label="Prepared Date">
            {{ formatDateOnly(incident.prepared_by_date) }}
          </el-descriptions-item>
          <el-descriptions-item label="Date Reported">
            {{ incident.date_reported }}
          </el-descriptions-item>
          <el-descriptions-item :span="isMobile ? 1 : 2" label="Last Action">
            <div class="break-words whitespace-pre-wrap">{{ incident.last_action || 'N/A' }}</div>
          </el-descriptions-item>

          <el-descriptions-item :span="isMobile ? 1 : 2" label="Action">
            <div class="flex space-x-2 items-center">
              <el-button
                type="primary"
                plain
                :icon="Download"
                @click="handleDownload"
                class="flex-1 sm:flex-none text-xs sm:text-sm h-8 sm:h-10"
                size="small"
              >
                Download
              </el-button>
              <el-button
                type="success"
                plain
                :icon="ArrowRight"
                @click="handleForward"
                class="flex-1 sm:flex-none text-xs sm:text-sm h-8 sm:h-10"
                size="small"
              >
                Review
              </el-button>
            </div>
          </el-descriptions-item>
        </el-descriptions>
      </div>

      <el-empty
        v-else
        description="The incident you're looking for doesn't exist or is unavailable."
        class="mt-6"
      >
        <el-button type="primary" plain :icon="Back" @click="goBack">
          Go Back
        </el-button>
      </el-empty>
    </el-card>
  </Transition>
</div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.el-descriptions :deep(.el-descriptions__header) {
  @apply text-2xl font-semibold mb-4 text-gray-900 dark:text-white;
}

.el-descriptions :deep(.el-descriptions__body) {
  @apply bg-white dark:bg-gray-800 rounded-lg shadow-md;
}

.el-descriptions :deep(.el-descriptions__label) {
  @apply font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700;
}

.el-descriptions :deep(.el-descriptions__content) {
  @apply text-gray-900 dark:text-white;
}

.el-empty {
  @apply bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 text-gray-900 dark:text-white;
}

@media (max-width: 640px) {
  .el-card {
    @apply mx-2 my-2;
  }
  
  .el-descriptions {
    @apply block;
  }
  .el-descriptions :deep(.el-descriptions__body) {
    @apply flex flex-col;
  }
  .el-descriptions :deep(.el-descriptions__label),
  .el-descriptions :deep(.el-descriptions__content) {
    @apply w-full;
  }
  
  .el-descriptions :deep(.el-descriptions__label) {
    @apply text-sm font-medium text-gray-600 dark:text-gray-400 mb-1;
  }
  
  .el-descriptions :deep(.el-descriptions__content) {
    @apply text-sm text-gray-900 dark:text-white mb-3;
  }
  
  .el-descriptions :deep(.el-descriptions__body) {
    max-height: 60vh;
    overflow-y: auto;
    padding: 0.75rem;
    padding-bottom: 1.5rem;
  }
}

@media (min-width: 641px) {
  .el-descriptions :deep(.el-descriptions__body) {
    max-height: 70vh;
    overflow-y: auto;
    padding: 1rem;
    padding-bottom: 1.5rem;
    scrollbar-width: thin;
    scrollbar-color: #cbd5e0 #f7fafc;
  }
  
  .el-descriptions :deep(.el-descriptions__body)::-webkit-scrollbar {
    width: 6px;
  }
  
  .el-descriptions :deep(.el-descriptions__body)::-webkit-scrollbar-track {
    background: #f7fafc;
    border-radius: 3px;
  }
  
  .el-descriptions :deep(.el-descriptions__body)::-webkit-scrollbar-thumb {
    background: #cbd5e0;
    border-radius: 3px;
  }
  
  .el-descriptions :deep(.el-descriptions__body)::-webkit-scrollbar-thumb:hover {
    background: #a0aec0;
  }
  
  .el-descriptions :deep(.el-descriptions__item) {
    @apply border-b border-gray-200 dark:border-gray-700 pb-2 mb-2;
  }
  
  .el-descriptions :deep(.el-descriptions__item:last-child) {
    @apply border-b-0 mb-0;
  }
  
  .el-descriptions :deep(.el-descriptions__item:last-child .el-descriptions__content) {
    @apply mb-0;
  }
}

.el-descriptions :deep(.el-descriptions__body) {
  @apply bg-white dark:bg-gray-800 rounded-lg shadow-md;
}
</style>

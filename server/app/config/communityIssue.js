/** Community issue report taxonomy (not grievance). */

const ISSUE_TYPES = [
  { value: 'om_water', label: 'Water' },
  { value: 'om_sanitation', label: 'Sanitation' },
  { value: 'om_roads', label: 'Roads / access' },
  { value: 'om_power_lighting', label: 'Power / lighting' },
  { value: 'om_waste', label: 'Waste' },
  { value: 'safety_hazard', label: 'Safety hazard' },
  { value: 'environmental', label: 'Environmental' },
  { value: 'public_space', label: 'Public space / facility' },
  { value: 'project_intervention', label: 'Project / intervention' },
  { value: 'other', label: 'Other' },
]

const SEVERITIES = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
]

const STATUSES = [
  { value: 'Submitted', label: 'Submitted' },
  { value: 'Acknowledged', label: 'Acknowledged' },
  { value: 'InProgress', label: 'In progress' },
  { value: 'Resolved', label: 'Resolved' },
  { value: 'Rejected', label: 'Rejected' },
  { value: 'Closed', label: 'Closed' },
]

const APPROVAL_STATUSES = ['Pending', 'Approved', 'Rejected']

const ISSUE_TYPE_VALUES = new Set(ISSUE_TYPES.map((item) => item.value))
const SEVERITY_VALUES = new Set(SEVERITIES.map((item) => item.value))
const STATUS_VALUES = new Set(STATUSES.map((item) => item.value))

module.exports = {
  ISSUE_TYPES,
  SEVERITIES,
  STATUSES,
  APPROVAL_STATUSES,
  ISSUE_TYPE_VALUES,
  SEVERITY_VALUES,
  STATUS_VALUES,
}

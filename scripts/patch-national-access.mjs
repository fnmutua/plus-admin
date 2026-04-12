import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')

const importLine = "import { userHasPrivilegedNationalLocation } from '@/utils/roleScope'"
const oldBlock = `const hasNationalAccess = computed(() => {
  return userInfo?.roles?.some((role: any) => 
    role.user_roles?.location_level === 'national'
  ) || false
})`
const newBlock = `const hasNationalAccess = computed(() => userHasPrivilegedNationalLocation(userInfo?.roles))`
const oldBlockSemi = `const hasNationalAccess = computed(() => {
  return userInfo?.roles?.some((role: any) => 
    role.user_roles?.location_level === 'national'
  ) || false;
});`
const newBlockSemi = `const hasNationalAccess = computed(() => userHasPrivilegedNationalLocation(userInfo?.roles));`
const oldBlockCurrentUser = `const hasNationalAccess = computed(() => {
  return currentUser.value?.roles?.some((role: any) => 
    role.user_roles?.location_level === 'national'
  ) || false
})`
const newBlockCurrentUser = `const hasNationalAccess = computed(() => userHasPrivilegedNationalLocation(currentUser.value?.roles))`
const oneLiner =
  'const hasNationalAccess = computed(() => userInfo?.roles?.some((role: any) => role.user_roles?.location_level === \'national\') || false)'
const newOne =
  'const hasNationalAccess = computed(() => userHasPrivilegedNationalLocation(userInfo?.roles))'

const files = [
  'src/views/ImportData/Document.vue',
  'src/views/Settlement/AddSettlementNew.vue',
  'src/views/Dashboard/ProjectMapOptimized.vue',
  'src/views/Dashboard/LandingMapOptimized.vue',
  'src/views/Facilities/Water/Water.vue',
  'src/views/Facilities/Sewer/Sewer.vue',
  'src/views/Facilities/Roads/Roads.vue',
  'src/views/Facilities/PipedWater/PipedWater.vue',
  'src/views/Facilities/Other/Other.vue',
  'src/views/Facilities/Health/Health.vue',
  'src/views/Facilities/Education/Education.vue',
  'src/views/Facilities/AddFacility.vue',
  'src/views/Indicators/indicator_category_report.vue',
  'src/views/Indicators/indicator_category_report_new.vue',
  'src/views/Incidents/Open.vue',
  'src/views/Dashboard/ProjectMap.vue',
  'src/views/Dashboard/LandingMap.vue',
  'src/views/Facilities/Water/AddWaterNew.vue',
  'src/views/Facilities/Sewer/AddSewerNew.vue',
  'src/views/Facilities/Roads/AddRoadNew.vue',
  'src/views/Facilities/PipedWater/AddPipedWaterNew.vue',
  'src/views/Facilities/Health/AddHealthNew.vue',
  'src/views/Facilities/Education/AddEducationNew.vue',
]
const oneLiners = [
  'src/views/Facilities/Others/Railway.vue',
  'src/views/Facilities/Others/Police.vue',
  'src/views/Facilities/Others/Mast.vue',
  'src/views/Facilities/Others/Hazards.vue',
  'src/views/Facilities/Others/CrimeHotspots.vue',
  'src/views/Facilities/Others/CommunityProjects.vue',
  'src/views/Facilities/Others/CommunityHall.vue',
  'src/views/Facilities/Lighting/Streetlight.vue',
  'src/views/Facilities/Lighting/Powerline.vue',
  'src/views/Facilities/Lighting/Highmast.vue',
]

function normalizeNewlines(s) {
  return s.replace(/\r\n/g, '\n')
}

function addImport(content) {
  if (content.includes(importLine)) return content
  const hooks = "import { useCache } from '@/hooks/web/useCache'"
  const utils = "import { useCache } from '@/utils/useCache'"
  let idx = content.indexOf(hooks)
  let needle = hooks
  if (idx === -1) {
    idx = content.indexOf(utils)
    needle = utils
  }
  if (idx === -1) return content
  const end = idx + needle.length
  return content.slice(0, end) + '\n' + importLine + content.slice(end)
}

for (const f of files) {
  const p = path.join(root, f)
  let c = normalizeNewlines(fs.readFileSync(p, 'utf8'))
  let changed = false
  if (c.includes(oldBlock)) {
    c = c.replace(oldBlock, newBlock)
    changed = true
  } else if (c.includes(oldBlockSemi)) {
    c = c.replace(oldBlockSemi, newBlockSemi)
    changed = true
  } else if (c.includes(oldBlockCurrentUser)) {
    c = c.replace(oldBlockCurrentUser, newBlockCurrentUser)
    changed = true
  }
  if (changed) {
    c = addImport(c)
    fs.writeFileSync(p, c)
    console.log('patched', f)
  } else {
    console.log('SKIP', f)
  }
}

for (const f of oneLiners) {
  const p = path.join(root, f)
  let c = normalizeNewlines(fs.readFileSync(p, 'utf8'))
  if (!c.includes(oneLiner)) {
    console.log('SKIP one', f)
    continue
  }
  c = c.replace(oneLiner, newOne)
  c = addImport(c)
  fs.writeFileSync(p, c)
  console.log('patched one', f)
}

const img = path.join(root, 'src/views/Repository/Imagery.vue')
let ic = normalizeNewlines(fs.readFileSync(img, 'utf8'))
if (ic.includes(oldBlockSemi)) {
  ic = ic.replace(oldBlockSemi, newBlockSemi)
  ic = addImport(ic)
  fs.writeFileSync(img, ic)
  console.log('patched Imagery')
}

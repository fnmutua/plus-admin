<template>
  <div class="climate-assessment-container">
    <ElCard class="assessment-card">
      <template #header>
        <div class="card-header">
          <div class="header-top">
            <ElButton type="primary" plain :icon="Back" size="small" style="margin-right: 10px;" @click="goBack">
              Back
            </ElButton>
            <h2>Climate Risk & Vulnerability Assessment (Tool B)</h2>
            <ElButton type="info" plain :icon="InfoFilled" @click="infoDrawerOpen = true">
              Score Interpretation
            </ElButton>
          </div>
          <p v-if="countyName || settlementName || assessorName" class="context-name">
            County: {{ countyName || '—' }} | Settlement: {{ settlementName || '—' }} | Assessor: {{ assessorName || '—' }}
          </p>
        </div>
      </template>

      <div v-loading="loading" class="assessment-content">
        <template v-if="assessment">
          <ElTabs v-model="activeTab" type="border-card" class="assessment-tabs">
            <!-- How To tab (first) -->
            <ElTabPane name="howto" label="Instructions">
              <div class="tab-content methodology-content">
                <h3 class="method-heading">
                  <ElIcon><Document /></ElIcon>
                  KISIP Tool B — Scoring Methodology
                </h3>
                <p class="method-intro">
                  This assessment follows the <strong>KISIP RVAT (Risk &amp; Vulnerability Assessment Tool)</strong> Excel methodology.
                  Every question is scored on a <strong>1 – 3 scale</strong>. The final Vulnerability and Risk ratings are computed
                  from cross-dimensional formulas described below.
                </p>

                <!-- Scale -->
                <div class="method-section">
                  <h4 class="method-subheading">Per-Question Scoring Scale</h4>
                  <ElTable :data="scaleTableData" border size="small" class="method-table">
                    <ElTableColumn prop="score" label="Score" width="80" align="center" />
                    <ElTableColumn prop="meaning" label="Meaning" />
                  </ElTable>
                  <p class="method-note">
                    <strong>Note:</strong> Adaptive Capacity uses <em>inverted</em> polarity —
                    <strong>3 = Good</strong> capacity (positive), <strong>1 = Poor</strong> capacity. All other dimensions treat 3 as the most severe/exposed/sensitive.
                  </p>
                </div>

                <!-- Dimensions -->
                <div class="method-section">
                  <h4 class="method-subheading">Dimension Scores</h4>
                  <p>Each dimension score is the <strong>simple average</strong> of all per-question scores within that dimension (range 1.00 – 3.00).</p>
                  <ElTable :data="dimensionTableData" border size="small" class="method-table">
                    <ElTableColumn prop="dimension" label="Dimension" width="180" />
                    <ElTableColumn prop="formula" label="Formula" />
                    <ElTableColumn prop="interpretation" label="Interpretation" />
                  </ElTable>
                </div>

                <!-- Vulnerability -->
                <div class="method-section">
                  <h4 class="method-subheading">
                    <ElIcon class="method-icon vuln"><WarningFilled /></ElIcon>
                    Vulnerability
                  </h4>
                  <div class="method-formula-box">
                    <code>Vulnerability = AVG(Sensitivity) − AVG(Adaptive Capacity)</code>
                  </div>
                  <p>Range: <strong>−2</strong> to <strong>+2</strong>. A negative value means adaptive capacity outweighs sensitivity (good). A positive value means the community is vulnerable.</p>
                  <ElTable :data="vulnThresholdData" border size="small" class="method-table">
                    <ElTableColumn prop="rating" label="Rating" width="120" align="center" />
                    <ElTableColumn prop="range" label="Score Range" width="160" align="center" />
                    <ElTableColumn prop="meaning" label="Meaning" />
                  </ElTable>
                  <p class="method-note">
                    <strong>Category-level vulnerability</strong> is also computed per sub-category:<br />
                    <code>Category Vulnerability = AVG(Sensitivity<sub>cat</sub>) − AVG(Adaptive Capacity<sub>cat</sub>)</code>
                  </p>
                </div>

                <!-- Risk -->
                <div class="method-section">
                  <h4 class="method-subheading">
                    <ElIcon class="method-icon risk"><WarningFilled /></ElIcon>
                    Risk
                  </h4>
                  <div class="method-formula-box">
                    <code>Risk = AVG(Hazard) + ( Exposure × NormVuln ) / 3</code>
                  </div>
                  <p>where <code>NormVuln = (Vulnerability + 3) / 2</code>, which normalises the −2…+2 vulnerability range into a 0.5…2.5 positive multiplier.</p>
                  <ElTable :data="riskThresholdData" border size="small" class="method-table">
                    <ElTableColumn prop="rating" label="Rating" width="120" align="center" />
                    <ElTableColumn prop="range" label="Score Range" width="160" align="center" />
                    <ElTableColumn prop="meaning" label="Meaning" />
                  </ElTable>
                  <p class="method-note">
                    <strong>Category-level risk</strong> = AVERAGE of all subcategory risk scores.
                  </p>
                </div>

                <!-- Recommendations -->
                <div class="method-section">
                  <h4 class="method-subheading">Flagging &amp; Recommendations</h4>
                  <p>
                    Subcategories rated <ElTag type="danger" size="small">High</ElTag> are automatically flagged on the
                    Responses sheet. The Excel recommends addressing these through:
                  </p>
                  <ul class="method-list">
                    <li><strong>Planning</strong> — integrate findings into settlement/county planning</li>
                    <li><strong>Designs</strong> — climate-proof infrastructure designs for the settlement</li>
                    <li><strong>Community Development Plan</strong> — community-level adaptation and resilience actions</li>
                  </ul>
                </div>

                <!-- Workflow -->
                <div class="method-section">
                  <h4 class="method-subheading">Workflow</h4>
                  <ol class="method-list">
                    <li>Complete all questions across <strong>Hazard</strong>, <strong>Exposure</strong>, <strong>Sensitivity</strong>, and <strong>Adaptive Capacity</strong> tabs.</li>
                    <li>Click <strong>"Save &amp; Compute Scores"</strong> — the system calculates dimension averages, vulnerability, and risk.</li>
                    <li>Review the <strong>Overall</strong> tab for summary scores and ratings.</li>
                    <li>Address any <ElTag type="danger" size="small">High</ElTag> rated dimensions through appropriate planning interventions.</li>
                  </ol>
                </div>
              </div>
            </ElTabPane>

            <!-- Dimension tabs -->
            <ElTabPane
              v-for="dim in dimensions"
              :key="dim"
              :name="dim"
              :label="tabLabels[dim]"
            >
              <div class="tab-content">
                <ElCollapse v-model="activeCategoryByTab[dim]" accordion>
                    <ElCollapseItem
                      v-for="cat in (questionsConfig?.[dim]?.categories || [])"
                      :key="cat.key"
                      :name="cat.key"
                    >
                      <template #title>
                        <span class="collapse-title">{{ cat.label }}</span>
                        <span class="collapse-count">
                          {{ answeredCount(dim, cat) }}/{{ (cat.questions || []).length }}
                        </span>
                      </template>
                      <div class="questions-compact">
                        <div
                          v-for="q in (cat.questions || [])"
                          :key="q.key"
                          class="question-inline"
                        >
                          <div class="q-text">
                            <span class="q-label">{{ q.label }}</span>
                            <span v-if="q.hint" class="q-hint">{{ q.hint }}</span>
                          </div>
                          <ElSelect
                            v-model="responses[dim][q.key]"
                            placeholder="Select"
                            clearable
                            size="small"
                            class="q-select"
                            @change="debouncedSave"
                          >
                            <ElOption
                              v-for="(_, opt) in q.answers"
                              :key="opt"
                              :label="opt"
                              :value="opt"
                            />
                          </ElSelect>
                        </div>
                      </div>
                    </ElCollapseItem>
                  </ElCollapse>
              </div>
            </ElTabPane>

            <!-- Overall Score tab -->
            <ElTabPane name="overall" :label="overallTabLabel">
              <div class="tab-content overall-score-content">
                <div class="scores-grid" v-if="assessment.vulnerability_rating || assessment.risk_rating">
                  <ElRow :gutter="12">
                    <ElCol :xs="12" :sm="12" :md="6">
                      <div :class="['score-card', 'score-card-hazard', scoreLevel('hazard', assessment.hazard_score)]" role="button" tabindex="0" @click="activeTab = 'hazard'" @keydown.enter="activeTab = 'hazard'">
                        <ElStatistic :value="dimScoreNum(assessment.hazard_score)" :precision="2">
                          <template #title>
                            <ElIcon class="score-icon"><Lightning /></ElIcon>
                            <span>Hazard</span>
                          </template>
                          <template #suffix>
                            <span class="score-range">/ 3</span>
                          </template>
                        </ElStatistic>
                        <span class="score-range-line"><span class="range-best">1 best</span> · <span class="range-worst">3 worst</span></span>
                      </div>
                    </ElCol>
                    <ElCol :xs="12" :sm="12" :md="6">
                      <div :class="['score-card', 'score-card-exposure', scoreLevel('exposure', assessment.exposure_score)]" role="button" tabindex="0" @click="activeTab = 'exposure'" @keydown.enter="activeTab = 'exposure'">
                        <ElStatistic :value="dimScoreNum(assessment.exposure_score)" :precision="2">
                          <template #title>
                            <ElIcon class="score-icon"><Location /></ElIcon>
                            <span>Exposure</span>
                          </template>
                          <template #suffix>
                            <span class="score-range">/ 3</span>
                          </template>
                        </ElStatistic>
                        <span class="score-range-line"><span class="range-best">1 best</span> · <span class="range-worst">3 worst</span></span>
                      </div>
                    </ElCol>
                    <ElCol :xs="12" :sm="12" :md="6">
                      <div :class="['score-card', 'score-card-sensitivity', scoreLevel('sensitivity', assessment.sensitivity_score)]" role="button" tabindex="0" @click="activeTab = 'sensitivity'" @keydown.enter="activeTab = 'sensitivity'">
                        <ElStatistic :value="dimScoreNum(assessment.sensitivity_score)" :precision="2">
                          <template #title>
                            <ElIcon class="score-icon"><TrendCharts /></ElIcon>
                            <span>Sensitivity</span>
                          </template>
                          <template #suffix>
                            <span class="score-range">/ 3</span>
                          </template>
                        </ElStatistic>
                        <span class="score-range-line"><span class="range-best">1 best</span> · <span class="range-worst">3 worst</span></span>
                      </div>
                    </ElCol>
                    <ElCol :xs="12" :sm="12" :md="6">
                      <div :class="['score-card', 'score-card-adaptive', scoreLevel('adaptive_capacity', assessment.adaptive_capacity_score)]" role="button" tabindex="0" @click="activeTab = 'adaptive_capacity'" @keydown.enter="activeTab = 'adaptive_capacity'">
                        <ElStatistic :value="dimScoreNum(assessment.adaptive_capacity_score)" :precision="2">
                          <template #title>
                            <ElIcon class="score-icon"><SetUp /></ElIcon>
                            <span>Adaptive Capacity</span>
                          </template>
                          <template #suffix>
                            <span class="score-range">/ 3</span>
                          </template>
                        </ElStatistic>
                        <span class="score-range-line"><span class="range-best">3 best</span> · <span class="range-worst">1 worst</span></span>
                      </div>
                    </ElCol>
                  </ElRow>
                  <ElRow :gutter="12" class="rating-row">
                    <ElCol :xs="24" :sm="12">
                      <div class="rating-section">
                        <span class="rating-title">Vulnerability</span>
                        <ElTag :type="vulnRatingType" size="large" class="rating-tag">
                          <ElIcon class="rating-icon"><WarningFilled /></ElIcon>
                          {{ formatRatingValue(assessment.vulnerability_score) }}{{ assessment.vulnerability_rating ? ` (${formatRatingLabel(assessment.vulnerability_rating)})` : '' }}
                        </ElTag>
                        <span class="rating-desc">AVG(Sensitivity) − AVG(Adaptive Capacity)</span>
                      </div>
                    </ElCol>
                    <ElCol :xs="24" :sm="12">
                      <div class="rating-section">
                        <span class="rating-title">Risk</span>
                        <ElTag :type="riskRatingType" size="large" class="rating-tag">
                          <ElIcon class="rating-icon"><WarningFilled /></ElIcon>
                          {{ formatRatingValue(assessment.risk_score) }}{{ assessment.risk_rating ? ` (${formatRatingLabel(assessment.risk_rating)})` : '' }}
                        </ElTag>
                        <span class="rating-desc">Hazard + (Exposure × NormVuln) / 3</span>
                      </div>
                    </ElCol>
                  </ElRow>
                </div>
                <p v-else class="score-placeholder">
                  Complete the questionnaire and click "Save & Compute Scores" to see the overall assessment.
                </p>
              </div>
            </ElTabPane>

            <!-- Recommendations tab -->
            <ElTabPane name="recommendations" label="Recommendations">
              <div class="tab-content recommendations-content">
                <div v-if="!assessment || !assessment.vulnerability_rating" class="score-placeholder">
                  Complete the questionnaire and click "Save & Compute Scores" to see recommendations.
                </div>
                <div v-else>
                  <div class="rec-download-section">
                    <ElButton type="success" :icon="Download" @click="downloadAssessmentPdf">
                      Download (PDF)
                    </ElButton>
                    <ElButton type="primary" :icon="Download" @click="downloadRecommendationsExcel">
                      Download(Excel)
                    </ElButton>
                  </div>
                  <ElTabs v-model="activeRecType" class="rec-type-tabs">
                    <ElTabPane name="planning" label="Planning">
                      <div class="rec-table-wrapper">
                        <ElTable :data="getRecommendationsTableData('planning')" border stripe height="400" style="width: 100%">
                          <ElTableColumn prop="category" label="Category" width="180" fixed="left">
                            <template #default="{ row }">
                              <div v-if="row.category" class="rec-cat-cell">
                                <span>{{ row.category }}</span>
                                <ElTag v-if="row.categoryRating" :type="getCategoryRatingTagType(row.dimensionKey, row.categoryKey)" size="small" style="margin-left: 6px;">
                                  {{ row.categoryRating }}
                                </ElTag>
                              </div>
                            </template>
                          </ElTableColumn>
                          <ElTableColumn prop="subcategory" label="Subcategory" width="400">
                            <template #default="{ row }">
                              <div v-if="row.subcategory" class="rec-subcat-cell">
                                <span>{{ row.subcategory }}</span>
                                <ElTag 
                                  :type="row.subcategoryRating === 'High' ? 'danger' : (row.subcategoryRating === 'Medium' ? 'warning' : 'success')" 
                                  size="small" 
                                  style="margin-left: 6px;"
                                >
                                  {{ row.subcategoryRating || '—' }}
                                </ElTag>
                              </div>
                              <span v-else class="rec-no-subcat">—</span>
                            </template>
                          </ElTableColumn>
                          <ElTableColumn prop="recommendations" label="Recommendations" min-width="500">
                            <template #default="{ row }">
                              <ul class="rec-table-list">
                                <li v-for="(rec, idx) in row.recommendations" :key="idx">
                                  {{ rec }}
                                </li>
                              </ul>
                            </template>
                          </ElTableColumn>
                        </ElTable>
                      </div>
                    </ElTabPane>
                    <ElTabPane name="designs" label="Design">
                      <div class="rec-table-wrapper">
                        <ElTable :data="getRecommendationsTableData('designs')" border stripe height="400" style="width: 100%">
                          <ElTableColumn prop="category" label="Category" width="180" fixed="left">
                            <template #default="{ row }">
                              <div v-if="row.category" class="rec-cat-cell">
                                <span>{{ row.category }}</span>
                                <ElTag v-if="row.categoryRating" :type="getCategoryRatingTagType(row.dimensionKey, row.categoryKey)" size="small" style="margin-left: 6px;">
                                  {{ row.categoryRating }}
                                </ElTag>
                              </div>
                            </template>
                          </ElTableColumn>
                          <ElTableColumn prop="subcategory" label="Subcategory" width="400">
                            <template #default="{ row }">
                              <div v-if="row.subcategory" class="rec-subcat-cell">
                                <span>{{ row.subcategory }}</span>
                                <ElTag 
                                  :type="row.subcategoryRating === 'High' ? 'danger' : (row.subcategoryRating === 'Medium' ? 'warning' : 'success')" 
                                  size="small" 
                                  style="margin-left: 6px;"
                                >
                                  {{ row.subcategoryRating || '—' }}
                                </ElTag>
                              </div>
                              <span v-else class="rec-no-subcat">—</span>
                            </template>
                          </ElTableColumn>
                          <ElTableColumn prop="recommendations" label="Recommendations" min-width="500">
                            <template #default="{ row }">
                              <ul class="rec-table-list">
                                <li v-for="(rec, idx) in row.recommendations" :key="idx">
                                  {{ rec }}
                                </li>
                              </ul>
                            </template>
                          </ElTableColumn>
                        </ElTable>
                      </div>
                    </ElTabPane>
                    <ElTabPane name="communityDevelopmentPlans" label="Community Development Plans">
                      <div class="rec-table-wrapper">
                        <ElTable :data="getRecommendationsTableData('communityDevelopmentPlans')" border stripe height="400" style="width: 100%">
                          <ElTableColumn prop="category" label="Category" width="180" fixed="left">
                            <template #default="{ row }">
                              <div v-if="row.category" class="rec-cat-cell">
                                <span>{{ row.category }}</span>
                                <ElTag v-if="row.categoryRating" :type="getCategoryRatingTagType(row.dimensionKey, row.categoryKey)" size="small" style="margin-left: 6px;">
                                  {{ row.categoryRating }}
                                </ElTag>
                              </div>
                            </template>
                          </ElTableColumn>
                          <ElTableColumn prop="subcategory" label="Subcategory" width="400">
                            <template #default="{ row }">
                              <div v-if="row.subcategory" class="rec-subcat-cell">
                                <span>{{ row.subcategory }}</span>
                                <ElTag 
                                  :type="row.subcategoryRating === 'High' ? 'danger' : (row.subcategoryRating === 'Medium' ? 'warning' : 'success')" 
                                  size="small" 
                                  style="margin-left: 6px;"
                                >
                                  {{ row.subcategoryRating || '—' }}
                                </ElTag>
                              </div>
                              <span v-else class="rec-no-subcat">—</span>
                            </template>
                          </ElTableColumn>
                          <ElTableColumn prop="recommendations" label="Recommendations" min-width="500">
                            <template #default="{ row }">
                              <ul class="rec-table-list">
                                <li v-for="(rec, idx) in row.recommendations" :key="idx">
                                  {{ rec }}
                                </li>
                              </ul>
                            </template>
                          </ElTableColumn>
                        </ElTable>
                      </div>
                    </ElTabPane>
                  </ElTabs>
                </div>
              </div>
            </ElTabPane>

            <!-- Map tab: settlement map + assessment location marker -->
            <ElTabPane name="map" label="Map">
              <div class="tab-content map-tab-content">
                <template v-if="assessment?.settlement_id">
                  <div class="settlement-map-wrapper">
                    <SettlementMap
                      :settlement-id="String(assessment.settlement_id)"
                      :initial-map-data="assessmentMapData"
                      :assessment-point="assessmentGeomForMap"
                    />
                  </div>
                  <p v-if="!assessmentGeomForMap" class="map-hint">Capture location in the mobile app to see the assessment point on the map.</p>
                </template>
                <p v-else class="score-placeholder">No settlement linked to this assessment.</p>
              </div>
            </ElTabPane>

            <!-- Documentation tab -->
            <ElTabPane name="docs" label="Documentation">
              <div class="tab-content">
                <div class="docs-header-row">
                  <ElInput
                    v-model="docsSearch"
                    placeholder="Search documents..."
                    clearable
                    size="small"
                    style="max-width: 260px;"
                  />
                </div>

                <!-- Upload dialog component -->
                <div v-if="docsUploadComponent">
                  <component
                    :is="docsUploadComponent"
                    v-bind="docsUploadProps"
                    @upload-complete="handleDocsUploadComplete"
                  />
                </div>

                <!-- Documents list -->
                <div class="docs-list-wrapper">
                  <div v-if="docsLoading" class="docs-loading">
                    <ElIcon class="docs-loading-icon"><Loading /></ElIcon>
                    <span>Loading documents...</span>
                  </div>
                  <div v-else-if="docsError" class="docs-error">
                    <ElIcon class="docs-error-icon"><WarningFilled /></ElIcon>
                    <span>{{ docsError }}</span>
                  </div>
                  <div v-else-if="!docsListData.documents?.length">
                    <ElEmpty description="No documentation uploaded yet." />
                  </div>
                  <div v-else-if="docsListComponent">
                    <component
                      :is="docsListComponent"
                      :data="docsListViewData"
                      docmodel="document"
                      field="climate_assessment_id"
                      :hide-import="true"
                    />
                  </div>
                </div>

                <div class="docs-footer-row">
                  <ElButton type="info" plain @click="openDocsUpload">
                    Upload Documentation
                  </ElButton>
                </div>
              </div>
            </ElTabPane>
          </ElTabs>
          <div v-if="canSave" class="assessment-actions">
            <ElButton type="primary" :loading="saving" @click="saveAssessment">
              Save & Compute Scores
            </ElButton>
            <ElButton v-if="assessment.status === 'draft'" @click="markCompleted">
              Mark Completed
            </ElButton>
          </div>
        </template>
        <ElEmpty v-else-if="!loading" description="Assessment not found" />
      </div>
    </ElCard>

    <ElDrawer
      v-model="infoDrawerOpen"
      title="Score Interpretation"
      direction="rtl"
      size="400px"
    >
      <div class="info-content">
        <div class="info-section">
          <h3 class="info-heading">
            <ElIcon><InfoFilled /></ElIcon>
            How to Interpret the Scores
          </h3>
          <p class="info-intro">
            KISIP Tool B uses a <strong>1–3 scale</strong> for each dimension, following the RVAT Excel methodology. Each answer maps to 1 (Low), 2 (Medium), or 3 (High). Vulnerability and Risk are computed from cross-dimensional formulas.
          </p>
        </div>
        <div class="info-section">
          <h4 class="info-subheading">
            <ElIcon class="info-dim-icon hazard"><Lightning /></ElIcon>
            Hazard (1–3)
          </h4>
          <p>Average severity and frequency of climate hazards (temperature, precipitation, droughts, flooding, storms, pollution, etc.). <strong>3 = severe/frequent hazards, 1 = low.</strong></p>
        </div>
        <div class="info-section">
          <h4 class="info-subheading">
            <ElIcon class="info-dim-icon exposure"><Location /></ElIcon>
            Exposure (1–3)
          </h4>
          <p>How much the community and its assets (livelihoods, health, housing, water, environment, institutions) are exposed to climate impacts. <strong>3 = high exposure, 1 = low.</strong></p>
        </div>
        <div class="info-section">
          <h4 class="info-subheading">
            <ElIcon class="info-dim-icon sensitivity"><TrendCharts /></ElIcon>
            Sensitivity (1–3)
          </h4>
          <p>How susceptible the community is to climate impacts (dependence on subsistence farming, health risks, infrastructure fragility). <strong>3 = highly sensitive, 1 = low.</strong></p>
        </div>
        <div class="info-section">
          <h4 class="info-subheading">
            <ElIcon class="info-dim-icon adaptive"><SetUp /></ElIcon>
            Adaptive Capacity (1–3)
          </h4>
          <p>The community's ability to cope and adapt (crop diversification, early warning, DRM plans, financial buffers). <strong>3 = good capacity, 1 = poor capacity.</strong> This dimension is positively scored — higher is better.</p>
        </div>
        <div class="info-section">
          <h4 class="info-subheading">
            <ElIcon class="info-dim-icon rating"><WarningFilled /></ElIcon>
            Vulnerability
          </h4>
          <p><code>Vulnerability = AVG(Sensitivity) − AVG(Adaptive Capacity)</code></p>
          <p>Range: −2 to +2. Negative means adaptive capacity outweighs sensitivity.</p>
          <ul class="info-list">
            <li><strong>Low</strong> (≤ −0.6): Good capacity, low sensitivity</li>
            <li><strong>Medium</strong> (−0.6 to +0.6): Moderate vulnerability</li>
            <li><strong>High</strong> (≥ +0.6): Sensitivity outweighs capacity</li>
          </ul>
        </div>
        <div class="info-section">
          <h4 class="info-subheading">
            <ElIcon class="info-dim-icon risk"><WarningFilled /></ElIcon>
            Risk
          </h4>
          <p><code>Risk = AVG(Hazard) + (Exposure × NormVuln) / 3</code></p>
          <p>where <code>NormVuln = (Vulnerability + 3) / 2</code></p>
          <ul class="info-list">
            <li><strong>Low</strong> (≤ 2.17): Lower overall climate risk</li>
            <li><strong>Medium</strong> (2.17 – 3.83): Moderate risk</li>
            <li><strong>High</strong> (≥ 3.83): High climate risk</li>
          </ul>
        </div>
      </div>
    </ElDrawer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, defineAsyncComponent } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCache } from '@/hooks/web/useCache'
import { useAppStoreWithOut } from '@/store/modules/app'
import {
  ElCard,
  ElButton,
  ElIcon,
  ElTabs,
  ElTabPane,
  ElDrawer,
  ElCollapse,
  ElCollapseItem,
  ElTag,
  ElSelect,
  ElOption,
  ElRow,
  ElCol,
  ElEmpty,
  ElMessage,
  ElStatistic,
  ElTable,
  ElTableColumn
} from 'element-plus'
import { Back, Lightning, Location, TrendCharts, SetUp, WarningFilled, InfoFilled, Document, Loading, Download } from '@element-plus/icons-vue'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import {
  getQuestions,
  getAssessment,
  createAssessment,
  updateAssessment,
  listAssessments,
  type ClimateAssessment,
  type AssessmentQuestions
} from '@/api/climate-assessment'
import { getSettlementListByCounty, getSettlementMapData } from '@/api/settlements'
import SettlementMap from '@/views/Components/SettlementMap.vue'

const route = useRoute()
const router = useRouter()
const { wsCache } = useCache()
const appStore = useAppStoreWithOut()
const userPermissions = computed(() => {
  const info = wsCache.get(appStore.getUserInfo)
  return (info?.permissions ?? []) as string[]
})
const canSave = computed(() => {
  const perms = userPermissions.value
  return perms.length > 0 && (perms[0] === '*.*.*' || perms.includes('climate_assessment:update'))
})

const dimensions = ['hazard', 'exposure', 'sensitivity', 'adaptive_capacity']

/* ── Static table data for the Methodology tab ── */
const scaleTableData = [
  { score: '1', meaning: 'Low — minimal severity, exposure, sensitivity, or poor adaptive capacity' },
  { score: '2', meaning: 'Medium — moderate level' },
  { score: '3', meaning: 'High — severe / frequent (or Good adaptive capacity for AC)' }
]
const dimensionTableData = [
  { dimension: 'Hazard', formula: 'AVG of all hazard questions', interpretation: '3 = severe hazards, 1 = low' },
  { dimension: 'Exposure', formula: 'AVG of all exposure questions', interpretation: '3 = high exposure, 1 = low' },
  { dimension: 'Sensitivity', formula: 'AVG of all sensitivity questions', interpretation: '3 = highly sensitive, 1 = low' },
  { dimension: 'Adaptive Capacity', formula: 'AVG of all AC questions', interpretation: '3 = good capacity (positive), 1 = poor' }
]
const vulnThresholdData = [
  { rating: 'Low', range: '≤ −0.6', meaning: 'Adaptive capacity outweighs sensitivity — community is resilient' },
  { rating: 'Medium', range: '−0.6 to +0.6', meaning: 'Moderate vulnerability — some gaps in adaptive capacity' },
  { rating: 'High', range: '≥ +0.6', meaning: 'Sensitivity outweighs capacity — community is vulnerable' }
]
const riskThresholdData = [
  { rating: 'Low', range: '≤ 2.17', meaning: 'Lower overall climate risk' },
  { rating: 'Medium', range: '2.17 – 3.83', meaning: 'Moderate climate risk' },
  { rating: 'High', range: '≥ 3.83', meaning: 'High climate risk — immediate attention needed' }
]

const loading = ref(false)
const saving = ref(false)
const assessment = ref<ClimateAssessment | null>(null)
const questionsConfig = ref<AssessmentQuestions | null>(null)
const activeTab = ref<string>('howto')
const infoDrawerOpen = ref(false)
/** Pre-fetched settlement map data for the Map tab (same pattern as SettlementDetails) */
const assessmentMapData = ref<Record<string, any> | null>(null)
const activeCategoryByTab = ref<Record<string, string>>({
  hazard: '',
  exposure: '',
  sensitivity: '',
  adaptive_capacity: ''
})

const formatRatingLabel = (r: string | null | undefined) =>
  r ? String(r).charAt(0).toUpperCase() + String(r).slice(1).toLowerCase() : ''

/** Numeric value for ElStatistic (returns 0 when no score yet) */
const dimScoreNum = (score: number | string | null | undefined): number => {
  if (score == null || score === '') return 0
  const n = typeof score === 'number' ? score : Number(score)
  return Number.isNaN(n) ? 0 : n
}

const formatRatingValue = (score: number | string | null | undefined) => {
  if (score == null || score === '') return '—'
  const n = typeof score === 'number' ? score : Number(score)
  return Number.isNaN(n) ? '—' : n.toFixed(2)
}

const overallTabLabel = computed(() => {
  const rr = assessment.value?.risk_rating
  if (rr) {
    const upper = String(rr).toUpperCase()
    if (upper === 'MEDIUM' || upper === 'HIGH') {
      return `Overall (Risk: ${formatRatingLabel(rr)})`
    }
  }
  return 'Overall Score'
})

const ratingTypeForString = (r: string | null | undefined) => {
  const upper = r?.toUpperCase()
  if (upper === 'HIGH') return 'danger'
  if (upper === 'MEDIUM') return 'warning'
  return 'success'
}

const vulnRatingType = computed(() => ratingTypeForString(assessment.value?.vulnerability_rating))
const riskRatingType = computed(() => ratingTypeForString(assessment.value?.risk_rating))

/** Return a severity level class based on dimension score (1-3 scale).
 *  For Adaptive Capacity the polarity is inverted (3 = good). */
const scoreLevel = (dim: string, score: number | string | null | undefined): string => {
  if (score == null || score === '') return ''
  const n = typeof score === 'number' ? score : Number(score)
  if (Number.isNaN(n)) return ''
  const isAC = dim === 'adaptive_capacity'
  if (n >= 2.33) return isAC ? 'level-low' : 'level-high'
  if (n >= 1.67) return 'level-medium'
  return isAC ? 'level-high' : 'level-low'
}

const tabLabels = computed(() => {
  const labels: Record<string, string> = {}
  const a = assessment.value
  for (const dim of dimensions) {
    const label = questionsConfig.value?.[dim]?.label || dim
    const scoreKey = `${dim}_score` as keyof ClimateAssessment
    const score = a?.[scoreKey]
    const numScore = typeof score === 'number' ? score : (score != null ? Number(score) : null)
    if (numScore != null && !Number.isNaN(numScore)) {
      labels[dim] = `${label} (${numScore.toFixed(2)})`
    } else {
      labels[dim] = label
    }
  }
  return labels
})

const answeredCount = (dim: string, cat: { questions?: Array<{ key: string }> }) => {
  const qs = cat.questions || []
  return qs.filter(q => responses.value[dim]?.[q.key] != null && responses.value[dim][q.key] !== '').length
}

const assessmentId = computed(() => {
  const id = route.params.assessmentId
  return id ? Number(id) : null
})

const settlementId = computed(() => {
  const id = route.params.id ?? route.params.settlementId
  return id ? Number(id) : null
})

/** GeoJSON Point for assessment location marker, or null if not set */
const assessmentGeomForMap = computed(() => {
  const geom = (assessment.value as any)?.geom
  if (!geom || geom.type !== 'Point' || !Array.isArray(geom.coordinates) || geom.coordinates.length < 2) return null
  return { type: 'Point' as const, coordinates: geom.coordinates as [number, number] }
})

const responses = ref<Record<string, Record<string, string>>>({
  hazard: {},
  exposure: {},
  sensitivity: {},
  adaptive_capacity: {}
})

const countyName = computed(() => assessment.value?.county?.name ?? '')
const settlementName = computed(() => assessment.value?.settlement?.name ?? '')

const assessorName = computed(() => {
  const a = assessment.value?.assessor
  if (!a) return ''
  return a.name || a.username || a.email || `User #${a.id}`
})

// Recommendations
const recommendationsData = ref<any>(null)
const activeRecType = ref<string>('planning')

// Load recommendations JSON
const loadRecommendations = async () => {
  try {
    const response = await fetch('/climate_assessment_dimension_recommendations.json')
    if (response.ok) {
      recommendationsData.value = await response.json()
    } else {
      console.warn('Recommendations file not found, recommendations will not be available')
    }
  } catch (e) {
    console.error('Failed to load recommendations', e)
  }
}

// Compute category score for a specific dimension and category
const computeCategoryScore = (dim: string, catKey: string): number | null => {
  const dimConfig = questionsConfig.value?.[dim]
  if (!dimConfig || !dimConfig.categories) return null
  
  const cat = dimConfig.categories.find((c: any) => c.key === catKey)
  if (!cat || !cat.questions) return null
  
  let total = 0
  let count = 0
  for (const q of cat.questions) {
    const answer = responses.value[dim]?.[q.key]
    if (answer != null && answer !== '') {
      const score = q.answers?.[answer]
      if (typeof score === 'number') {
        total += score
        count++
      }
    }
  }
  if (count === 0) return null
  return Math.round((total / count) * 100) / 100
}

// Map question keys to subcategory labels
const getSubcategoryLabel = (dim: string, catKey: string, questionKey: string): string => {
  // First try to get label from recommendations data
  if (recommendationsData.value?.[dim]?.[catKey]?.subcategories?.[questionKey]?.label) {
    return recommendationsData.value[dim][catKey].subcategories[questionKey].label
  }
  
  // Fallback to hardcoded mapping
  const subcategoryMap: Record<string, string> = {
    // Livelihoods subcategories
    'livelihoods_food_security': 'Food Security',
    'livelihoods_grazing': 'Grazing/Farm Land',
    'livelihoods_crops': 'Crops',
    'livelihoods_livestock': 'Livestock',
    'livelihoods_fishstock': 'Fishstock',
    'exp_local_commerce': 'Local Commerce',
    'exp_gender': 'Gender',
    'exp_conviviality': 'Conviviality',
    'exp_education': 'Education',
    'exp_wfi_wfdu': 'Water For Irrigation / Water For Domestic Use',
    'exp_atf_i': 'Access to Finance / Income',
    'exp_disaster_events': 'Disaster Events',
    // Health & Safety
    'health_borne_diseases': 'Borne Diseases',
    'health_slupc': 'Safety, Location, Urban Planning & Conditions',
    'exp_swm': 'Solid Waste Management',
    'exp_lwm': 'Liquid Waste Management',
    'exp_aths': 'Adequate Health Services',
    'exp_athe': 'Assessment of The Healthy Environment',
    // Assets and Utilities
    'assets_housing': 'Housing',
    'assets_public_facilities': 'Public Facilities',
    'exp_swd': 'Storm Water Drainage',
    'exp_sanitary_facilities': 'Sanitary Facilities',
    'exp_sewer_lines': 'Sewer Lines',
    'exp_power_lines_supply': 'Power Lines/Supply',
    'exp_energy_for_hh_use': 'Energy for Household Use',
    'assets_water': 'Water Pipes',
    'exp_pwt': 'Potable Water Treatment',
    'exp_water_storage': 'Water Storage',
    'exp_r_t': 'Roads & Transport',
    'exp_communication': 'Communication',
    // Potable water
    'water_access': 'Access',
    'exp_scarcities': 'Scarcities',
    'water_quality': 'Quality',
    // EBS
    'ebs_soil': 'Soil',
    'exp_lc_p': 'Land Cover & Permeability',
    'ebs_landcover': 'Natural Vegetation',
    'exp_wetland': 'Wetland',
    'exp_biodiversity': 'Biodiversity',
    'exp_nwb': 'Near Water Body',
    'exp_sea': 'Sea',
    'exp_ef': 'Environmental Factors',
    'exp_land_use': 'Land use',
    'exp_topography': 'Topography',
    // Institutions
    'exp_ews': 'Early Warning System',
    'exp_a_i': 'Awareness & Information',
    'exp_ec': 'Engagement & Communication',
    'exp_r_rp': 'Representation & Reflection in Planning',
    'exp_hfo': 'Health Facilities Operations',
    'exp_dp': 'Disaster Preparedness',
    'exp_dr': 'Disaster Response',
    'exp_pfr': 'Post-Flood Recovery',
    'exp_pfm': 'Public Facilities Maintenance',
  }
  return subcategoryMap[questionKey] || questionKey
}

// Compute subcategory score (single question score)
const computeSubcategoryScore = (dim: string, questionKey: string): number | null => {
  const answer = responses.value[dim]?.[questionKey]
  if (answer == null || answer === '') return null
  const dimConfig = questionsConfig.value?.[dim]
  if (!dimConfig || !dimConfig.categories) return null
  
  for (const cat of dimConfig.categories) {
    const q = cat.questions?.find((q: any) => q.key === questionKey)
    if (q) {
      const score = q.answers?.[answer]
      if (typeof score === 'number') {
        return score
      }
    }
  }
  return null
}

// Get subcategory rating
const getSubcategoryRating = (dim: string, questionKey: string): string => {
  const score = computeSubcategoryScore(dim, questionKey)
  const isAC = dim === 'adaptive_capacity'
  return scoreToRating(score, isAC)
}

// Determine rating from score (1-3 scale)
const scoreToRating = (score: number | null, isAdaptiveCapacity: boolean): string => {
  if (score == null) return 'Low'
  if (isAdaptiveCapacity) {
    // Inverted for adaptive capacity: High score = Low rating (good), Low score = High rating (bad)
    if (score >= 2.33) return 'Low' // Good capacity
    if (score >= 1.67) return 'Medium'
    return 'High' // Poor capacity
  } else {
    // Normal: High score = High rating (bad), Low score = Low rating (good)
    if (score >= 2.33) return 'High'
    if (score >= 1.67) return 'Medium'
    return 'Low'
  }
}

// Get category rating
const getCategoryRating = (dim: string, catKey: string): string => {
  const score = computeCategoryScore(dim, catKey)
  const isAC = dim === 'adaptive_capacity'
  return scoreToRating(score, isAC)
}

// Get subcategory recommendations (based on subcategory's individual rating)
const getSubcategoryRecommendations = (dim: string, catKey: string, subcategoryKey: string) => {
  if (!recommendationsData.value || !recommendationsData.value[dim]) return null
  const dimRecs = recommendationsData.value[dim]
  if (!dimRecs[catKey] || !dimRecs[catKey].subcategories) return null
  
  const subcatRecs = dimRecs[catKey].subcategories[subcategoryKey]
  if (!subcatRecs) return null
  
  // Get rating based on subcategory's individual score
  const rating = getSubcategoryRating(dim, subcategoryKey)
  return subcatRecs.ratings?.[rating] || null
}

// Get category recommendations (fallback for categories without subcategories)
const getCategoryRecommendations = (dim: string, catKey: string) => {
  if (!recommendationsData.value || !recommendationsData.value[dim]) return null
  const dimRecs = recommendationsData.value[dim]
  if (!dimRecs[catKey]) return null
  
  // Check if it has the old structure (ratings directly) or new structure (subcategories)
  if (dimRecs[catKey].ratings) {
    const rating = getCategoryRating(dim, catKey)
    return dimRecs[catKey].ratings?.[rating] || null
  }
  
  return null
}

// Get category rating tag type
const getCategoryRatingTagType = (dim: string, catKey: string) => {
  const rating = getCategoryRating(dim, catKey)
  if (rating === 'High') return 'danger'
  if (rating === 'Medium') return 'warning'
  return 'success'
}

// Get recommendations table data for a specific type (planning, designs, communityDevelopmentPlans)
// Only includes exposure dimension categories and subcategories
const getRecommendationsTableData = (type: 'planning' | 'designs' | 'communityDevelopmentPlans') => {
  const tableData: any[] = []
  
  if (!recommendationsData.value || !questionsConfig.value) return tableData
  
  // Only process exposure dimension
  const dim = 'exposure'
  const dimConfig = questionsConfig.value[dim]
  if (!dimConfig || !dimConfig.categories) return tableData
  
  for (const cat of dimConfig.categories) {
    const catRating = getCategoryRating(dim, cat.key)
    let isFirstRowInCategory = true
    
    // If category has questions, show subcategories (one row per question)
    if (cat.questions && cat.questions.length > 0) {
      for (const q of cat.questions) {
        // Get subcategory-specific recommendations based on subcategory's rating
        const subcatRecs = getSubcategoryRecommendations(dim, cat.key, q.key)
        if (!subcatRecs) continue
        
        const typeRecs = subcatRecs[type] || []
        if (typeRecs.length === 0) continue
        
        const subcatLabel = getSubcategoryLabel(dim, cat.key, q.key)
        const subcatScore = computeSubcategoryScore(dim, q.key)
        const subcatRating = getSubcategoryRating(dim, q.key)
        const subcatScoreStr = subcatScore != null ? `${subcatScore.toFixed(2)} / 3` : '—'
        
        tableData.push({
          dimensionKey: dim,
          categoryKey: cat.key,
          category: isFirstRowInCategory ? cat.label : '', // Only show category on first row
          categoryRating: isFirstRowInCategory ? catRating : '', // Only show rating on first row
          isFirstRowInCategory: isFirstRowInCategory,
          subcategoryKey: q.key,
          subcategory: subcatLabel,
          subcategoryScore: subcatScoreStr,
          subcategoryRating: subcatRating,
          recommendations: typeRecs // Subcategory-specific recommendations based on subcategory rating
        })
        
        isFirstRowInCategory = false
      }
    } else {
      // No subcategories, show category-level (fallback)
      const recs = getCategoryRecommendations(dim, cat.key)
      if (!recs) continue
      
      const typeRecs = recs[type] || []
      if (typeRecs.length === 0) continue
      
      tableData.push({
        dimensionKey: dim,
        categoryKey: cat.key,
        category: cat.label,
        categoryRating: catRating,
        isFirstRowInCategory: true,
        subcategoryKey: null,
        subcategory: null,
        subcategoryScore: null,
        subcategoryRating: null,
        recommendations: typeRecs
      })
    }
  }
  
  return tableData
}

const downloadAssessmentPdf = () => {
  if (!assessment.value) {
    ElMessage.warning('Assessment not available')
    return
  }

  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const left = 14
  const right = pageWidth - 14
  const usableWidth = right - left
  let y = 20

  const ensurePage = (needed = 12) => {
    if (y + needed > pageHeight - 24) {
      doc.addPage()
      y = 20
    }
  }

  const sectionHeader = (title: string) => {
    // Keep clear space from previous content to avoid visual overlap.
    if (y > 20) y += 3
    ensurePage(18)
    doc.setFillColor(248, 249, 250)
    doc.rect(left, y - 5, usableWidth, 10, 'F')
    doc.setDrawColor(225, 229, 233)
    doc.rect(left, y - 5, usableWidth, 10)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.setTextColor(44, 62, 80)
    doc.text(title, left + 3, y)
    y += 11
  }

  const keyValue = (label: string, value: string) => {
    ensurePage(8)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(70, 70, 70)
    doc.text(`${label}:`, left, y)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(20, 20, 20)
    const wrapped = doc.splitTextToSize(value || '—', usableWidth - 44)
    doc.text(wrapped, left + 44, y)
    y += Math.max(6, wrapped.length * 5)
  }

  const scoreRow = (label: string, value: string, tone: [number, number, number]) => {
    ensurePage(10)
    doc.setFillColor(250, 250, 250)
    doc.rect(left, y - 4, usableWidth, 8, 'F')
    doc.setDrawColor(235, 235, 235)
    doc.rect(left, y - 4, usableWidth, 8)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(44, 62, 80)
    doc.text(label, left + 3, y + 1)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(tone[0], tone[1], tone[2])
    doc.text(value || '—', right - 3, y + 1, { align: 'right' })
    y += 9
  }

  const bullet = (text: string) => {
    ensurePage(8)
    const wrapped = doc.splitTextToSize(text, usableWidth - 8)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(30, 30, 30)
    doc.text(`- ${wrapped[0]}`, left + 2, y)
    for (let i = 1; i < wrapped.length; i++) {
      y += 5
      doc.text(`  ${wrapped[i]}`, left + 2, y)
    }
    y += 6
  }

  const categoryTitle = (text: string) => {
    ensurePage(8)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(33, 37, 41)
    doc.text(text, left + 1, y)
    y += 6
  }

  const subCategoryTitle = (text: string) => {
    ensurePage(7)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(73, 80, 87)
    doc.text(text, left + 4, y)
    y += 5
  }

  const score = assessment.value
  // Header band (incident-style)
  doc.setFillColor(64, 158, 255)
  doc.rect(10, 10, pageWidth - 20, 20, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.setTextColor(255, 255, 255)
  doc.text('CLIMATE ASSESSMENT REPORT', pageWidth / 2, 18, { align: 'center' })
  doc.setFontSize(9)
  doc.text('KISIP Tool B: Risk & Vulnerability', pageWidth / 2, 24, { align: 'center' })
  y = 38

  sectionHeader('Context')
  keyValue('County', countyName.value || '—')
  keyValue('Settlement', settlementName.value || '—')
  keyValue('Assessor', assessorName.value || '—')
  keyValue('Assessment Date', score.assessed_at ? new Date(score.assessed_at).toLocaleDateString() : '—')
  keyValue('Status', score.status || '—')

  sectionHeader('Dimension Scores (1-3)')
  scoreRow('Hazard', formatRatingValue(score.hazard_score), [231, 76, 60])
  scoreRow('Exposure', formatRatingValue(score.exposure_score), [243, 156, 18])
  scoreRow('Sensitivity', formatRatingValue(score.sensitivity_score), [52, 152, 219])
  scoreRow('Adaptive Capacity', formatRatingValue(score.adaptive_capacity_score), [39, 174, 96])

  sectionHeader('Overall Scores')
  scoreRow(
    'Vulnerability',
    `${formatRatingValue(score.vulnerability_score)}${score.vulnerability_rating ? ` (${formatRatingLabel(score.vulnerability_rating)})` : ''}`,
    [192, 57, 43]
  )
  scoreRow(
    'Risk',
    `${formatRatingValue(score.risk_score)}${score.risk_rating ? ` (${formatRatingLabel(score.risk_rating)})` : ''}`,
    [142, 68, 173]
  )

  const recommendationSections: Array<{ title: string; key: 'planning' | 'designs' | 'communityDevelopmentPlans' }> = [
    { title: 'Planning Recommendations', key: 'planning' },
    { title: 'Design Recommendations', key: 'designs' },
    { title: 'Community Development Plan Recommendations', key: 'communityDevelopmentPlans' }
  ]

  let hasRecommendations = false
  recommendationSections.forEach((section) => {
    const rows = getRecommendationsTableData(section.key).filter(
      (row: any) => Array.isArray(row.recommendations) && row.recommendations.length > 0
    )
    if (rows.length === 0) return
    hasRecommendations = true

    sectionHeader(section.title)
    let currentCategory = ''
    let currentSubcategory = ''

    rows.forEach((row: any) => {
      if (row.category) {
        currentCategory = row.category
        currentSubcategory = ''
        categoryTitle(currentCategory)
      }

      if (row.subcategory && row.subcategory !== currentSubcategory) {
        currentSubcategory = row.subcategory
        subCategoryTitle(currentSubcategory)
      }

      row.recommendations.forEach((rec: string) => bullet(rec))
    })
    // Add breathing room before next recommendation section header.
    y += 2
  })

  if (!hasRecommendations) {
    sectionHeader('Recommendations')
    bullet('No recommendations available yet. Complete and save the assessment to generate recommendations.')
  }

  // Footer for all pages
  const pages = doc.getNumberOfPages()
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i)
    doc.setDrawColor(220, 220, 220)
    doc.line(10, pageHeight - 14, pageWidth - 10, pageHeight - 14)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(100, 100, 100)
    doc.text(`Generated: ${new Date().toLocaleString()}`, 12, pageHeight - 9)
    doc.text(`Page ${i} of ${pages}`, pageWidth - 12, pageHeight - 9, { align: 'right' })
  }

  const safeSettlement = (settlementName.value || 'Assessment').replace(/[\\/:*?"<>|]/g, '_')
  const fileName = `Climate_Assessment_${safeSettlement}_${assessmentId.value || score.id || 'report'}.pdf`
  doc.save(fileName)
  ElMessage.success('Assessment PDF downloaded')
}

// Download recommendations as Excel file
const downloadRecommendationsExcel = () => {
  if (!recommendationsData.value || !questionsConfig.value) {
    ElMessage.warning('Recommendations data not available')
    return
  }

  const workbook = XLSX.utils.book_new()
  
  // Create Summary sheet first
  const summaryData = [
    { 'Field': 'Settlement Name', 'Value': assessment.value?.settlement?.name || 'N/A' },
    { 'Field': 'County', 'Value': assessment.value?.county?.name || 'N/A' },
    { 'Field': 'Assessed At', 'Value': assessment.value?.assessed_at ? new Date(assessment.value.assessed_at).toLocaleDateString() : 'N/A' },
    { 'Field': 'Assessor', 'Value': assessorName.value || 'N/A' },
    { 'Field': '', 'Value': '' }, // Empty row
    { 'Field': 'Dimension Scores', 'Value': '' },
    { 'Field': 'Hazard Score', 'Value': formatRatingValue(assessment.value?.hazard_score) },
    { 'Field': 'Exposure Score', 'Value': formatRatingValue(assessment.value?.exposure_score) },
    { 'Field': 'Sensitivity Score', 'Value': formatRatingValue(assessment.value?.sensitivity_score) },
    { 'Field': 'Adaptive Capacity Score', 'Value': formatRatingValue(assessment.value?.adaptive_capacity_score) },
    { 'Field': '', 'Value': '' }, // Empty row
    { 'Field': 'Vulnerability', 'Value': '' },
    { 'Field': 'Vulnerability Score', 'Value': formatRatingValue(assessment.value?.vulnerability_score) },
    { 'Field': 'Vulnerability Rating', 'Value': assessment.value?.vulnerability_rating ? formatRatingLabel(assessment.value.vulnerability_rating) : 'N/A' },
    { 'Field': '', 'Value': '' }, // Empty row
    { 'Field': 'Risk', 'Value': '' },
    { 'Field': 'Risk Score', 'Value': formatRatingValue(assessment.value?.risk_score) },
    { 'Field': 'Risk Rating', 'Value': assessment.value?.risk_rating ? formatRatingLabel(assessment.value.risk_rating) : 'N/A' }
  ]

  // Add coordinates if available (check settlement geometry)
  const settlement = assessment.value?.settlement as any
  if (settlement?.centroid || settlement?.geometry || settlement?.latitude || settlement?.longitude) {
    const lat = settlement.latitude || settlement.centroid?.lat || settlement.geometry?.coordinates?.[1] || ''
    const lon = settlement.longitude || settlement.centroid?.lon || settlement.geometry?.coordinates?.[0] || ''
    if (lat && lon) {
      summaryData.push({ 'Field': '', 'Value': '' })
      summaryData.push({ 'Field': 'Coordinates', 'Value': '' })
      summaryData.push({ 'Field': 'Latitude', 'Value': String(lat) })
      summaryData.push({ 'Field': 'Longitude', 'Value': String(lon) })
      summaryData.push({ 'Field': 'Centroid', 'Value': `${lat}, ${lon}` })
    }
  }

  // Convert to array of arrays format (no headers)
  const summaryArray = summaryData.map(row => [row.Field, row.Value])
  const summaryWorksheet = XLSX.utils.aoa_to_sheet(summaryArray)
  summaryWorksheet['!cols'] = [
    { wch: 30 }, // Field column
    { wch: 40 }  // Value column
  ]
  
  // Style headers and labels
  const summaryRange = XLSX.utils.decode_range(summaryWorksheet['!ref'] || 'A1')
  for (let row = 0; row <= summaryRange.e.r; row++) {
    const fieldAddress = XLSX.utils.encode_cell({ r: row, c: 0 })
    const valueAddress = XLSX.utils.encode_cell({ r: row, c: 1 })
    
    // Bold the Field column
    if (summaryWorksheet[fieldAddress]) {
      if (!summaryWorksheet[fieldAddress].s) summaryWorksheet[fieldAddress].s = {}
      if (!summaryWorksheet[fieldAddress].s.font) summaryWorksheet[fieldAddress].s.font = {}
      summaryWorksheet[fieldAddress].s.font.bold = true
    }
    
    // Bold section headers (empty value means it's a section header)
    if (summaryWorksheet[valueAddress] && summaryWorksheet[valueAddress].v === '') {
      if (!summaryWorksheet[valueAddress].s) summaryWorksheet[valueAddress].s = {}
      if (!summaryWorksheet[valueAddress].s.font) summaryWorksheet[valueAddress].s.font = {}
      summaryWorksheet[valueAddress].s.font.bold = true
    }
  }
  
  XLSX.utils.book_append_sheet(workbook, summaryWorksheet, 'Summary')
  
  // Create sheets for each type
  const types = [
    { key: 'planning', label: 'Planning' },
    { key: 'designs', label: 'Design' },
    { key: 'communityDevelopmentPlans', label: 'Community Development Plans' }
  ]

  types.forEach(type => {
    const tableData = getRecommendationsTableData(type.key as 'planning' | 'designs' | 'communityDevelopmentPlans')
    
    // Transform data for Excel - one row per recommendation
    const excelData: any[] = []
    tableData.forEach(row => {
      if (Array.isArray(row.recommendations) && row.recommendations.length > 0) {
        // First recommendation gets category and subcategory
        excelData.push({
          'Category': row.category || '',
          'Subcategory': row.subcategory || '',
          'Recommendations': `• ${row.recommendations[0]}`
        })
        // Remaining recommendations get empty category/subcategory
        for (let i = 1; i < row.recommendations.length; i++) {
          excelData.push({
            'Category': '',
            'Subcategory': '',
            'Recommendations': `• ${row.recommendations[i]}`
          })
        }
      } else if (row.recommendations) {
        // Single recommendation
        excelData.push({
          'Category': row.category || '',
          'Subcategory': row.subcategory || '',
          'Recommendations': `• ${row.recommendations}`
        })
      }
    })

    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(excelData)
    
    // Set column widths
    worksheet['!cols'] = [
      { wch: 25 }, // Category
      { wch: 40 }, // Subcategory
      { wch: 80 }  // Recommendations
    ]
    
    // Style headers (row 0) - make them bold
    const headerRow = 0
    const headerCells = ['A', 'B', 'C'] // Category, Subcategory, Recommendations
    headerCells.forEach((col) => {
      const cellAddress = `${col}${headerRow + 1}` // XLSX uses 1-based indexing
      if (!worksheet[cellAddress]) return
      if (!worksheet[cellAddress].s) worksheet[cellAddress].s = {}
      if (!worksheet[cellAddress].s.font) worksheet[cellAddress].s.font = {}
      worksheet[cellAddress].s.font.bold = true
    })
    
    // Style category and subcategory cells - make them bold
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1')
    for (let row = 1; row <= range.e.r; row++) {
      // Category column (A)
      const catAddress = XLSX.utils.encode_cell({ r: row, c: 0 })
      if (worksheet[catAddress] && worksheet[catAddress].v) {
        if (!worksheet[catAddress].s) worksheet[catAddress].s = {}
        if (!worksheet[catAddress].s.font) worksheet[catAddress].s.font = {}
        worksheet[catAddress].s.font.bold = true
      }
      
      // Subcategory column (B)
      const subcatAddress = XLSX.utils.encode_cell({ r: row, c: 1 })
      if (worksheet[subcatAddress] && worksheet[subcatAddress].v) {
        if (!worksheet[subcatAddress].s) worksheet[subcatAddress].s = {}
        if (!worksheet[subcatAddress].s.font) worksheet[subcatAddress].s.font = {}
        worksheet[subcatAddress].s.font.bold = true
      }
    }

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, type.label)
  })

  // Generate filename with assessment info
  const settlementName = assessment.value?.settlement?.name || 'Assessment'
  const assessmentId = assessment.value?.id || 'new'
  const filename = `Climate_Recommendations_${settlementName}_${assessmentId}_${new Date().toISOString().split('T')[0]}.xlsx`

  // Download file
  XLSX.writeFile(workbook, filename)
  
  ElMessage.success('Recommendations downloaded successfully')
}

// Documentation upload (linked to the climate assessment)
const docsUploadOpen = ref(false)
const DocsUploadChild = defineAsyncComponent(() => import('@/views/Components/UploadComponent.vue'))
const docsUploadComponent = ref<any | null>(null)
const docsUploadProps = ref({
  message: 'Climate assessment documentation',
  showDialog: docsUploadOpen,
  data: { id: null as number | null },
  umodel: 'document',
  field: 'climate_assessment_id',
  filterOptions: '' as string | undefined
})

const docsLoading = ref(false)
const docsError = ref('')
const docsListData = ref<{ documents: any[] }>({ documents: [] })
const docsSearch = ref('')
const docsListViewData = computed(() => {
  const q = docsSearch.value.trim().toLowerCase()
  if (!q) return { documents: docsListData.value.documents }
  const filtered = (docsListData.value.documents || []).filter((d: any) =>
    String(d.name || '').toLowerCase().includes(q)
  )
  return { documents: filtered }
})
const DocsListChild = defineAsyncComponent(() => import('@/views/Components/ListDocuments.vue'))
const docsListComponent = ref<any | null>(null)
const docsLoadedOnce = ref(false)

const loadDocumentation = async () => {
  const aid = assessment.value?.id
  if (!aid) {
    docsError.value = 'Assessment must be saved before loading documentation.'
    docsListData.value = { documents: [] }
    return
  }
  docsLoading.value = true
  docsError.value = ''
  try {
    const formData: any = {
      limit: 1000,
      page: 1,
      curUser: 1,
      model: 'document',
      searchField: 'name',
      searchKeyword: '',
      filters: ['climate_assessment_id'],
      filterValues: [[aid]],
      associated_multiple_models: ['document_type'],
      nested_models: []
    }
    const res: any = await getSettlementListByCounty(formData as any)
    const data = res?.data ?? res?.results ?? []
    docsListData.value = { documents: Array.isArray(data) ? data : [] }
    docsLoadedOnce.value = true
    if (!docsListComponent.value) docsListComponent.value = DocsListChild
  } catch (e: any) {
    console.error('Failed to load documentation for assessment', e)
    docsError.value = e?.message || 'Failed to load documentation'
    docsListData.value = { documents: [] }
  } finally {
    docsLoading.value = false
  }
}

const openDocsUpload = () => {
  const aid = assessment.value?.id
  if (!aid) {
    ElMessage.error('Please save the assessment first to link documents to it.')
    return
  }
  docsUploadProps.value.data = { id: aid }
  docsUploadProps.value.showDialog = true
  docsUploadComponent.value = null
  docsUploadOpen.value = true
  setTimeout(() => {
    docsUploadComponent.value = DocsUploadChild
  }, 100)
}

const handleDocsUploadComplete = async () => {
  await loadDocumentation()
}

let saveTimeout: ReturnType<typeof setTimeout> | null = null
const debouncedSave = () => {
  if (saveTimeout) clearTimeout(saveTimeout)
  saveTimeout = setTimeout(() => saveAssessment(), 800)
}

const loadQuestions = async () => {
  try {
    const res = await getQuestions()
    if (res.code === '0000') questionsConfig.value = res.data
  } catch (e: any) {
    ElMessage.error(e?.message || 'Failed to load questions')
  }
}

/** Load settlement map data for the Map tab when assessment has settlement_id */
const loadAssessmentMapData = async () => {
  const sid = assessment.value?.settlement_id
  if (!sid) {
    assessmentMapData.value = null
    return
  }
  try {
    const res: any = await getSettlementMapData({ settlementId: String(sid) })
    assessmentMapData.value = res?.data ?? null
  } catch {
    assessmentMapData.value = null
  }
}

const loadOrCreateAssessment = async () => {
  loading.value = true
  try {
    if (assessmentId.value) {
      const res = await getAssessment(assessmentId.value)
      if (res.code === '0000') {
        assessment.value = res.data
        syncResponsesFromAssessment(res.data)
        await loadAssessmentMapData()
      }
    } else if (settlementId.value) {
      const listRes = await listAssessments({ settlement_id: settlementId.value })
      if (listRes.code === '0000' && listRes.data?.length) {
        assessment.value = listRes.data[0]
        syncResponsesFromAssessment(listRes.data[0])
        await loadAssessmentMapData()
      } else {
        const createRes = await createAssessment({ settlement_id: settlementId.value })
        if (createRes.code === '0000') {
          assessment.value = createRes.data
          await loadAssessmentMapData()
        }
      }
    } else {
      ElMessage.error('Settlement or project location required')
    }
  } catch (e: any) {
    ElMessage.error(e?.message || 'Failed to load assessment')
  } finally {
    loading.value = false
  }
}

const syncResponsesFromAssessment = (a: ClimateAssessment) => {
  for (const dim of dimensions) {
    const data = (a as any)[`${dim}_responses`] || {}
    responses.value[dim] = { ...data }
  }
}

const saveAssessment = async () => {
  if (!assessment.value?.id) return
  saving.value = true
  try {
    const res = await updateAssessment(assessment.value.id, {
      hazard_responses: responses.value.hazard,
      exposure_responses: responses.value.exposure,
      sensitivity_responses: responses.value.sensitivity,
      adaptive_capacity_responses: responses.value.adaptive_capacity
    })
    if (res.code === '0000') {
      assessment.value = res.data
      ElMessage.success('Assessment saved')
    } else {
      ElMessage.error(res.message || 'Failed to save')
    }
  } catch (e: any) {
    ElMessage.error(e?.message || 'Failed to save')
  } finally {
    saving.value = false
  }
}

const markCompleted = async () => {
  if (!assessment.value?.id) return
  saving.value = true
  try {
    const res = await updateAssessment(assessment.value.id, { status: 'completed' })
    if (res.code === '0000') {
      assessment.value = res.data
      ElMessage.success('Marked as completed')
    }
  } catch (e: any) {
    ElMessage.error(e?.message || 'Failed to update')
  } finally {
    saving.value = false
  }
}

const goBack = () => {
  if (assessment.value?.settlement_id) {
    router.push({ name: 'SettlementDetails', params: { id: String(assessment.value.settlement_id) } })
  } else {
    router.push({ path: '/data/settlement/list' })
  }
}

watch(activeTab, async () => {
  if (activeTab.value === 'docs') {
    if (!docsLoadedOnce.value && !docsLoading.value) {
      await loadDocumentation()
    }
    return
  }
  if (activeTab.value === 'howto' || activeTab.value === 'overall') return
  const cats = questionsConfig.value?.[activeTab.value]?.categories || []
  const firstKey = cats[0]?.key ?? ''
  if (!activeCategoryByTab.value[activeTab.value]) {
    activeCategoryByTab.value[activeTab.value] = firstKey
  }
})

onMounted(async () => {
  await loadQuestions()
  await loadRecommendations()
  await loadOrCreateAssessment()
  for (const dim of dimensions) {
    const cats = questionsConfig.value?.[dim]?.categories || []
    activeCategoryByTab.value[dim] = cats[0]?.key ?? ''
  }
})
</script>

<style scoped>
.climate-assessment-container {
  width: 100%;
}
.assessment-card {
  width: 100%;
}
.card-header {
  padding-bottom: 8px;
}
.header-top {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}
.header-top .el-button:last-child {
  margin-left: auto;
}
.card-header h2 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
}
.context-name {
  margin: 4px 0 12px;
  color: var(--el-text-color-secondary);
  font-size: 0.85rem;
}
.assessor-name {
  margin: 0 0 12px;
  color: var(--el-text-color-secondary);
  font-size: 0.8rem;
}
.assessment-tabs {
  margin-top: 0;
}
.tab-content {
  padding-top: 12px;
}
.map-tab-content .settlement-map-wrapper {
  width: 100%;
  height: 60vh;
  min-height: 400px;
  position: relative;
}
.map-tab-content .map-hint {
  margin-top: 8px;
  color: var(--el-text-color-secondary);
  font-size: 13px;
}
.overall-score-content {
  padding: 24px 0;
}
.scores-grid {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.score-card {
  text-align: center;
  padding: 20px 16px;
  background: var(--el-fill-color-light);
  border-radius: 12px;
  transition: transform 0.2s, box-shadow 0.2s;
  cursor: pointer;
}
.score-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}
.score-icon {
  font-size: 1.4rem;
  vertical-align: middle;
  margin-right: 4px;
}
.score-card-hazard .score-icon { color: var(--el-color-warning); }
.score-card-exposure .score-icon { color: var(--el-color-primary); }
.score-card-sensitivity .score-icon { color: var(--el-color-danger); }
.score-card-adaptive .score-icon { color: var(--el-color-success); }

/* ElStatistic overrides inside score cards */
.score-card :deep(.el-statistic__head) {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  font-size: 0.82rem;
  color: var(--el-text-color-secondary);
  margin-bottom: 2px;
}
.score-card :deep(.el-statistic__content) {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 2px;
}
.score-card :deep(.el-statistic__number) {
  font-size: 1.65rem;
  font-weight: 700;
}
.score-range {
  font-size: 0.85rem;
  font-weight: 400;
  color: var(--el-text-color-placeholder);
}
.score-range-line {
  display: block;
  margin-top: 8px;
  font-size: 0.65rem;
  color: var(--el-text-color-placeholder);
  letter-spacing: 0.02em;
}
.range-best {
  color: var(--el-color-success);
  font-weight: 600;
}
.range-worst {
  color: var(--el-color-danger);
  font-weight: 600;
}

/* ── score-level backgrounds ── */
.score-card.level-low {
  background: var(--el-color-success-light-9, #f0f9eb);
  border: 1px solid var(--el-color-success-light-5, #b3e19d);
}
.score-card.level-low :deep(.el-statistic__number) { color: var(--el-color-success); }

.score-card.level-medium {
  background: var(--el-color-warning-light-9, #fdf6ec);
  border: 1px solid var(--el-color-warning-light-5, #f3d19e);
}
.score-card.level-medium :deep(.el-statistic__number) { color: var(--el-color-warning-dark-2, #b88230); }

.score-card.level-high {
  background: var(--el-color-danger-light-9, #fef0f0);
  border: 1px solid var(--el-color-danger-light-5, #fab6b6);
}
.score-card.level-high :deep(.el-statistic__number) { color: var(--el-color-danger); }
.rating-row {
  margin-top: 8px;
}
.rating-section {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}
.rating-title {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--el-text-color-primary);
}
.rating-desc {
  font-size: 0.7rem;
  color: var(--el-text-color-secondary);
  font-family: monospace;
}
.rating-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
}
.rating-icon {
  font-size: 1.1rem;
}
.score-placeholder {
  color: var(--el-text-color-secondary);
  text-align: center;
  padding: 24px;
}
.info-content {
  padding: 20px 0;
  max-width: 640px;
}
.info-section {
  margin-bottom: 24px;
}
.info-section:last-child {
  margin-bottom: 0;
}
.info-heading {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 12px;
  font-size: 1.1rem;
  font-weight: 600;
}
.info-heading .el-icon {
  color: var(--el-color-primary);
}
.info-intro {
  margin: 0 0 16px;
  color: var(--el-text-color-regular);
  line-height: 1.6;
}
.info-subheading {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 8px;
  font-size: 0.95rem;
  font-weight: 600;
}
.info-dim-icon.hazard { color: var(--el-color-warning); }
.info-dim-icon.exposure { color: var(--el-color-primary); }
.info-dim-icon.sensitivity { color: var(--el-color-danger); }
.info-dim-icon.adaptive { color: var(--el-color-success); }
.info-dim-icon.rating { color: var(--el-color-info); }
.info-dim-icon.risk { color: var(--el-color-danger); }
.info-section p {
  margin: 0;
  color: var(--el-text-color-regular);
  line-height: 1.6;
  font-size: 0.9rem;
}
.info-list {
  margin: 8px 0 0;
  padding-left: 20px;
  color: var(--el-text-color-regular);
  line-height: 1.8;
  font-size: 0.9rem;
}
.assessment-actions {
  display: flex;
  gap: 8px;
  justify-content: space-between;
  padding-top: 16px;
  margin-top: 16px;
  border-top: 1px solid var(--el-border-color);
}

.docs-header-row {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 12px;
}

.docs-list-wrapper {
  margin-top: 8px;
}

.docs-footer-row {
  margin-top: 16px;
  display: flex;
  justify-content: flex-start;
}

/* ── Recommendations tab ── */
.recommendations-content {
  padding: 8px 0;
}
.rec-type-tabs {
  margin-top: 4px;
}
.rec-download-section {
  margin-bottom: 4px;
  display: flex;
  justify-content: flex-end;
}
.rec-table-wrapper {
  margin-top: 16px;
}
.rec-dim-cell {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 500;
}
.rec-dim-icon-small {
  font-size: 1rem;
}
.rec-dim-icon-small.hazard { color: var(--el-color-warning); }
.rec-dim-icon-small.exposure { color: var(--el-color-primary); }
.rec-dim-icon-small.sensitivity { color: var(--el-color-danger); }
.rec-dim-icon-small.adaptive_capacity { color: var(--el-color-success); }
.rec-cat-cell {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
  padding: 8px 0;
  border-bottom: 2px solid var(--el-border-color);
}
.rec-subcat-cell {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 500;
}
.rec-no-subcat {
  color: var(--el-text-color-placeholder);
  font-style: italic;
}
.rec-table-list {
  margin: 0;
  padding-left: 20px;
  list-style-type: disc;
}
.rec-table-list li {
  margin-bottom: 6px;
  line-height: 1.6;
  color: var(--el-text-color-regular);
  font-size: 0.9rem;
}
.rec-table-list li:last-child {
  margin-bottom: 0;
}

.collapse-title {
  font-weight: 500;
}
.collapse-count {
  margin-left: 8px;
  font-size: 0.75rem;
  color: var(--el-text-color-secondary);
}
.questions-compact {
  padding: 4px 0;
}
.question-inline {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 10px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--el-border-color);
}
.question-inline:last-child {
  margin-bottom: 0;
  padding-bottom: 0;
  border-bottom: none;
}
.q-text {
  flex: 1;
  min-width: 0;
}
.q-label {
  display: block;
  font-size: 0.9rem;
  line-height: 1.4;
}
.q-hint {
  display: block;
  font-size: 0.75rem;
  color: var(--el-text-color-secondary);
  margin-top: 2px;
}
.q-select {
  flex-shrink: 0;
  width: 180px;
}

/* ── Methodology tab ── */
.methodology-content {
  max-width: 100%;
  margin: 0;
  padding: 20px 8px;
  line-height: 1.7;
  color: var(--el-text-color-regular);
  font-size: 0.9rem;
}
.method-heading {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 12px;
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--el-text-color-primary);
}
.method-heading .el-icon {
  color: var(--el-color-primary);
  font-size: 1.2rem;
}
.method-intro {
  margin: 0 0 24px;
}
.method-section {
  margin-bottom: 28px;
}
.method-section:last-child {
  margin-bottom: 0;
}
.method-subheading {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0 0 10px;
  font-size: 1rem;
  font-weight: 600;
  color: var(--el-text-color-primary);
}
.method-icon.vuln { color: var(--el-color-warning); }
.method-icon.risk { color: var(--el-color-danger); }
.method-formula-box {
  background: var(--el-fill-color-light);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  padding: 12px 16px;
  margin-bottom: 12px;
  text-align: center;
}
.method-formula-box code {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--el-color-primary);
}
.method-table {
  margin: 12px 0;
}
.method-note {
  margin-top: 10px;
  padding: 10px 14px;
  background: var(--el-color-info-light-9, #f4f4f5);
  border-left: 3px solid var(--el-color-info);
  border-radius: 4px;
  font-size: 0.85rem;
}
.method-note code {
  font-size: 0.82rem;
  background: rgba(0,0,0,0.04);
  padding: 1px 4px;
  border-radius: 3px;
}
.method-list {
  margin: 8px 0 0;
  padding-left: 22px;
  line-height: 2;
}
.method-section p {
  margin: 0 0 8px;
}
.method-section p:last-child {
  margin-bottom: 0;
}

/* ── Mobile optimisations ── */
@media (max-width: 768px) {
  .score-card {
    padding: 14px 10px;
    border-radius: 10px;
    margin-bottom: 10px;
  }
  .score-card :deep(.el-statistic__number) {
    font-size: 1.35rem;
  }
  .score-card :deep(.el-statistic__head) {
    font-size: 0.75rem;
  }
  .score-icon {
    font-size: 1.15rem;
  }
  .score-range {
    font-size: 0.75rem;
  }
  .score-range-line {
    margin-top: 5px;
    font-size: 0.6rem;
  }
  .overall-score-content {
    padding: 12px 0;
  }
  .scores-grid {
    gap: 12px;
  }
  .rating-row {
    margin-top: 4px;
  }
  .rating-section {
    margin-bottom: 12px;
  }
  .rating-tag {
    padding: 6px 12px;
    font-size: 0.85rem;
  }
  .header-top {
    gap: 8px;
  }
  .card-header h2 {
    font-size: 0.95rem;
  }
  .question-inline {
    flex-direction: column;
    gap: 6px;
  }
  .q-select {
    width: 100%;
  }
  .assessment-actions {
    flex-direction: column;
  }
  .assessment-actions .el-button {
    width: 100%;
  }
  .methodology-content {
    padding: 12px 4px;
    font-size: 0.85rem;
  }
  .method-heading {
    font-size: 1rem;
  }
  .method-formula-box {
    padding: 10px 12px;
  }
  .method-formula-box code {
    font-size: 0.82rem;
  }
  .method-table {
    font-size: 0.8rem;
  }
}

@media (max-width: 480px) {
  .score-card {
    padding: 12px 8px;
    border-radius: 8px;
  }
  .score-card :deep(.el-statistic__number) {
    font-size: 1.2rem;
  }
  .score-card :deep(.el-statistic__head) {
    font-size: 0.7rem;
    gap: 2px;
  }
  .score-icon {
    font-size: 1rem;
  }
  .card-header h2 {
    font-size: 0.85rem;
  }
  .context-name {
    font-size: 0.75rem;
  }
}
</style>

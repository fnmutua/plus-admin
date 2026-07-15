<template>
  <div class="population-settings-container">
    <ElCard class="settings-card">
      <template #header>
        <div class="card-header">
          <h2 class="header-title">Population Settings</h2>
        </div>
      </template>

      <div class="settings-content">
        <ElTabs v-model="activeTab" type="card" class="population-tabs">

          <!-- 1. Bulk Population Update -->
          <ElTabPane label="Bulk Population Update" name="bulk">
            <div class="bulk-update-section">
              <p class="section-desc">
                Estimate population for settlements using the building-based population service.
                Each settlement's boundary is sent to the service to count buildings and estimate population.
              </p>

              <div class="bulk-options">
                <div class="bulk-options-row">
                  <div class="bulk-option-group">
                    <p class="option-label">County</p>
                    <ElSelect v-model="bulkCountyId" placeholder="All counties" clearable filterable style="width: 280px">
                      <ElOption label="All counties" :value="null" />
                      <ElOption v-for="c in countyOptions" :key="c.value" :label="c.label" :value="c.value" />
                    </ElSelect>
                  </div>

                  <div class="bulk-option-group">
                    <p class="option-label">Scope</p>
                    <ElRadioGroup v-model="bulkScope">
                      <ElRadio label="missing">Without population only</ElRadio>
                      <ElRadio label="all" :disabled="!isRootAdmin">All (overwrite existing)</ElRadio>
                    </ElRadioGroup>
                  </div>
                </div>

                <div class="bulk-actions-row">
                  <ElButton
                    type="primary"
                    :loading="bulkRunning"
                    :disabled="bulkRunning"
                    style="width: 100%"
                    @click="startBulkUpdate"
                  >
                    {{ bulkRunning ? 'Updating...' : 'Start Bulk Update' }}
                  </ElButton>
                </div>
              </div>

              <div v-if="bulkTotal > 0" class="bulk-progress">
                <div class="progress-header">
                  <span class="progress-label">
                    {{ bulkDone }} / {{ bulkTotal }} settlements — {{ bulkPercent }}%
                    <ElTag v-if="bulkSkipped > 0" type="info" size="small" style="margin-left:8px">{{ bulkSkipped }} skipped</ElTag>
                    <ElTag v-if="bulkErrors > 0" type="danger" size="small" style="margin-left:4px">{{ bulkErrors }} errors</ElTag>
                  </span>
                  <span v-if="!bulkRunning && bulkDone > 0" class="progress-done-label">Done</span>
                </div>
                <ElProgress :percentage="bulkPercent" :status="bulkProgressStatus" striped :striped-flow="bulkRunning" :duration="6" />
                <div class="log-toolbar">
                  <ElButton size="small" plain @click="downloadPopulationBulkLogCsv" :disabled="bulkLog.length === 0">
                    Download CSV
                  </ElButton>
                </div>
                <div class="bulk-log">
                  <div
                    v-for="(entry, i) in bulkLog"
                    :key="i"
                    :class="['log-entry', `log-${entry.status}`]"
                  >
                    <span class="log-icon">{{ entry.status === 'ok' ? '✓' : entry.status === 'skip' ? '–' : '✗' }}</span>
                    <span class="log-name">{{ entry.name }}</span>
                    <span class="log-msg">{{ entry.msg }}</span>
                  </div>
                </div>
              </div>
            </div>
          </ElTabPane>

          <!-- 2b. Household size from survey data -->
          <ElTabPane label="Household size (surveys)" name="hhavg">
            <div class="bulk-update-section">
              <p class="section-desc">
                Derive <strong>average household size</strong> from surveyed household records (<code>hh_size</code>) for a settlement.
                Survey lists are typically a <em>sample</em> — only <strong>average household size</strong> is written to the settlement; <strong>number of households</strong> is not changed.
              </p>

              <ElTabs v-model="hhSurveySubTab" class="hh-survey-subtabs">
                <ElTabPane label="Single settlement" name="single">
                  <div class="bulk-options">
                    <div class="bulk-options-row">
                      <div class="bulk-option-group hh-survey-settlement-field">
                        <p class="option-label">Settlement</p>
                        <ElSelect
                          v-model="hhSettlementId"
                          filterable
                          remote
                          clearable
                          reserve-keyword
                          placeholder="Type to search by name"
                          :remote-method="searchHhSettlement"
                          :loading="hhSettLoading"
                          style="width: 100%"
                          @change="onHhSettlementPicked"
                        >
                          <ElOption
                            v-for="s in hhSettOptions"
                            :key="s.id"
                            :label="formatHhSettlementLabel(s)"
                            :value="s.id"
                          />
                        </ElSelect>
                      </div>
                    </div>

                    <div v-if="hhSettMeta" class="hh-survey-meta">
                      <div><span class="meta-k">Name</span> {{ hhSettMeta.name || '—' }}</div>
                      <div>
                        <span class="meta-k">Stored avg. HH size</span>
                        {{ hhSettMeta.avg_household_size != null ? Number(hhSettMeta.avg_household_size).toFixed(2) : '—' }}
                      </div>
                      <div>
                        <span class="meta-k">Stored num. households</span>
                        {{ hhSettMeta.num_households != null ? hhSettMeta.num_households : '—' }}
                        <span class="muted"> (not updated from surveys)</span>
                      </div>
                    </div>

                    <div v-if="hhSurveyTotal != null" class="hh-survey-computed">
                      <div>
                        <span class="meta-k">Survey records (sample)</span> {{ hhSurveyTotal }}
                      </div>
                      <div>
                        <span class="meta-k">Computed AVG(hh_size)</span>
                        <strong v-if="hhComputedAvg != null">{{ hhComputedAvg.toFixed(2) }}</strong>
                        <span v-else class="muted">— (no numeric hh_size values)</span>
                      </div>
                    </div>

                    <div class="bulk-actions-row">
                      <ElButton
                        type="primary"
                        plain
                        :loading="hhComputing"
                        :disabled="!hhSettlementId || hhComputing"
                        style="flex: 1"
                        @click="computeHhAvgFromSurveys"
                      >
                        {{ hhComputing ? 'Computing…' : 'Compute from surveys' }}
                      </ElButton>
                      <ElButton
                        type="primary"
                        :loading="hhSaving"
                        :disabled="!hhSettlementId || hhComputedAvg == null || hhSaving"
                        style="flex: 1"
                        @click="applyHhAvgToSettlement"
                      >
                        {{ hhSaving ? 'Saving…' : 'Update settlement' }}
                      </ElButton>
                    </div>
                  </div>
                </ElTabPane>

                <ElTabPane label="Bulk — all settlements" name="bulk">
                  <p class="section-desc section-desc--tab">
                    Computes AVG(<code>hh_size</code>) per settlement and updates <strong>average household size</strong> only (same county / scope pattern as bulk population).
                  </p>
                  <div class="bulk-options">
                    <div class="bulk-options-row">
                      <div class="bulk-option-group">
                        <p class="option-label">County</p>
                        <ElSelect v-model="hhBulkCountyId" placeholder="All counties" clearable filterable style="width: 280px">
                          <ElOption label="All counties" :value="null" />
                          <ElOption v-for="c in countyOptions" :key="c.value" :label="c.label" :value="c.value" />
                        </ElSelect>
                      </div>
                      <div class="bulk-option-group">
                        <p class="option-label">Scope</p>
                        <ElRadioGroup v-model="hhBulkScope">
                          <ElRadio label="missing">Without avg. HH size only</ElRadio>
                          <ElRadio label="all" :disabled="!isRootAdmin">All (overwrite existing)</ElRadio>
                        </ElRadioGroup>
                      </div>
                    </div>
                    <div class="bulk-actions-row">
                      <ElButton
                        type="primary"
                        :loading="hhBulkRunning"
                        :disabled="hhBulkRunning"
                        style="width: 100%"
                        @click="startHhBulkAvgUpdate"
                      >
                        {{ hhBulkRunning ? 'Updating…' : 'Start bulk update' }}
                      </ElButton>
                    </div>
                  </div>

                  <div v-if="hhBulkTotal > 0" class="bulk-progress">
                    <div class="progress-header">
                      <span class="progress-label">
                        {{ hhBulkDone }} / {{ hhBulkTotal }} settlements — {{ hhBulkPercent }}%
                        <ElTag v-if="hhBulkSkipped > 0" type="info" size="small" style="margin-left: 8px">{{ hhBulkSkipped }} skipped</ElTag>
                        <ElTag v-if="hhBulkErrors > 0" type="danger" size="small" style="margin-left: 4px">{{ hhBulkErrors }} errors</ElTag>
                      </span>
                      <span v-if="!hhBulkRunning && hhBulkDone > 0" class="progress-done-label">Done</span>
                    </div>
                    <ElProgress
                      :percentage="hhBulkPercent"
                      :status="hhBulkProgressStatus"
                      striped
                      :striped-flow="hhBulkRunning"
                      :duration="6"
                    />
                    <div class="log-toolbar">
                      <ElButton
                        size="small"
                        plain
                        :disabled="hhBulkLog.length === 0"
                        @click="downloadHhBulkLogCsv"
                      >
                        Download CSV
                      </ElButton>
                    </div>
                    <div class="hh-bulk-table-wrap">
                      <ElTable
                        :data="hhBulkLog"
                        stripe
                        border
                        size="small"
                        class="hh-bulk-table"
                        empty-text="Run a bulk update to see results here"
                        max-height="360"
                      >
                        <ElTableColumn prop="settlement_id" label="ID" width="72" align="right" />
                        <ElTableColumn prop="settlement_name" label="Settlement" min-width="140" show-overflow-tooltip />
                        <ElTableColumn prop="county" label="County" min-width="110" show-overflow-tooltip />
                        <ElTableColumn label="Result" width="88" align="center">
                          <template #default="{ row }">
                            <ElTag
                              size="small"
                              :type="row.status === 'ok' ? 'success' : row.status === 'skip' ? 'info' : 'danger'"
                              effect="plain"
                            >
                              {{ row.status }}
                            </ElTag>
                          </template>
                        </ElTableColumn>
                        <ElTableColumn label="Survey sample" width="114" align="right">
                          <template #default="{ row }">
                            <span v-if="row.sample_records != null">{{ row.sample_records }}</span>
                            <span v-else class="muted-cell">—</span>
                          </template>
                        </ElTableColumn>
                        <ElTableColumn label="Avg before" width="96" align="right">
                          <template #default="{ row }">
                            <span v-if="row.avg_before">{{ row.avg_before }}</span>
                            <span v-else class="muted-cell">—</span>
                          </template>
                        </ElTableColumn>
                        <ElTableColumn label="Avg after" width="88" align="right">
                          <template #default="{ row }">
                            <span v-if="row.avg_after">{{ row.avg_after }}</span>
                            <span v-else class="muted-cell">—</span>
                          </template>
                        </ElTableColumn>
                        <ElTableColumn prop="detail" label="Notes" min-width="200" show-overflow-tooltip />
                      </ElTable>
                    </div>
                  </div>
                </ElTabPane>
              </ElTabs>
            </div>
          </ElTabPane>

          <!-- 2. Density Typology -->
          <ElTabPane label="Density Typology" name="density">
            <div class="bulk-update-section">
              <p class="section-desc">
                Auto-populate each settlement's density-based slum typology by aggregating
                its child <strong>structures</strong>. The built-up area
                (sum of structure footprints) is divided by the total settlement area
                to produce a built-up ratio (%), which is mapped to a category per the
                <em>National Slum Upgrading and Prevention Strategy 2024 - 2034</em>.
              </p>

              <div class="density-thresholds">
                <ElTag type="success" effect="plain">Low Density &lt; {{ densityLowMax }}%</ElTag>
                <ElTag type="warning" effect="plain">Medium Density {{ densityLowMax }}% - {{ densityMediumMax }}%</ElTag>
                <ElTag type="danger" effect="plain">High Density &gt; {{ densityMediumMax }}%</ElTag>
              </div>

              <div class="bulk-options">
                <div class="bulk-options-row">
                  <div class="bulk-option-group">
                    <p class="option-label">County</p>
                    <ElSelect v-model="densityCountyId" placeholder="All counties" clearable filterable style="width: 280px">
                      <ElOption label="All counties" value="" />
                      <ElOption v-for="c in countyOptions" :key="c.value" :label="c.label" :value="c.value" />
                    </ElSelect>
                  </div>

                  <div class="bulk-option-group">
                    <p class="option-label">Scope</p>
                    <ElRadioGroup v-model="densityScope">
                      <ElRadio label="missing">Without typology only</ElRadio>
                      <ElRadio label="all" :disabled="!isRootAdmin">All (overwrite existing)</ElRadio>
                    </ElRadioGroup>
                  </div>

                  <div class="bulk-option-group">
                    <p class="option-label">Thresholds (%)</p>
                    <div class="threshold-inputs">
                      <ElInputNumber
                        v-model="densityLowMax"
                        :min="1"
                        :max="densityMediumMax - 1"
                        :step="1"
                        size="default"
                        controls-position="right"
                        style="width: 110px"
                      />
                      <span class="threshold-sep">-</span>
                      <ElInputNumber
                        v-model="densityMediumMax"
                        :min="densityLowMax + 1"
                        :max="99"
                        :step="1"
                        size="default"
                        controls-position="right"
                        style="width: 110px"
                      />
                    </div>
                  </div>
                </div>

                <div class="bulk-actions-row">
                  <ElButton
                    type="primary"
                    plain
                    :loading="densityComputing"
                    :disabled="densityComputing || densityRunning"
                    style="flex: 1"
                    @click="computeDensityPreview"
                  >
                    {{ densityComputing ? 'Computing...' : 'Compute Preview' }}
                  </ElButton>
                  <ElButton
                    type="primary"
                    :loading="densityRunning"
                    :disabled="densityRunning || densityComputing || (densitySummary?.will_change ?? 0) === 0"
                    style="flex: 1"
                    @click="applyDensityTypology"
                  >
                    {{ densityRunning ? 'Applying...' : 'Apply to Settlements' }}
                  </ElButton>
                </div>
              </div>

              <!-- Summary banner -->
              <div v-if="densitySummary" class="density-summary">
                <div class="density-summary__row">
                  <div class="density-summary__stat">
                    <span class="stat-num">{{ densitySummary.total_evaluated }}</span>
                    <span class="stat-label">evaluated</span>
                  </div>
                  <div class="density-summary__stat">
                    <span class="stat-num stat-num--primary">{{ densitySummary.will_change }}</span>
                    <span class="stat-label">{{ densitySummary.updated != null ? 'updated' : 'will update' }}</span>
                  </div>
                  <div class="density-summary__stat">
                    <span class="stat-num">{{ densitySummary.unchanged }}</span>
                    <span class="stat-label">already correct</span>
                  </div>
                  <div class="density-summary__stat">
                    <span class="stat-num">{{ densitySummary.no_structures }}</span>
                    <span class="stat-label">no structures</span>
                  </div>
                  <div class="density-summary__breakdown">
                    <ElTag size="small" type="success">{{ densityCounts.LOW }} Low</ElTag>
                    <ElTag size="small" type="warning">{{ densityCounts.MEDIUM }} Medium</ElTag>
                    <ElTag size="small" type="danger">{{ densityCounts.HIGH }} High</ElTag>
                  </div>
                </div>
                <div v-if="densityLastApplyAt" class="density-summary__footer">
                  Last applied {{ densityLastApplyAt.toLocaleString() }}
                </div>
              </div>

              <!-- Preview / result table -->
              <div v-if="densityPreview.length > 0" class="density-preview">
                <ElTable
                  :data="densityPreview"
                  size="small"
                  border
                  stripe
                  height="360"
                  class="density-table"
                >
                  <ElTableColumn prop="name" label="Settlement" min-width="160" show-overflow-tooltip />
                  <ElTableColumn label="Structures" prop="structure_count" width="110" align="right" />
                  <ElTableColumn label="Built-up (Ha.)" width="130" align="right">
                    <template #default="{ row }">
                      {{ row.built_up_area_ha?.toFixed(2) ?? '—' }}
                    </template>
                  </ElTableColumn>
                  <ElTableColumn label="Total (Ha.)" width="120" align="right">
                    <template #default="{ row }">
                      {{ row.settlement_area_ha?.toFixed(2) ?? '—' }}
                    </template>
                  </ElTableColumn>
                  <ElTableColumn label="Built-up Ratio" width="140" align="right">
                    <template #default="{ row }">
                      <span v-if="row.built_up_ratio == null" class="muted">—</span>
                      <span v-else>{{ row.built_up_ratio.toFixed(2) }}%</span>
                    </template>
                  </ElTableColumn>
                  <ElTableColumn label="Current" width="140">
                    <template #default="{ row }">
                      <span v-if="!row.current_typology" class="muted">—</span>
                      <ElTag v-else size="small" :type="typologyTagType(row.current_typology)" effect="plain">
                        {{ typologyShortLabel(row.current_typology) }}
                      </ElTag>
                    </template>
                  </ElTableColumn>
                  <ElTableColumn label="New" width="140">
                    <template #default="{ row }">
                      <span v-if="!row.new_typology" class="muted">—</span>
                      <ElTag v-else size="small" :type="typologyTagType(row.new_typology)" effect="dark">
                        {{ typologyShortLabel(row.new_typology) }}
                      </ElTag>
                    </template>
                  </ElTableColumn>
                  <ElTableColumn label="Status" width="110">
                    <template #default="{ row }">
                      <ElTag v-if="row.new_typology === null" size="small" type="info">skip</ElTag>
                      <ElTag v-else-if="row.current_typology === row.new_typology" size="small" type="info" effect="plain">unchanged</ElTag>
                      <ElTag v-else size="small" type="primary" effect="plain">{{ densityLastApplyAt ? 'updated' : 'will update' }}</ElTag>
                    </template>
                  </ElTableColumn>
                </ElTable>
              </div>
            </div>
          </ElTabPane>

          <!-- 4. County growth rates -->
          <ElTabPane label="County growth rates" name="rates">
            <div class="bulk-update-section">
              <p class="section-desc">
                Annual compound growth by county and year. Enter separate rates for <strong>population (Pop)</strong> and <strong>households (HH)</strong> as percent, e.g. <code>2.8</code> = 2.8%.
                Male/female splits use county census ratios when projecting — not stored here.
              </p>

              <div class="bulk-options">
                <div class="bulk-options-row">
                  <div class="bulk-option-group">
                    <p class="option-label">County</p>
                    <ElSelect v-model="rateFilterCountyId" placeholder="All counties" clearable filterable style="width: 280px" @change="loadCountyRates">
                      <ElOption label="All counties" :value="null" />
                      <ElOption v-for="c in countyOptions" :key="c.value" :label="c.label" :value="c.value" />
                    </ElSelect>
                  </div>
                  <div class="bulk-option-group">
                    <p class="option-label">Year range</p>
                    <div class="threshold-inputs">
                      <ElInputNumber v-model="rateFromYear" :min="2000" :max="rateToYear" controls-position="right" style="width: 120px" @change="loadCountyRates" />
                      <span class="threshold-sep">–</span>
                      <ElInputNumber v-model="rateToYear" :min="rateFromYear" :max="2100" controls-position="right" style="width: 120px" @change="loadCountyRates" />
                    </div>
                  </div>
                </div>
                <div class="bulk-actions-row">
                  <ElButton type="primary" plain :loading="ratesLoading" @click="loadCountyRates">Reload</ElButton>
                  <ElButton type="primary" :loading="ratesSaving" :disabled="ratesSaving" @click="saveCountyRates">Save rates</ElButton>
                </div>
              </div>

              <div v-if="rateGridRows.length > 0" class="rates-grid-wrap">
                <ElTable :data="rateGridRows" size="small" border stripe height="420" class="rates-table">
                  <ElTableColumn prop="label" label="County" min-width="160" fixed show-overflow-tooltip />
                  <ElTableColumn
                    v-for="year in rateYearColumns"
                    :key="year"
                    :label="String(year)"
                    width="136"
                    align="center"
                  >
                    <template #default="{ row }">
                      <div class="rate-cell">
                        <div class="rate-cell__row">
                          <span class="rate-cell__label">Pop</span>
                          <ElInputNumber
                            :key="`pop-${ratesGridEpoch}-${row.countyId}-${year}`"
                            :model-value="getPopRatePercent(row.countyId, year)"
                            size="small"
                            :step="0.001"
                            :precision="3"
                            controls-position="right"
                            class="rate-cell__input"
                            @update:model-value="(v: number | undefined) => setPopRatePercent(row.countyId, year, v)"
                          />
                        </div>
                        <div class="rate-cell__row">
                          <span class="rate-cell__label">HH</span>
                          <ElInputNumber
                            :key="`hh-${ratesGridEpoch}-${row.countyId}-${year}`"
                            :model-value="getHhRatePercent(row.countyId, year)"
                            size="small"
                            :step="0.001"
                            :precision="3"
                            controls-position="right"
                            class="rate-cell__input"
                            @update:model-value="(v: number | undefined) => setHhRatePercent(row.countyId, year, v)"
                          />
                        </div>
                      </div>
                    </template>
                  </ElTableColumn>
                </ElTable>
              </div>
              <ElEmpty v-else-if="!ratesLoading" description="Load counties to edit growth rates" />
            </div>
          </ElTabPane>

          <!-- 5. Annual projections -->
          <ElTabPane label="Annual projections" name="projections">
            <div class="bulk-update-section">
              <p class="section-desc">
                Three-step workflow: import a <strong>{{ baselineYear }}</strong> settlement baseline, load county growth rates, then project forward into <code>settlement_population</code>.
              </p>

              <ElTabs v-model="projectionsSubTab" class="projections-subtabs">
                <ElTabPane label="Import baseline" name="baseline">
              <div class="baseline-import-block">
                <p class="option-label">Import baseline (Excel)</p>
                <p class="section-desc section-desc--tab">
                  Columns: <code>id</code>, <code>code</code>, <code>population</code>, <code>pop_male</code>, <code>pop_female</code>, <code>num_households</code>.
                  Match settlements by <strong>id</strong> or <strong>code</strong> (at least one required per row).
                </p>
                <div class="bulk-options-row">
                  <div class="bulk-option-group">
                    <p class="option-label">Baseline year</p>
                    <ElInputNumber v-model="baselineYear" :min="2000" :max="projectThroughYear - 1" controls-position="right" style="width: 120px" />
                  </div>
                  <div class="bulk-option-group">
                    <ElCheckbox v-model="baselineImportSyncSettlement">Also update settlement population fields</ElCheckbox>
                  </div>
                </div>
                <div class="bulk-actions-row baseline-import-actions">
                  <ElButton type="primary" plain @click="downloadBaselineTemplate">Download template</ElButton>
                  <ElUpload
                    :auto-upload="false"
                    :limit="1"
                    accept=".xlsx,.xls"
                    :show-file-list="true"
                    :on-change="onBaselineFileChange"
                    :on-remove="onBaselineFileRemove"
                  >
                    <ElButton type="primary" plain>Select Excel file</ElButton>
                  </ElUpload>
                  <ElButton
                    type="primary"
                    plain
                    :loading="baselineImportPreviewing"
                    :disabled="!baselineImportFile || baselineImportPreviewing"
                    @click="previewBaselineImport"
                  >
                    Preview import
                  </ElButton>
                  <ElButton
                    type="primary"
                    :loading="baselineImporting"
                    :disabled="!baselineImportFile || baselineImporting"
                    @click="applyBaselineImport"
                  >
                    Import baseline
                  </ElButton>
                </div>
                <div v-if="baselineImportSummary" class="density-summary">
                  <div class="density-summary__row">
                    <div class="density-summary__stat">
                      <span class="stat-num">{{ baselineImportSummary.total_rows ?? '—' }}</span>
                      <span class="stat-label">rows read</span>
                    </div>
                    <div class="density-summary__stat">
                      <span class="stat-num stat-num--primary">{{ baselineImportSummary.imported ?? baselineImportSummary.would_write ?? '—' }}</span>
                      <span class="stat-label">{{ baselineImportSummary.dry_run ? 'would import' : 'imported' }}</span>
                    </div>
                    <div class="density-summary__stat">
                      <span class="stat-num">{{ baselineImportSummary.errors ?? 0 }}</span>
                      <span class="stat-label">errors</span>
                    </div>
                  </div>
                </div>
                <div v-if="baselineImportResults.length > 0" class="density-preview">
                  <ElTable :data="baselineImportResults" size="small" border stripe height="280">
                    <ElTableColumn prop="excel_row" label="Row" width="64" align="right" />
                    <ElTableColumn label="Result" width="80" align="center">
                      <template #default="{ row }">
                        <ElTag size="small" :type="row.status === 'ok' ? 'success' : 'danger'" effect="plain">
                          {{ row.status }}
                        </ElTag>
                      </template>
                    </ElTableColumn>
                    <ElTableColumn prop="settlement_name" label="Settlement" min-width="140" show-overflow-tooltip />
                    <ElTableColumn prop="settlement_code" label="Code" width="110" show-overflow-tooltip />
                    <ElTableColumn label="Population" width="100" align="right">
                      <template #default="{ row }">{{ row.population != null ? Number(row.population).toLocaleString() : '—' }}</template>
                    </ElTableColumn>
                    <ElTableColumn prop="detail" label="Notes" min-width="180" show-overflow-tooltip />
                  </ElTable>
                </div>
              </div>
                </ElTabPane>

                <ElTabPane label="Import growth rates" name="rates">
              <div class="baseline-import-block rates-import-panel">
                <div class="rates-import-panel__head">
                  <div>
                    <p class="option-label">Import county growth rates</p>
                    <p class="section-desc section-desc--tab">
                      Upload population and household rate files separately. Preview before importing — rows merge by <code>county_id</code> and year.
                    </p>
                  </div>
                  <div class="rates-import-steps">
                    <span :class="['rates-step', { 'rates-step--done': ratesHasAnyFile }]">1. Upload</span>
                    <span class="rates-step__sep">→</span>
                    <span :class="['rates-step', { 'rates-step--done': ratesImportPreviewed }]">2. Preview</span>
                    <span class="rates-step__sep">→</span>
                    <span :class="['rates-step', { 'rates-step--done': ratesImportApplied }]">3. Import</span>
                  </div>
                </div>

                <div class="rates-upload-grid">
                  <div :class="['rates-upload-card', { 'rates-upload-card--ready': ratesPopImportFile }]">
                    <div class="rates-upload-card__title">
                      <ElIcon class="rates-upload-card__icon"><DataLine /></ElIcon>
                      <div>
                        <strong>Population rates</strong>
                        <span>Wide CSV/Excel with <code>county_id</code> + <code>growth_rate_pct_YYYY</code></span>
                      </div>
                    </div>
                    <ElUpload
                      v-if="!ratesPopImportFile"
                      class="rates-dropzone"
                      drag
                      :auto-upload="false"
                      :limit="1"
                      accept=".xlsx,.xls,.csv"
                      :show-file-list="false"
                      :on-change="onPopRateFileChange"
                    >
                      <ElIcon class="rates-dropzone__icon"><UploadFilled /></ElIcon>
                      <p class="rates-dropzone__title">Drop file here or click to browse</p>
                      <p class="rates-dropzone__hint">.xlsx, .xls, .csv</p>
                    </ElUpload>
                    <div v-else class="rates-file-selected">
                      <ElIcon class="rates-file-selected__icon"><Document /></ElIcon>
                      <div class="rates-file-selected__meta">
                        <span class="rates-file-selected__name">{{ ratesPopImportFile.name }}</span>
                        <span class="rates-file-selected__size">{{ formatFileSize(ratesPopImportFile.size) }}</span>
                      </div>
                      <ElButton type="danger" link @click="clearPopRateFile">Remove</ElButton>
                    </div>
                    <ElButton type="primary" link class="rates-template-link" @click="downloadPopRateTemplate">
                      Download population template
                    </ElButton>
                  </div>

                  <div :class="['rates-upload-card', { 'rates-upload-card--ready': ratesHhImportFile }]">
                    <div class="rates-upload-card__title">
                      <ElIcon class="rates-upload-card__icon rates-upload-card__icon--hh"><House /></ElIcon>
                      <div>
                        <strong>Household rates</strong>
                        <span>Wide CSV/Excel with <code>county_id</code> + <code>growth_rate_YYYY_percent</code></span>
                      </div>
                    </div>
                    <ElUpload
                      v-if="!ratesHhImportFile"
                      class="rates-dropzone"
                      drag
                      :auto-upload="false"
                      :limit="1"
                      accept=".xlsx,.xls,.csv"
                      :show-file-list="false"
                      :on-change="onHhRateFileChange"
                    >
                      <ElIcon class="rates-dropzone__icon"><UploadFilled /></ElIcon>
                      <p class="rates-dropzone__title">Drop file here or click to browse</p>
                      <p class="rates-dropzone__hint">.xlsx, .xls, .csv</p>
                    </ElUpload>
                    <div v-else class="rates-file-selected">
                      <ElIcon class="rates-file-selected__icon"><Document /></ElIcon>
                      <div class="rates-file-selected__meta">
                        <span class="rates-file-selected__name">{{ ratesHhImportFile.name }}</span>
                        <span class="rates-file-selected__size">{{ formatFileSize(ratesHhImportFile.size) }}</span>
                      </div>
                      <ElButton type="danger" link @click="clearHhRateFile">Remove</ElButton>
                    </div>
                    <ElButton type="primary" link class="rates-template-link" @click="downloadHhRateTemplate">
                      Download household template
                    </ElButton>
                  </div>
                </div>

                <ElCollapse class="rates-format-help">
                  <ElCollapseItem title="File format reference" name="formats">
                    <ul class="rates-format-list">
                      <li><strong>Population (wide):</strong> <code>county_id</code>, <code>code</code>, <code>county</code>, <code>growth_rate_pct_2020</code> … <code>growth_rate_pct_2040</code></li>
                      <li><strong>Household (wide):</strong> <code>county_id</code>, <code>code</code>, <code>county</code>, optional <code>households_YYYY</code>, <code>growth_rate_YYYY_percent</code>, <code>data_note</code></li>
                      <li><strong>Long format</strong> (either file): <code>county_id</code> or <code>code</code>, <code>year</code>, <code>rate</code> as percent (e.g. <code>2.8</code>)</li>
                      <li>Reference files live in <code>tools/growth_rates/</code> — ready to upload as-is.</li>
                    </ul>
                  </ElCollapseItem>
                </ElCollapse>

                <div class="rates-action-bar">
                  <div class="rates-action-bar__status">
                    <ElTag v-if="ratesPopImportFile" type="success" effect="plain" size="small">Pop file ready</ElTag>
                    <ElTag v-else type="info" effect="plain" size="small">Pop file optional</ElTag>
                    <ElTag v-if="ratesHhImportFile" type="success" effect="plain" size="small">HH file ready</ElTag>
                    <ElTag v-else type="info" effect="plain" size="small">HH file optional</ElTag>
                  </div>
                  <div class="rates-action-bar__buttons">
                    <ElButton
                      type="primary"
                      plain
                      :loading="ratesImportPreviewing"
                      :disabled="!ratesHasAnyFile || ratesImportPreviewing || ratesImporting"
                      @click="previewRatesImport"
                    >
                      Preview import
                    </ElButton>
                    <ElButton
                      type="primary"
                      :loading="ratesImporting"
                      :disabled="!ratesCanImport"
                      @click="applyRatesImport"
                    >
                      Import rates
                    </ElButton>
                  </div>
                </div>

                <ElAlert
                  v-if="ratesImportSummary && ratesImportErrorCount > 0 && ratesImportSummary.dry_run"
                  type="warning"
                  :closable="false"
                  show-icon
                  class="rates-import-alert"
                  :title="`${ratesImportErrorCount} row(s) will fail — fix the file or import only valid rows after review.`"
                />

                <div v-if="ratesImportSummary" class="density-summary rates-import-summary">
                  <div class="density-summary__row">
                    <div class="density-summary__stat">
                      <span class="stat-num">{{ ratesImportSummary.pop_file_rows ?? 0 }}</span>
                      <span class="stat-label">pop rows parsed</span>
                    </div>
                    <div class="density-summary__stat">
                      <span class="stat-num">{{ ratesImportSummary.hh_file_rows ?? 0 }}</span>
                      <span class="stat-label">HH rows parsed</span>
                    </div>
                    <div class="density-summary__stat">
                      <span class="stat-num stat-num--primary">{{ ratesImportSummary.imported ?? ratesImportSummary.would_write ?? '—' }}</span>
                      <span class="stat-label">{{ ratesImportSummary.dry_run ? 'would import' : 'imported' }}</span>
                    </div>
                    <div class="density-summary__stat">
                      <span class="stat-num" :class="{ 'stat-num--danger': ratesImportErrorCount > 0 }">{{ ratesImportErrorCount }}</span>
                      <span class="stat-label">errors</span>
                    </div>
                    <div class="density-summary__breakdown">
                      <ElTag v-if="ratesImportSummary.pop_file_format" size="small" effect="plain">
                        Pop: {{ ratesImportSummary.pop_file_format }}
                      </ElTag>
                      <ElTag v-if="ratesImportSummary.hh_file_format" size="small" effect="plain">
                        HH: {{ ratesImportSummary.hh_file_format }}
                      </ElTag>
                    </div>
                  </div>
                </div>

                <div v-if="ratesImportResults.length > 0" class="rates-results">
                  <div class="rates-results__toolbar">
                    <span class="rates-results__title">
                      Preview results
                      <span class="rates-results__count">({{ ratesImportDisplayedResults.length }} shown)</span>
                    </span>
                    <div class="rates-results__filters">
                      <ElRadioGroup v-model="ratesImportResultFilter" size="small">
                        <ElRadioButton label="all">All</ElRadioButton>
                        <ElRadioButton label="ok">OK</ElRadioButton>
                        <ElRadioButton label="error">Errors</ElRadioButton>
                      </ElRadioGroup>
                    </div>
                  </div>
                  <ElTable :data="ratesImportDisplayedResults" size="small" border stripe max-height="320" class="rates-results-table">
                    <ElTableColumn prop="county_id" label="ID" width="56" align="right" />
                    <ElTableColumn prop="county_name" label="County" min-width="120" show-overflow-tooltip />
                    <ElTableColumn prop="year" label="Year" width="68" align="right" />
                    <ElTableColumn label="Pop %" width="76" align="right">
                      <template #default="{ row }">
                        <span v-if="row.pop_rate_percent != null">{{ row.pop_rate_percent }}</span>
                        <span v-else class="muted-cell">—</span>
                      </template>
                    </ElTableColumn>
                    <ElTableColumn label="HH %" width="76" align="right">
                      <template #default="{ row }">
                        <span v-if="row.hh_rate_percent != null">{{ row.hh_rate_percent }}</span>
                        <span v-else class="muted-cell">—</span>
                      </template>
                    </ElTableColumn>
                    <ElTableColumn label="Status" width="84" align="center">
                      <template #default="{ row }">
                        <ElTag size="small" :type="row.status === 'ok' ? 'success' : 'danger'" effect="plain">
                          {{ row.status }}
                        </ElTag>
                      </template>
                    </ElTableColumn>
                    <ElTableColumn prop="detail" label="Detail" min-width="180" show-overflow-tooltip />
                  </ElTable>
                </div>
              </div>
                </ElTabPane>

                <ElTabPane label="Project forward" name="project">
              <p class="option-label">Project forward</p>
              <p class="section-desc section-desc--tab">
                Writes projected rows to <code>settlement_population</code> from the <strong>{{ baselineYear }}</strong> baseline through <strong>Project through</strong>.
                <strong>Population</strong> and <strong>male/female</strong> use the county population rate; <strong>households</strong> use the household rate.
                When enabled, the <strong>settlement</strong> master is updated from the <strong>{{ currentCalendarYear }}</strong> projected row (population, pop_male, pop_female, num_households).
              </p>

              <div class="bulk-options">
                <div class="bulk-options-row">
                  <div class="bulk-option-group">
                    <p class="option-label">County</p>
                    <ElSelect v-model="projCountyId" placeholder="All counties" clearable filterable style="width: 280px">
                      <ElOption label="All counties" :value="null" />
                      <ElOption v-for="c in countyOptions" :key="c.value" :label="c.label" :value="c.value" />
                    </ElSelect>
                  </div>
                  <div class="bulk-option-group">
                    <p class="option-label">Project through</p>
                    <ElInputNumber v-model="projectThroughYear" :min="baselineYear + 1" :max="2100" controls-position="right" style="width: 120px" />
                  </div>
                </div>
                <div class="bulk-options-row">
                  <div class="bulk-option-group">
                    <ElCheckbox v-model="projSyncSettlement">
                      Update settlement master to {{ currentCalendarYear }} (population, male, female, households)
                    </ElCheckbox>
                  </div>
                </div>
                <p v-if="projSyncSettlement && projectThroughYear < currentCalendarYear" class="section-desc section-desc--tab proj-sync-warning">
                  Set <strong>Project through</strong> to at least {{ currentCalendarYear }} to update the settlement master for this year.
                </p>
                <div class="bulk-actions-row">
                  <ElButton type="primary" plain :loading="projPreviewing" @click="previewProjection">Preview projection</ElButton>
                  <ElButton type="primary" :loading="projApplying" @click="applyProjection">Run projection</ElButton>
                </div>
              </div>

              <div v-if="projSummary" class="density-summary">
                <div class="density-summary__row">
                  <div class="density-summary__stat">
                    <span class="stat-num">{{ projSummary.baselines_found ?? projSummary.total_candidates ?? '—' }}</span>
                    <span class="stat-label">baselines</span>
                  </div>
                  <div class="density-summary__stat">
                    <span class="stat-num stat-num--primary">{{ projSummary.would_write ?? projSummary.rows_written ?? '—' }}</span>
                    <span class="stat-label">{{ projSummary.dry_run ? 'would write' : 'rows written' }}</span>
                  </div>
                  <div class="density-summary__stat">
                    <span class="stat-num">{{ projSummary.settlements_projected ?? '—' }}</span>
                    <span class="stat-label">settlements</span>
                  </div>
                  <div v-if="projSummary.missing_rate_events" class="density-summary__stat">
                    <span class="stat-num">{{ projSummary.missing_rate_events }}</span>
                    <span class="stat-label">missing rates</span>
                  </div>
                  <div v-if="projSummary.sync_settlement_year" class="density-summary__stat">
                    <span class="stat-num stat-num--primary">{{ projSummary.settlements_synced ?? projSummary.would_sync_settlement ?? '—' }}</span>
                    <span class="stat-label">{{ projSummary.dry_run ? 'would sync master' : 'master synced' }} ({{ projSummary.sync_settlement_year }})</span>
                  </div>
                </div>
              </div>

              <div v-if="projPreviewRows.length > 0" class="density-preview">
                <ElTable :data="projPreviewRows" size="small" border stripe height="320">
                  <ElTableColumn prop="settlement_name" label="Settlement" min-width="140" show-overflow-tooltip />
                  <ElTableColumn prop="year" label="Year" width="72" align="right" />
                  <ElTableColumn label="Population" width="110" align="right">
                    <template #default="{ row }">{{ row.population?.toLocaleString?.() ?? row.population }}</template>
                  </ElTableColumn>
                  <ElTableColumn label="Male" width="90" align="right">
                    <template #default="{ row }">{{ row.pop_male != null ? Number(row.pop_male).toLocaleString() : '—' }}</template>
                  </ElTableColumn>
                  <ElTableColumn label="Female" width="90" align="right">
                    <template #default="{ row }">{{ row.pop_female != null ? Number(row.pop_female).toLocaleString() : '—' }}</template>
                  </ElTableColumn>
                  <ElTableColumn label="Households" width="100" align="right">
                    <template #default="{ row }">{{ row.num_households != null ? Number(row.num_households).toLocaleString() : '—' }}</template>
                  </ElTableColumn>
                  <ElTableColumn prop="source" label="Source" width="110" />
                </ElTable>
              </div>
                </ElTabPane>
              </ElTabs>
            </div>
          </ElTabPane>

        </ElTabs>
      </div>
    </ElCard>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import {
  ElCard,
  ElTabs,
  ElTabPane,
  ElButton,
  ElTag,
  ElEmpty,
  ElMessage,
  ElProgress,
  ElRadioGroup,
  ElRadio,
  ElSelect,
  ElOption,
  ElInputNumber,
  ElTable,
  ElTableColumn,
  ElCheckbox,
  ElUpload,
  ElDivider,
  ElCollapse,
  ElCollapseItem,
  ElIcon,
  ElAlert,
  ElMessageBox,
  ElRadioButton
} from 'element-plus'
import { UploadFilled, Document, DataLine, House } from '@element-plus/icons-vue'
import * as XLSX from 'xlsx'
import {
  updateOneRecord,
  applySettlementDensityTypology,
  startSettlementPopulationEstimateJob,
  getSettlementPopulationEstimateJobStatus,
  applySettlementSurveyHhAvg,
  searchByKeyWord,
  getOneSettlement,
  listCountyPopulationGrowthRates,
  saveCountyPopulationGrowthRates,
  importSettlementPopulationBaselineExcel,
  importCountyPopulationGrowthRatesExcel,
  applySettlementPopulationProjection,
  type BaselineImportResultRow,
  type CountyRateImportResultRow,
  type DensityTypologyComputeRow,
  type DensityTypologySummary
} from '@/api/settlements'
import { getFilteredHouseholdsByColumn } from '@/api/households'
import { getListWithoutGeo } from '@/api/counties'
import { getSummarybyFieldFromMultipleIncludes } from '@/api/summary'
import { useAppStoreWithOut } from '@/store/modules/app'
import { useCache } from '@/hooks/web/useCache'

const activeTab = ref('bulk')
const hhSurveySubTab = ref<'single' | 'bulk'>('single')
const projectionsSubTab = ref<'baseline' | 'rates' | 'project'>('baseline')

// ── Auth ─────────────────────────────────────────────────────────────────────
const { wsCache } = useCache()
const appStore = useAppStoreWithOut()
const userInfo = wsCache.get(appStore.getUserInfo)

const isRootAdmin = computed(() =>
  userInfo?.roles?.some((role: any) => role.name === 'root_admin') || false
)

// ── Counties ─────────────────────────────────────────────────────────────────

const countyOptions = ref<{ label: string; value: any }[]>([])
const bulkCountyId = ref<any>(null)

const loadCounties = async () => {
  const res = await getListWithoutGeo({
    params: { pageIndex: 1, limit: 100, curUser: 1, model: 'county', searchField: '', searchKeyword: '', sort: 'ASC' }
  })
  countyOptions.value = (res?.data || []).map((c: any) => ({
    label: c.name,
    value: Number(c.id),
  }))
}

// ── Bulk Population Update ───────────────────────────────────────────────────

const bulkScope = ref<'missing' | 'all'>('missing')
const bulkRunning = ref(false)
const bulkTotal = ref(0)
const bulkDone = ref(0)
const bulkSkipped = ref(0)
const bulkErrors = ref(0)
const bulkLog = ref<{ name: string; status: 'ok' | 'skip' | 'error'; msg: string }[]>([])

const bulkPercent = computed(() =>
  bulkTotal.value > 0 ? Math.round((bulkDone.value / bulkTotal.value) * 100) : 0
)
const bulkProgressStatus = computed(() => {
  if (bulkRunning.value) return ''
  if (bulkErrors.value > 0) return 'warning'
  if (bulkDone.value === bulkTotal.value && bulkTotal.value > 0) return 'success'
  return ''
})

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

const startBulkUpdate = async () => {
  bulkRunning.value = true
  bulkTotal.value = 0
  bulkDone.value = 0
  bulkSkipped.value = 0
  bulkErrors.value = 0
  bulkLog.value = []

  try {
    const start: any = await startSettlementPopulationEstimateJob({
      county_id: bulkCountyId.value || null,
      scope: bulkScope.value
    })

    const jobId = start?.data?.job_id
    if (!jobId) throw new Error('Population update job did not return an id')

    ElMessage.info('Population update started in the background.')

    while (true) {
      await wait(3000)
      const statusRes: any = await getSettlementPopulationEstimateJobStatus(jobId)
      const job = statusRes?.data
      if (!job) throw new Error('Could not read population update job status')

      bulkTotal.value = job.total || 0
      bulkDone.value = job.done || 0
      bulkSkipped.value = job.skipped || 0
      bulkErrors.value = job.errors || 0
      bulkLog.value = Array.isArray(job.log) ? job.log : []

      if (job.status === 'failed') {
        throw new Error(job.error || job.message || 'Population update job failed')
      }

      if (job.status === 'completed') {
        const updated = job.updated || 0
        if (bulkTotal.value === 0) {
          ElMessage.info('No settlements match the selected scope.')
        } else {
          ElMessage.success(`Bulk update complete: ${updated} updated, ${bulkSkipped.value} skipped, ${bulkErrors.value} errors.`)
        }
        break
      }
    }
  } catch (e: any) {
    bulkErrors.value = 1
    ElMessage.error(e?.message || 'Failed to update settlement populations')
  } finally {
    bulkRunning.value = false
  }
}

const downloadPopulationBulkLogCsv = () => {
  const header = ['settlement_name', 'status', 'notes']
  const lines = [
    header.join(','),
    ...bulkLog.value.map(r =>
      [
        escapeCsvCell(r.name),
        escapeCsvCell(r.status),
        escapeCsvCell(r.msg)
      ].join(',')
    )
  ]
  const text = `\uFEFF${lines.join('\r\n')}`
  const blob = new Blob([text], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
  a.download = `population-bulk-update-${stamp}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

// ── Household size from survey (per settlement) ─────────────────────────────

const hhSettlementId = ref<number | null>(null)
const hhSettOptions = ref<any[]>([])
const hhSettLoading = ref(false)
const hhSettMeta = ref<{ name?: string; avg_household_size?: number | null; num_households?: number | null } | null>(null)
const hhSurveyTotal = ref<number | null>(null)
const hhComputedAvg = ref<number | null>(null)
const hhComputing = ref(false)
const hhSaving = ref(false)

const hhBulkCountyId = ref<any>(null)
const hhBulkScope = ref<'missing' | 'all'>('missing')
const hhBulkRunning = ref(false)
const hhBulkTotal = ref(0)
const hhBulkDone = ref(0)
const hhBulkSkipped = ref(0)
const hhBulkErrors = ref(0)
type HhBulkLogRow = {
  settlement_id: number
  settlement_name: string
  county: string
  status: 'ok' | 'skip' | 'error'
  sample_records: number | null
  avg_before: string
  avg_after: string
  detail: string
}

const hhBulkLog = ref<HhBulkLogRow[]>([])

function escapeCsvCell(val: string | number | null | undefined): string {
  if (val == null || val === '') return ''
  const s = String(val)
  if (/[",\r\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

const hhBulkPercent = computed(() =>
  hhBulkTotal.value > 0 ? Math.round((hhBulkDone.value / hhBulkTotal.value) * 100) : 0
)
const hhBulkProgressStatus = computed(() => {
  if (hhBulkRunning.value) return ''
  if (hhBulkErrors.value > 0) return 'warning'
  if (hhBulkDone.value === hhBulkTotal.value && hhBulkTotal.value > 0) return 'success'
  return ''
})

async function fetchSurveyHhAvgForSettlement(settlementId: number): Promise<{ total: number; avg: number | null }> {
  const countRes: any = await getFilteredHouseholdsByColumn({
    limit: 1,
    page: 1,
    curUser: 1,
    model: 'households',
    searchField: '',
    searchKeyword: '',
    filters: ['settlement_id'],
    filterValues: [[settlementId]],
    associated_multiple_models: []
  } as any)
  const total = typeof countRes?.total === 'number' ? countRes.total : 0
  if (total === 0) return { total: 0, avg: null }

  const avgRes: any = await getSummarybyFieldFromMultipleIncludes({
    model: 'households',
    summaryField: 'households.hh_size',
    summaryFunction: 'AVG',
    assoc_models: [],
    groupFields: [],
    filterField: ['settlement_id'],
    filterValue: [[settlementId]],
    filterOperator: ['or']
  })
  const raw = avgRes?.Total?.[0]?.AVG
  if (raw == null || Number.isNaN(parseFloat(raw))) return { total, avg: null }
  return { total, avg: Math.round(parseFloat(raw) * 100) / 100 }
}

const formatHhSettlementLabel = (s: any) => {
  const county = s.county?.name || s.county_id
  const w = s.ward?.name
  const bits = [s.name, county ? String(county) : null, w].filter(Boolean)
  return `${bits.join(' · ')} (ID ${s.id})`
}

const searchHhSettlement = async (keyword: string) => {
  const q = (keyword || '').trim()
  if (q.length < 2) {
    hhSettOptions.value = []
    return
  }
  hhSettLoading.value = true
  try {
    const res: any = await searchByKeyWord({
      curUser: 1,
      model: 'settlement',
      searchField: 'name',
      searchKeyword: q,
      excludeGeom: true,
      excludeGeomAssoc: true,
      associated_multiple_models: ['county', 'subcounty', 'ward']
    } as any)
    hhSettOptions.value = res?.data || []
  } catch {
    hhSettOptions.value = []
  } finally {
    hhSettLoading.value = false
  }
}

const loadHhSettlementMeta = async () => {
  if (!hhSettlementId.value) {
    hhSettMeta.value = null
    return
  }
  try {
    const res: any = await getOneSettlement({ model: 'settlement', id: String(hhSettlementId.value) } as any)
    const d = res?.data
    hhSettMeta.value = d
      ? {
          name: d.name,
          avg_household_size: d.avg_household_size,
          num_households: d.num_households
        }
      : null
  } catch {
    hhSettMeta.value = null
  }
}

const onHhSettlementPicked = async () => {
  hhSurveyTotal.value = null
  hhComputedAvg.value = null
  await loadHhSettlementMeta()
}

const computeHhAvgFromSurveys = async () => {
  if (!hhSettlementId.value) return
  hhComputing.value = true
  hhSurveyTotal.value = null
  hhComputedAvg.value = null
  try {
    const { total, avg } = await fetchSurveyHhAvgForSettlement(hhSettlementId.value)
    hhSurveyTotal.value = total
    if (total === 0) {
      ElMessage.info('No household survey records for this settlement.')
      return
    }
    if (avg == null) {
      hhComputedAvg.value = null
      ElMessage.warning('Could not compute average — check that hh_size is populated on household records.')
      return
    }
    hhComputedAvg.value = avg
    ElMessage.success(`Average household size: ${avg.toFixed(2)} (${total} sample records).`)
  } catch (e: any) {
    ElMessage.error(e?.message || 'Failed to compute household statistics')
  } finally {
    hhComputing.value = false
  }
}

const applyHhAvgToSettlement = async () => {
  if (!hhSettlementId.value || hhComputedAvg.value == null) return
  hhSaving.value = true
  try {
    await updateOneRecord(
      {
        id: hhSettlementId.value,
        model: 'settlement',
        avg_household_size: hhComputedAvg.value
      } as any,
      { silent: true }
    )
    ElMessage.success('Settlement updated with average household size (number of households unchanged).')
    await loadHhSettlementMeta()
  } catch (e: any) {
    ElMessage.error(e?.message || 'Failed to update settlement')
  } finally {
    hhSaving.value = false
  }
}

const downloadHhBulkLogCsv = () => {
  const header = [
    'settlement_id',
    'settlement_name',
    'county',
    'status',
    'survey_sample_count',
    'avg_before',
    'avg_after',
    'notes'
  ]
  const lines = [
    header.join(','),
    ...hhBulkLog.value.map(r =>
      [
        escapeCsvCell(r.settlement_id),
        escapeCsvCell(r.settlement_name),
        escapeCsvCell(r.county),
        escapeCsvCell(r.status),
        escapeCsvCell(r.sample_records),
        escapeCsvCell(r.avg_before),
        escapeCsvCell(r.avg_after),
        escapeCsvCell(r.detail)
      ].join(',')
    )
  ]
  const text = `\uFEFF${lines.join('\r\n')}`
  const blob = new Blob([text], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
  a.download = `household-size-survey-bulk-${stamp}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

const startHhBulkAvgUpdate = async () => {
  hhBulkRunning.value = true
  hhBulkTotal.value = 0
  hhBulkDone.value = 0
  hhBulkSkipped.value = 0
  hhBulkErrors.value = 0
  hhBulkLog.value = []

  try {
    const res: any = await applySettlementSurveyHhAvg({
      county_id: hhBulkCountyId.value || null,
      scope: hhBulkScope.value
    })

    const rows = Array.isArray(res?.data) ? res.data : []
    hhBulkLog.value = rows.map((r: any) => ({
      settlement_id: r.settlement_id,
      settlement_name: r.settlement_name || `ID ${r.settlement_id}`,
      county: r.county || (r.county_id != null ? String(r.county_id) : ''),
      status: r.status === 'skip' ? 'skip' : 'ok',
      sample_records: r.sample_records ?? null,
      avg_before: r.avg_before == null ? '' : Number(r.avg_before).toFixed(2),
      avg_after: r.avg_after == null ? '' : Number(r.avg_after).toFixed(2),
      detail: r.detail || ''
    }))

    hhBulkTotal.value = rows.length
    hhBulkDone.value = rows.length
    hhBulkSkipped.value = typeof res?.summary?.skipped === 'number'
      ? res.summary.skipped
      : hhBulkLog.value.filter(r => r.status === 'skip').length

    if (rows.length === 0) {
      ElMessage.info('No settlements match the selected scope.')
      return
    }

    const updated = typeof res?.summary?.updated === 'number'
      ? res.summary.updated
      : hhBulkDone.value - hhBulkSkipped.value
    ElMessage.success(
      `Bulk complete: ${updated} updated, ${hhBulkSkipped.value} skipped, ${hhBulkErrors.value} errors.`
    )
  } catch (e: any) {
    hhBulkErrors.value = 1
    ElMessage.error(e?.message || 'Failed to update settlement household size averages')
  } finally {
    hhBulkRunning.value = false
  }
}

// ── Density Typology auto-populate ───────────────────────────────────────────
// All heavy lifting (PostGIS aggregate, ratio derivation, bulk UPDATE, bulk
// history insert) happens server-side in one transaction. The browser only
// makes a single round-trip per action.
//
// Categories per the National Slum Upgrading and Prevention Strategy 2024-2034:
//   built-up ratio < 60%      -> LOW DENSITY   (defaults editable)
//   built-up ratio 60% - 80%  -> MEDIUM DENSITY
//   built-up ratio > 80%      -> HIGH DENSITY

const densityCountyId = ref<any>(null)
const densityScope = ref<'missing' | 'all'>('missing')
const densityLowMax = ref<number>(60)
const densityMediumMax = ref<number>(80)

const densityComputing = ref(false)
const densityRunning = ref(false)
const densityPreview = ref<DensityTypologyComputeRow[]>([])
const densitySummary = ref<DensityTypologySummary | null>(null)
const densityLastApplyAt = ref<Date | null>(null)

const densityCounts = computed(
  () => densitySummary.value?.by_new_typology ?? { LOW: 0, MEDIUM: 0, HIGH: 0, NONE: 0 }
)

const typologyTagType = (typology: string | null | undefined): 'success' | 'warning' | 'danger' | 'info' => {
  if (typology === 'LOW DENSITY') return 'success'
  if (typology === 'MEDIUM DENSITY') return 'warning'
  if (typology === 'HIGH DENSITY') return 'danger'
  return 'info'
}

const typologyShortLabel = (typology: string | null | undefined): string => {
  if (typology === 'LOW DENSITY') return 'Low'
  if (typology === 'MEDIUM DENSITY') return 'Medium'
  if (typology === 'HIGH DENSITY') return 'High'
  return typology || '—'
}

// One round-trip: backend does the full pipeline (compute → bulk UPDATE →
// bulk history insert) in a single transaction. `dry_run` toggles preview
// vs. persist.
const callDensityTypologyApi = async (dryRun: boolean) => {
  const res = await applySettlementDensityTypology({
    county_id: densityCountyId.value || null,
    scope: densityScope.value,
    low_threshold: densityLowMax.value,
    medium_threshold: densityMediumMax.value,
    dry_run: dryRun
  })

  if (res.code !== '0000') {
    throw new Error(res.message || 'Density typology operation failed')
  }

  densityPreview.value = res.data || []
  densitySummary.value = res.summary || null
  return res
}

const computeDensityPreview = async () => {
  densityComputing.value = true
  densityPreview.value = []
  densitySummary.value = null

  try {
    const res = await callDensityTypologyApi(true)
    if (res.data.length === 0) {
      ElMessage.info('No settlements match the selected scope.')
    } else {
      ElMessage.success(`Computed typology for ${res.data.length} settlement(s).`)
    }
  } catch (e: any) {
    ElMessage.error(e?.message || 'Failed to compute density typology')
  } finally {
    densityComputing.value = false
  }
}

const applyDensityTypology = async () => {
  if (densityPreview.value.length === 0) {
    ElMessage.info('Run “Compute Preview” first.')
    return
  }
  if ((densitySummary.value?.will_change ?? 0) === 0) {
    ElMessage.info('Nothing to apply — every settlement already matches its computed typology.')
    return
  }

  densityRunning.value = true
  try {
    const res = await callDensityTypologyApi(false)
    densityLastApplyAt.value = new Date()
    const updated = res.summary?.updated ?? 0
    if (updated > 0) {
      ElMessage.success(`Density typology updated for ${updated} settlement(s).`)
    } else {
      ElMessage.info('No settlements needed updating.')
    }
  } catch (e: any) {
    ElMessage.error(e?.message || 'Failed to apply density typology')
  } finally {
    densityRunning.value = false
  }
}

// ── County growth rates grid ─────────────────────────────────────────────────

const rateFilterCountyId = ref<any>(null)
const rateFromYear = ref(2020)
const rateToYear = ref(2040)
const ratesLoading = ref(false)
const ratesSaving = ref(false)
const ratesGridEpoch = ref(0)
/** Percent display values keyed as `${countyId}:${year}` */
const ratePopPercentByKey = ref<Record<string, number | null>>({})
const rateHhPercentByKey = ref<Record<string, number | null>>({})

/** DB stores decimal fraction (0.028 = 2.8%). */
const storedRateToPercent = (value: unknown): number | null => {
  if (value == null || value === '') return null
  const n = Number(value)
  if (!Number.isFinite(n)) return null
  return Math.round(n * 100 * 1000) / 1000
}

const rateYearColumns = computed(() => {
  const from = rateFromYear.value
  const to = rateToYear.value
  if (!Number.isFinite(from) || !Number.isFinite(to) || to < from) return []
  const years: number[] = []
  for (let y = from; y <= to; y++) years.push(y)
  return years
})

const rateGridRows = computed(() => {
  const filterId =
    rateFilterCountyId.value != null && rateFilterCountyId.value !== ''
      ? Number(rateFilterCountyId.value)
      : null
  const counties =
    filterId != null && Number.isFinite(filterId)
      ? countyOptions.value.filter((x) => Number(x.value) === filterId)
      : countyOptions.value
  return counties.map((c) => ({
    countyId: Number(c.value),
    label: c.label,
  }))
})

const rateKey = (countyId: number | string, year: number) =>
  `${Number(countyId)}:${Number(year)}`

const getPopRatePercent = (countyId: number | string, year: number): number | null => {
  const v = ratePopPercentByKey.value[rateKey(countyId, year)]
  return v == null ? null : v
}

const getHhRatePercent = (countyId: number | string, year: number): number | null => {
  const v = rateHhPercentByKey.value[rateKey(countyId, year)]
  return v == null ? null : v
}

const setRatePercentInMap = (
  mapRef: typeof ratePopPercentByKey,
  countyId: number | string,
  year: number,
  value: number | undefined
) => {
  const key = rateKey(countyId, year)
  if (value == null || !Number.isFinite(value)) {
    const next = { ...mapRef.value }
    delete next[key]
    mapRef.value = next
    return
  }
  mapRef.value = { ...mapRef.value, [key]: value }
}

const setPopRatePercent = (countyId: number | string, year: number, value: number | undefined) => {
  setRatePercentInMap(ratePopPercentByKey, countyId, year, value)
}

const setHhRatePercent = (countyId: number | string, year: number, value: number | undefined) => {
  setRatePercentInMap(rateHhPercentByKey, countyId, year, value)
}

const loadCountyRates = async () => {
  ratesLoading.value = true
  ratePopPercentByKey.value = {}
  rateHhPercentByKey.value = {}
  try {
    const res = await listCountyPopulationGrowthRates({
      from_year: rateFromYear.value,
      to_year: rateToYear.value,
      county_id:
        rateFilterCountyId.value != null && rateFilterCountyId.value !== ''
          ? Number(rateFilterCountyId.value)
          : null,
    })
    const rows = Array.isArray(res?.data) ? res.data : []
    const popNext: Record<string, number | null> = {}
    const hhNext: Record<string, number | null> = {}
    for (const row of rows) {
      const countyId = Number(row.county_id)
      const year = Number(row.year)
      if (!Number.isFinite(countyId) || !Number.isFinite(year)) continue

      const key = rateKey(countyId, year)
      const popPct = storedRateToPercent(row.annual_rate)
      if (popPct != null) {
        popNext[key] = popPct
      }

      const hhSource =
        row.household_growth_rate != null && row.household_growth_rate !== ''
          ? row.household_growth_rate
          : row.annual_rate
      const hhPct = storedRateToPercent(hhSource)
      if (hhPct != null) {
        hhNext[key] = hhPct
      }
    }
    ratePopPercentByKey.value = popNext
    rateHhPercentByKey.value = hhNext
    ratesGridEpoch.value += 1
  } catch (e: any) {
    ElMessage.error(e?.message || 'Failed to load county growth rates')
  } finally {
    ratesLoading.value = false
  }
}

const saveCountyRates = async () => {
  const keySet = new Set([
    ...Object.keys(ratePopPercentByKey.value),
    ...Object.keys(rateHhPercentByKey.value)
  ])
  const rates: Array<{
    county_id: number
    year: number
    annual_rate: number
    household_growth_rate: number
  }> = []

  for (const key of keySet) {
    const popPct = ratePopPercentByKey.value[key]
    const hhPct = rateHhPercentByKey.value[key]
    if (popPct == null || !Number.isFinite(popPct)) continue
    const [countyId, yearStr] = key.split(':')
    const year = parseInt(yearStr, 10)
    const county_id = parseInt(countyId, 10)
    if (!Number.isFinite(year) || !Number.isFinite(county_id)) continue
    rates.push({
      county_id,
      year,
      annual_rate: popPct / 100,
      household_growth_rate:
        hhPct != null && Number.isFinite(hhPct) ? hhPct / 100 : popPct / 100
    })
  }
  if (rates.length === 0) {
    ElMessage.warning('Enter at least one growth rate before saving')
    return
  }
  ratesSaving.value = true
  try {
    const res = await saveCountyPopulationGrowthRates({ rates })
    ElMessage.success(res?.message || `Saved ${rates.length} rate(s)`)
    await loadCountyRates()
  } catch (e: any) {
    ElMessage.error(e?.message || 'Failed to save county growth rates')
  } finally {
    ratesSaving.value = false
  }
}

// ── Annual projections ───────────────────────────────────────────────────────

const currentCalendarYear = new Date().getFullYear()

const projCountyId = ref<any>(null)
const baselineYear = ref(2019)
const projectThroughYear = ref(Math.max(currentCalendarYear, 2040))
const projSyncSettlement = ref(true)
const baselineImportFile = ref<File | null>(null)
const baselineImportSyncSettlement = ref(true)
const baselineImportPreviewing = ref(false)
const baselineImporting = ref(false)
const baselineImportSummary = ref<Record<string, any> | null>(null)
const baselineImportResults = ref<BaselineImportResultRow[]>([])
const projPreviewing = ref(false)
const projApplying = ref(false)
const projSummary = ref<Record<string, any> | null>(null)
const projPreviewRows = ref<any[]>([])

const onBaselineFileChange = (uploadFile: { raw?: File }) => {
  baselineImportFile.value = uploadFile?.raw ?? null
}

const onBaselineFileRemove = () => {
  baselineImportFile.value = null
}

const downloadBaselineTemplate = () => {
  const ws = XLSX.utils.aoa_to_sheet([
    ['id', 'code', 'population', 'pop_male', 'pop_female', 'num_households'],
    ['', 'EXAMPLE-CODE', 12000, 5900, 6100, 3100]
  ])
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'baseline')
  XLSX.writeFile(wb, 'settlement_population_baseline_template.xlsx')
}

const runBaselineImport = async (dryRun: boolean) => {
  if (!baselineImportFile.value) {
    ElMessage.warning('Select an Excel file first')
    return
  }
  const formData = new FormData()
  formData.append('file', baselineImportFile.value)
  formData.append('baseline_year', String(baselineYear.value))
  formData.append('dry_run', dryRun ? 'true' : 'false')
  formData.append('sync_settlement', baselineImportSyncSettlement.value ? 'true' : 'false')

  const res = await importSettlementPopulationBaselineExcel(formData)
  baselineImportSummary.value = res?.data || null
  baselineImportResults.value = (res?.data?.results as BaselineImportResultRow[]) || []
  return res
}

const previewBaselineImport = async () => {
  baselineImportPreviewing.value = true
  try {
    const res = await runBaselineImport(true)
    ElMessage.info(res?.message || 'Import preview ready')
  } catch (e: any) {
    ElMessage.error(e?.message || e?.response?.data?.message || 'Import preview failed')
  } finally {
    baselineImportPreviewing.value = false
  }
}

const applyBaselineImport = async () => {
  baselineImporting.value = true
  try {
    const res = await runBaselineImport(false)
    ElMessage.success(res?.message || 'Baseline imported')
  } catch (e: any) {
    ElMessage.error(e?.message || e?.response?.data?.message || 'Baseline import failed')
  } finally {
    baselineImporting.value = false
  }
}

// ── County growth rates Excel import (projections tab) ─────────────────────

const ratesPopImportFile = ref<File | null>(null)
const ratesHhImportFile = ref<File | null>(null)
const ratesImportPreviewing = ref(false)
const ratesImporting = ref(false)
const ratesImportSummary = ref<Record<string, any> | null>(null)
const ratesImportResults = ref<CountyRateImportResultRow[]>([])
const ratesImportResultFilter = ref<'all' | 'ok' | 'error'>('all')
const ratesImportPreviewed = ref(false)
const ratesImportApplied = ref(false)

const ratesHasAnyFile = computed(
  () => ratesPopImportFile.value != null || ratesHhImportFile.value != null
)

const ratesImportErrorCount = computed(() =>
  ratesImportResults.value.filter((r) => r.status === 'error').length
)

const ratesImportDisplayedResults = computed(() => {
  const rows = ratesImportResults.value
  if (ratesImportResultFilter.value === 'ok') {
    return rows.filter((r) => r.status === 'ok')
  }
  if (ratesImportResultFilter.value === 'error') {
    return rows.filter((r) => r.status === 'error')
  }
  return rows
})

const ratesCanImport = computed(
  () =>
    ratesHasAnyFile.value &&
    ratesImportPreviewed.value &&
    !ratesImportPreviewing.value &&
    !ratesImporting.value
)

const resetRatesImportPreview = () => {
  ratesImportPreviewed.value = false
  ratesImportApplied.value = false
  ratesImportSummary.value = null
  ratesImportResults.value = []
  ratesImportResultFilter.value = 'all'
}

const formatFileSize = (bytes: number) => {
  if (!Number.isFinite(bytes) || bytes < 1024) return `${bytes || 0} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const onPopRateFileChange = (uploadFile: { raw?: File }) => {
  ratesPopImportFile.value = uploadFile?.raw ?? null
  resetRatesImportPreview()
}

const clearPopRateFile = () => {
  ratesPopImportFile.value = null
  resetRatesImportPreview()
}

const onHhRateFileChange = (uploadFile: { raw?: File }) => {
  ratesHhImportFile.value = uploadFile?.raw ?? null
  resetRatesImportPreview()
}

const clearHhRateFile = () => {
  ratesHhImportFile.value = null
  resetRatesImportPreview()
}

const popRateWideYears = () => Array.from({ length: 21 }, (_, i) => 2020 + i)

const downloadPopRateTemplate = () => {
  const years = popRateWideYears()
  const headers = ['county_id', 'code', 'county', ...years.map((y) => `growth_rate_pct_${y}`)]
  const sampleRates = years.map((y, i) => (i === 0 ? 2.8 : 2.5))
  const ws = XLSX.utils.aoa_to_sheet([headers, [1, 'Mombasa', 'Mombasa', ...sampleRates]])
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'population_rates')
  XLSX.writeFile(wb, 'county_population_growth_rates_wide_template.xlsx')
}

const downloadHhRateTemplate = () => {
  const years = popRateWideYears()
  const householdYears = [2019, ...years]
  const headers = [
    'county_id',
    'code',
    'county',
    ...householdYears.map((y) => `households_${y}`),
    ...years.map((y) => `growth_rate_${y}_percent`),
    'projection_method_2030_2040',
    'data_note'
  ]
  const sampleHouseholds = householdYears.map((y, i) => 100000 + i * 2500)
  const sampleRates = years.map((y, i) => (i === 0 ? 2.5 : 2.3))
  const ws = XLSX.utils.aoa_to_sheet([
    headers,
    [
      1,
      'Mombasa',
      'Mombasa',
      ...sampleHouseholds,
      ...sampleRates,
      'Population projection growth + decaying household formation premium from 2026-2029',
      '2030-2040 are modelled extensions, not official KNBS household projections.'
    ]
  ])
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'household_rates')
  XLSX.writeFile(wb, 'county_household_growth_rates_wide_template.xlsx')
}

const runRatesImport = async (dryRun: boolean) => {
  if (!ratesPopImportFile.value && !ratesHhImportFile.value) {
    ElMessage.warning('Select at least one rates Excel file')
    return
  }
  const formData = new FormData()
  if (ratesPopImportFile.value) formData.append('pop_file', ratesPopImportFile.value)
  if (ratesHhImportFile.value) formData.append('hh_file', ratesHhImportFile.value)
  formData.append('dry_run', dryRun ? 'true' : 'false')

  const res = await importCountyPopulationGrowthRatesExcel(formData)
  ratesImportSummary.value = res?.data || null
  ratesImportResults.value = (res?.data?.results as CountyRateImportResultRow[]) || []
  if (!dryRun) {
    await loadCountyRates()
  }
  return res
}

const previewRatesImport = async () => {
  ratesImportPreviewing.value = true
  try {
    const res = await runRatesImport(true)
    ratesImportPreviewed.value = true
    if (ratesImportErrorCount.value > 0) {
      ratesImportResultFilter.value = 'error'
      ElMessage.warning(
        `Preview ready — ${ratesImportErrorCount.value} error(s). Review before importing.`
      )
    } else {
      ElMessage.success(res?.message || 'Preview ready — no errors found')
    }
  } catch (e: any) {
    ratesImportPreviewed.value = false
    ElMessage.error(e?.message || e?.response?.data?.message || 'Rates import preview failed')
  } finally {
    ratesImportPreviewing.value = false
  }
}

const applyRatesImport = async () => {
  if (!ratesImportPreviewed.value) {
    ElMessage.warning('Run preview first')
    return
  }

  if (ratesImportErrorCount.value > 0) {
    try {
      await ElMessageBox.confirm(
        `${ratesImportErrorCount.value} row(s) have errors and will be skipped. Import the ${ratesImportSummary.value?.imported ?? ratesImportSummary.value?.would_write ?? 0} valid row(s)?`,
        'Import with errors',
        { type: 'warning', confirmButtonText: 'Import valid rows', cancelButtonText: 'Cancel' }
      )
    } catch {
      return
    }
  }

  ratesImporting.value = true
  try {
    const res = await runRatesImport(false)
    ratesImportApplied.value = true
    ratesImportPreviewed.value = false
    ElMessage.success(res?.message || 'Growth rates imported')
  } catch (e: any) {
    ElMessage.error(e?.message || e?.response?.data?.message || 'Growth rates import failed')
  } finally {
    ratesImporting.value = false
  }
}

const previewProjection = async () => {
  projPreviewing.value = true
  try {
    const res = await applySettlementPopulationProjection({
      baseline_year: baselineYear.value,
      project_through_year: projectThroughYear.value,
      sync_settlement_year: currentCalendarYear,
      county_id: projCountyId.value,
      sync_settlement: projSyncSettlement.value,
      dry_run: true
    })
    projSummary.value = res?.data || null
    projPreviewRows.value = (res?.data?.preview as any[]) || []
    ElMessage.info(res?.message || 'Projection preview ready')
  } catch (e: any) {
    ElMessage.error(e?.message || 'Projection preview failed')
  } finally {
    projPreviewing.value = false
  }
}

const applyProjection = async () => {
  if (projSyncSettlement.value && projectThroughYear.value < currentCalendarYear) {
    ElMessage.warning(
      `Project through must be at least ${currentCalendarYear} to update settlement master for this year`
    )
    return
  }
  projApplying.value = true
  try {
    const res = await applySettlementPopulationProjection({
      baseline_year: baselineYear.value,
      project_through_year: projectThroughYear.value,
      sync_settlement_year: currentCalendarYear,
      county_id: projCountyId.value,
      sync_settlement: projSyncSettlement.value,
      dry_run: false
    })
    projSummary.value = res?.data || null
    projPreviewRows.value = (res?.data?.preview as any[]) || []
    ElMessage.success(res?.message || 'Projection applied')
  } catch (e: any) {
    ElMessage.error(e?.message || 'Projection failed')
  } finally {
    projApplying.value = false
  }
}

// ────────────────────────────────────────────────────────────────────────────

watch(activeTab, (tab) => {
  if (tab === 'rates') {
    loadCountyRates()
  }
})

onMounted(async () => {
  await loadCounties()
  await loadCountyRates()
})
</script>

<style scoped lang="less">
.population-settings-container {
  padding: 0;
}

.settings-card {
  width: 100%;
}

.card-header {
  .header-title {
    margin: 0;
    font-size: 24px;
    font-weight: 600;
    color: #303133;
  }
}

.settings-content {
  min-height: 200px;

  :deep(.population-tabs > .el-tabs__content) {
    padding: 24px 0 0 0;
  }
}

.section-desc {
  margin: 0 0 20px 0;
  color: #909399;
  font-size: 13px;
}

.section-desc--tab {
  margin-top: 0;
  margin-bottom: 16px;
}

.hh-survey-subtabs,
.projections-subtabs {
  :deep(.el-tabs__header) {
    margin-bottom: 12px;
  }
}

.projections-subtabs {
  margin-top: 4px;
}

.proj-sync-warning {
  color: var(--el-color-warning, #e6a23c);
  margin-top: -8px;
}

.hh-survey-settlement-field {
  flex: 1;
  min-width: 280px;
  max-width: 640px;
}

.bulk-update-section {
  width: 100%;
}

.bulk-options {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-bottom: 28px;
}

.bulk-options-row {
  display: flex;
  align-items: flex-start;
  gap: 40px;
  flex-wrap: wrap;
}

.bulk-actions-row {
  display: flex;
  gap: 12px;
  width: 100%;
}

.bulk-option-group {
  .option-label {
    margin: 0 0 8px 0;
    font-size: 13px;
    font-weight: 600;
    color: #303133;
  }
}

.bulk-progress {
  margin-top: 4px;

  .progress-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;

    .progress-label {
      font-size: 13px;
      color: #606266;
    }

    .progress-done-label {
      font-size: 13px;
      font-weight: 600;
      color: #67c23a;
    }
  }
}

.log-toolbar {
  display: flex;
  justify-content: flex-end;
  margin-top: 8px;
}

.hh-bulk-table-wrap {
  margin-top: 8px;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid var(--el-border-color-lighter, #e4e7ed);
  background: var(--el-bg-color, #fff);
}

.hh-bulk-table {
  width: 100%;

  .muted-cell {
    color: #c0c4cc;
  }
}

.bulk-log {
  margin-top: 6px;
  height: 140px;
  overflow-y: auto;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  background: #fafafa;
  font-size: 12px;
  font-family: monospace;

  .log-entry {
    display: flex;
    align-items: baseline;
    gap: 8px;
    padding: 4px 10px;
    border-bottom: 1px solid #f0f0f0;

    &:last-child { border-bottom: none; }

    &.log-ok    { color: #67c23a; }
    &.log-skip  { color: #909399; }
    &.log-error { color: #f56c6c; }

    .log-icon  { width: 12px; flex-shrink: 0; }
    .log-name  { font-weight: 600; color: #303133; min-width: 180px; }
    .log-msg   { color: inherit; }
  }
}

.density-thresholds {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 20px;
}

.threshold-inputs {
  display: flex;
  align-items: center;
  gap: 8px;

  .threshold-sep {
    color: #909399;
    font-size: 13px;
    user-select: none;
  }
}

.density-summary {
  margin-top: 8px;
  margin-bottom: 16px;
  padding: 12px 16px;
  background: var(--el-fill-color-lighter, #f5f7fa);
  border: 1px solid var(--el-border-color-lighter, #e4e7ed);
  border-radius: 8px;

  &__row {
    display: flex;
    align-items: center;
    gap: 28px;
    flex-wrap: wrap;
  }

  &__stat {
    display: flex;
    flex-direction: column;
    align-items: flex-start;

    .stat-num {
      font-size: 22px;
      font-weight: 600;
      color: var(--el-text-color-primary, #303133);
      line-height: 1;

      &--primary { color: var(--el-color-primary, #409eff); }
    }

    .stat-label {
      margin-top: 4px;
      font-size: 12px;
      color: var(--el-text-color-secondary, #909399);
      text-transform: uppercase;
      letter-spacing: 0.4px;
    }
  }

  &__breakdown {
    display: flex;
    gap: 6px;
    margin-left: auto;
    flex-wrap: wrap;
  }

  &__footer {
    margin-top: 8px;
    font-size: 12px;
    color: var(--el-text-color-secondary, #909399);
  }
}

.baseline-import-block {
  margin-bottom: 8px;
}

.baseline-import-actions {
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.rates-import-panel {
  padding: 20px;
  background: var(--el-fill-color-lighter, #f5f7fa);
  border: 1px solid var(--el-border-color-lighter, #e4e7ed);
  border-radius: 10px;
}

.rates-import-panel__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}

.rates-import-steps {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--el-text-color-secondary, #909399);
  flex-shrink: 0;
}

.rates-step {
  padding: 4px 10px;
  border-radius: 999px;
  background: var(--el-fill-color, #f0f2f5);
  border: 1px solid var(--el-border-color-lighter, #e4e7ed);

  &--done {
    color: var(--el-color-primary, #409eff);
    border-color: var(--el-color-primary-light-7, #c6e2ff);
    background: var(--el-color-primary-light-9, #ecf5ff);
    font-weight: 600;
  }
}

.rates-step__sep {
  color: #c0c4cc;
}

.rates-upload-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
  margin-bottom: 12px;
}

.rates-upload-card {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 16px;
  background: var(--el-bg-color, #fff);
  border: 1px solid var(--el-border-color-lighter, #e4e7ed);
  border-radius: 8px;
  transition: border-color 0.2s, box-shadow 0.2s;

  &--ready {
    border-color: var(--el-color-success-light-5, #b3e19d);
    box-shadow: 0 0 0 1px var(--el-color-success-light-8, #e1f3d8);
  }

  &__title {
    display: flex;
    align-items: flex-start;
    gap: 10px;

    strong {
      display: block;
      font-size: 14px;
      color: var(--el-text-color-primary, #303133);
      margin-bottom: 2px;
    }

    span {
      display: block;
      font-size: 12px;
      color: var(--el-text-color-secondary, #909399);
      line-height: 1.4;
    }
  }

  &__icon {
    font-size: 22px;
    color: var(--el-color-primary, #409eff);
    margin-top: 2px;

    &--hh {
      color: var(--el-color-warning, #e6a23c);
    }
  }
}

.rates-dropzone {
  width: 100%;

  :deep(.el-upload) {
    width: 100%;
  }

  :deep(.el-upload-dragger) {
    width: 100%;
    padding: 20px 16px;
    border-radius: 8px;
    border-style: dashed;
    background: var(--el-fill-color-blank, #fafafa);
  }

  &__icon {
    font-size: 32px;
    color: var(--el-color-primary-light-3, #79bbff);
    margin-bottom: 8px;
  }

  &__title {
    margin: 0 0 4px;
    font-size: 13px;
    color: var(--el-text-color-primary, #303133);
  }

  &__hint {
    margin: 0;
    font-size: 12px;
    color: var(--el-text-color-secondary, #909399);
  }
}

.rates-file-selected {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  border: 1px solid var(--el-border-color-lighter, #e4e7ed);
  border-radius: 8px;
  background: var(--el-fill-color-light, #f5f7fa);

  &__icon {
    font-size: 24px;
    color: var(--el-color-primary, #409eff);
    flex-shrink: 0;
  }

  &__meta {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  &__name {
    font-size: 13px;
    font-weight: 600;
    color: var(--el-text-color-primary, #303133);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__size {
    font-size: 12px;
    color: var(--el-text-color-secondary, #909399);
  }
}

.rates-template-link {
  align-self: flex-start;
  padding-left: 0;
  font-size: 12px;
}

.rates-format-help {
  margin-bottom: 12px;
  border: none;
  background: transparent;

  :deep(.el-collapse-item__header) {
    height: 36px;
    font-size: 13px;
    color: var(--el-text-color-secondary, #909399);
    background: transparent;
    border-bottom: none;
  }

  :deep(.el-collapse-item__wrap) {
    border-bottom: none;
    background: transparent;
  }

  :deep(.el-collapse-item__content) {
    padding-bottom: 0;
  }
}

.rates-format-list {
  margin: 0;
  padding-left: 18px;
  font-size: 12px;
  color: var(--el-text-color-regular, #606266);
  line-height: 1.7;
}

.rates-action-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 12px;

  &__status {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  &__buttons {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }
}

.rates-import-alert {
  margin-bottom: 12px;
}

.rates-import-summary {
  .stat-num--danger {
    color: var(--el-color-danger, #f56c6c);
  }
}

.rates-results {
  margin-top: 4px;

  &__toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
    margin-bottom: 8px;
  }

  &__title {
    font-size: 13px;
    font-weight: 600;
    color: var(--el-text-color-primary, #303133);
  }

  &__count {
    font-weight: 400;
    color: var(--el-text-color-secondary, #909399);
  }
}

.rates-results-table {
  width: 100%;

  .muted-cell {
    color: #c0c4cc;
  }
}

.rates-grid-wrap {
  margin-top: 16px;
}

.rates-table {
  width: 100%;
}

.rate-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 2px 0;
}

.rate-cell__row {
  display: flex;
  align-items: center;
  gap: 4px;
}

.rate-cell__label {
  width: 26px;
  font-size: 11px;
  color: #909399;
  text-align: right;
  flex-shrink: 0;
}

.rate-cell__input {
  width: 84px;
}

.density-preview {
  margin-top: 8px;
  margin-bottom: 20px;

  .density-table {
    width: 100%;

    .muted {
      color: #c0c4cc;
    }
  }
}

.hh-survey-meta,
.hh-survey-computed {
  margin: 16px 0;
  padding: 12px 16px;
  background: var(--el-fill-color-lighter, #f5f7fa);
  border: 1px solid var(--el-border-color-lighter, #e4e7ed);
  border-radius: 8px;
  font-size: 13px;
  line-height: 1.7;
  color: #606266;

  .meta-k {
    display: inline-block;
    min-width: 160px;
    font-weight: 600;
    color: #303133;
  }
}

.hh-survey-computed .muted {
  color: #909399;
}
</style>

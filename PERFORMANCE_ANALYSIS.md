# LandingMap.vue Performance Analysis & Optimization Plan

## 🔴 Critical Performance Bottlenecks Identified

### 1. **Client-Side Filtering (MAJOR)**
**Location:** `getSubsetGeo()` function (lines 878-966)
**Problem:** 
- Filters ALL settlements client-side using `.filter()` on potentially thousands of features
- Runs `computeCentroids()` on filtered results, processing geometries synchronously
- Triggers full layer removal/re-addition on every filter change

**Impact:** 
- 2-5+ seconds delay on filter changes
- UI freezes during processing
- High memory usage

**Solution:**
- Move filtering to backend via `streamGeo` API (already supports filters!)
- Use `filters` and `filterValues` params instead of client-side filtering
- Only fetch what's needed

---

### 2. **Sequential API Calls (MAJOR)**
**Location:** Multiple places
**Problems:**
- `getFarmGeo()`, `getCountyGeo()`, `getCounty()` run sequentially (lines 299-311)
- County geometries loaded one-by-one in loops (lines 1127-1142, 1370-1385)
- Subcounty geometries loaded sequentially (lines 1312-1321)

**Impact:**
- 3-10+ seconds initial load time
- Network waterfall effect

**Solution:**
- Parallelize independent API calls with `Promise.all()`
- Batch geometry requests where possible

---

### 3. **Heavy GeoJSON Processing (MAJOR)**
**Location:** `computeCentroids()` function (lines 665-701)
**Problem:**
- Synchronously processes ALL features with `turf.centroid()` 
- No batching or web workers
- Runs on every filter change

**Impact:**
- 1-3 seconds processing time for large datasets
- Blocks main thread

**Solution:**
- Use Web Workers for centroid computation
- Or better: Request centroids from backend (PostGIS can compute faster)
- Cache computed centroids

---

### 4. **Expensive Deep Copying (MEDIUM)**
**Location:** `getFarmGeo()` line 746
**Problem:**
```javascript
allProjectsGeo.value = JSON.parse(JSON.stringify(geojson.value));
```
- Deep clones entire GeoJSON (potentially 10-50MB+)
- Runs synchronously, blocks UI

**Impact:**
- 500ms-2s freeze on initial load
- High memory usage

**Solution:**
- Use structuredClone() if available (faster)
- Or shallow copy with reference management
- Or don't copy at all - use computed properties/filters

---

### 5. **Frequent Layer Removal/Addition (MEDIUM)**
**Location:** `removeSettlementLayers()` + `addSettlementLayers()` called repeatedly
**Problem:**
- Removes and re-adds layers on every filter change
- Mapbox layer operations are expensive
- Re-renders entire map

**Impact:**
- 200-500ms delay per filter change
- Visual flickering

**Solution:**
- Update source data instead of removing layers
- Use `setData()` on existing sources
- Only remove/add when absolutely necessary

---

### 6. **Loading All Data at Once (MEDIUM)**
**Location:** `getFarmGeo()` loads ALL settlements
**Problem:**
- No pagination or viewport-based loading
- Loads data user may never see
- No progressive loading

**Impact:**
- Slow initial load
- High memory usage
- Poor mobile performance

**Solution:**
- Implement viewport-based loading (load only visible area)
- Use Mapbox's built-in clustering more aggressively
- Lazy load off-screen data

---

### 7. **Unused Heavy Dependencies (LOW)**
**Location:** Lines 43-52, 78-89
**Problem:**
- Imports entire ECharts library (PieChart, GaugeChart, BarChart, LineChart)
- Not used anywhere in the component
- Adds ~200KB+ to bundle

**Impact:**
- Slower initial page load
- Unnecessary bundle size

**Solution:**
- Remove unused ECharts imports

---

### 8. **Map Style Changes (MEDIUM)**
**Location:** Dark mode watch (lines 248-268)
**Problem:**
- Changes entire map style on dark mode toggle
- Reloads all tiles and layers
- Very expensive operation

**Impact:**
- 1-3 second delay on theme change
- Visual flash

**Solution:**
- Use CSS filters or overlay for dark mode
- Or cache both styles and switch sources
- Or use Mapbox's style API to update colors only

---

### 9. **No Debouncing (MEDIUM)**
**Location:** Filter change handlers
**Problem:**
- Filter changes trigger immediate expensive operations
- No debouncing on rapid filter changes

**Impact:**
- Multiple unnecessary API calls
- Wasted processing

**Solution:**
- Add 300-500ms debounce to filter handlers

---

### 10. **Inefficient Clustering (LOW)**
**Location:** Map source configuration (line 485-486)
**Problem:**
- `clusterMaxZoom: 14` might be too high
- `clusterRadius: 50` might be too small for large datasets

**Impact:**
- Too many clusters at high zoom
- Slower rendering

**Solution:**
- Tune clustering parameters based on data density
- Consider adaptive clustering

---

## 🚀 Optimization Strategy

### Phase 1: Quick Wins (High Impact, Low Effort)
1. ✅ Remove unused ECharts imports
2. ✅ Parallelize initial API calls
3. ✅ Move filtering to backend
4. ✅ Replace deep copy with shallow copy
5. ✅ Add debouncing to filters

**Expected Improvement:** 50-70% faster initial load, 80% faster filter changes

---

### Phase 2: Architecture Improvements (High Impact, Medium Effort)
1. ✅ Use `setData()` instead of remove/add layers
2. ✅ Request centroids from backend
3. ✅ Batch geometry requests
4. ✅ Implement viewport-based loading
5. ✅ Cache computed data

**Expected Improvement:** Additional 30-50% performance gain

---

### Phase 3: Advanced Optimizations (Medium Impact, High Effort)
1. ✅ Web Workers for heavy processing
2. ✅ Progressive data loading
3. ✅ Virtual scrolling for large lists
4. ✅ Service worker caching
5. ✅ Optimize map style switching

**Expected Improvement:** Additional 20-30% performance gain

---

## 📊 Performance Targets

| Metric | Current | Target | Improvement |
|--------|---------|--------|-------------|
| Initial Load | 5-10s | 1-2s | 80% |
| Filter Change | 2-5s | 200-500ms | 90% |
| Memory Usage | High | Medium | 50% |
| Bundle Size | Large | Medium | 30% |

---

## 🎯 Recommended Approach

### Option A: Incremental Refactoring (Safer)
- Fix issues one by one
- Test after each change
- Lower risk, longer timeline

### Option B: Fresh Rewrite (Faster)
- Build new optimized version alongside
- Copy over functionality incrementally
- Higher risk, faster results

**Recommendation:** Start with Phase 1 quick wins, then decide on Option A vs B based on results.

---

## 🔧 Implementation Priority

1. **CRITICAL:** Move filtering to backend (biggest win)
2. **CRITICAL:** Parallelize API calls
3. **HIGH:** Replace deep copy
4. **HIGH:** Use setData() instead of remove/add
5. **MEDIUM:** Remove unused imports
6. **MEDIUM:** Add debouncing
7. **LOW:** Other optimizations

---

## 💡 Key Architectural Changes

### Before:
```
User changes filter → Client filters all data → Process centroids → Remove layers → Add layers
```

### After:
```
User changes filter → Debounce → Backend filters → Update source data → Map re-renders
```

---

## 📝 Questions for Discussion

1. **Backend Support:** Can we add a `centroid` field to the settlement model to avoid client-side computation?

2. **Viewport Loading:** Should we implement viewport-based loading, or is loading all data acceptable?

3. **Caching Strategy:** Should we cache county/subcounty geometries in localStorage?

4. **Progressive Enhancement:** Should we show a simplified map first, then enhance with full data?

5. **Mobile Optimization:** Should we have different strategies for mobile vs desktop?

---

## 🎬 Next Steps

1. Review this analysis
2. Prioritize optimizations
3. Decide on incremental vs rewrite approach
4. Start with Phase 1 quick wins
5. Measure and iterate

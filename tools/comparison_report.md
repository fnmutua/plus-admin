# Comparison Report: SQL Normalized Values vs Vue Form Options
## (Ignoring Comma-Separated Combinations - Focus on Single Values Only)

## Summary of Differences

This document compares the normalized database values from `clean.sql` with the form options in `AddSettlementNew.vue`, focusing on single values only (ignoring comma-separated combinations).

---

## 1. Settlement Type

### SQL Normalized Values (Single):
- `'Slum'`
- `'Informal Settlement'`

### Vue Form Options:
```javascript
{ label: 'Slum', value: 'slum' }
{ label: 'Informal Settlement', value: 'Informal Settlement' }
```

**❌ MISMATCH:**
- SQL uses `'Slum'` (capitalized)
- Vue uses `'slum'` (lowercase) for the value
- This will cause data inconsistency!

---

## 2. Structure Types (Single Values Only)

### SQL Normalized Values (Base Single Values):
- `'Permanent'`
- `'Semi-permanent'` (with hyphen)
- `'Temporary'`

### Vue Form Options:
```javascript
{ label: 'Temporary', value: 'temporary' }
{ label: 'Semi Permanent', value: 'semi_permanent' }
{ label: 'Permanent', value: 'permanent' }
```

**❌ MISMATCH:**
- SQL uses: `'Permanent'`, `'Semi-permanent'`, `'Temporary'` (capitalized, hyphenated)
- Vue uses: `'permanent'`, `'semi_permanent'`, `'temporary'` (lowercase, underscore)
- **Critical issue**: Values won't match!

---

## 3. Surveyed Field

### SQL Normalized Values (Single):
- `'Yes'`
- `'No'`
- `'Unknown'`

### Vue Form Options:
```javascript
yesNoUnknownOptions = [
  { label: 'Yes', value: 'yes' },
  { label: 'No', value: 'no' },
  { label: 'Unknown', value: 'Unknown' }
]
```

**❌ MISMATCH:**
- SQL uses: `'Yes'`, `'No'` (capitalized)
- Vue uses: `'yes'`, `'no'` (lowercase)
- `'Unknown'` matches (both capitalized)

---

## 4. Land Status

### SQL Normalized Values (Single Values - these are single status values, not combinations):
- `'Unknown'`
- `'Planned, Surveyed'`
- `'Planned, Unsurveyed'`
- `'Unplanned, Surveyed'`
- `'Unplanned, Unsurveyed'`

### Vue Form Options:
```javascript
landStatusOptions = [
  { label: 'Registered', value: 'registered' },
  { label: 'Unregistered', value: 'unregistered' },
  { label: 'Disputed', value: 'disputed' }
]
```

**❌ COMPLETE MISMATCH:**
- SQL uses planning/surveying status (single values describing planning and survey state)
- Vue uses registration/dispute status
- **These are completely different concepts!**
- SQL values describe planning and surveying status
- Vue values describe registration and dispute status

---

## 5. Parcel Owner Type

### SQL Normalized Values (Single):
- `'Unknown'`
- `'Private'`
- `'Public'`
- `'Communal'`
- `'Mixed'`

### Vue Form Options:
```javascript
parcelOwnerTypeOptions = [
  { label: 'Individual', value: 'individual' },
  { label: 'Government', value: 'government' },
  { label: 'Community', value: 'community' },
  { label: 'Corporate', value: 'corporate' }
]
```

**❌ COMPLETE MISMATCH:**
- SQL uses: `'Unknown'`, `'Private'`, `'Public'`, `'Communal'`, `'Mixed'`
- Vue uses: `'individual'`, `'government'`, `'community'`, `'corporate'`
- **Completely different categorization!**
- SQL has `'Unknown'` and `'Mixed'` options that Vue doesn't have
- Vue has `'Corporate'` that SQL doesn't have
- SQL uses ownership type (Private/Public/Communal), Vue uses owner entity type (Individual/Government/Community/Corporate)

---

## 6. Typical Building Materials (Single Values Only)

### SQL Normalized Values (Base Single Values):
- `'Stone/Blocks'`
- `'Mud'`
- `'Timber/Wood'`
- `'Iron sheets'`
- `'Earth'`
- `'Cement'`
- `'Tiles'`
- `'Grass'`
- `'Plastic/Polythene'`
- `'Concrete/Slab'`
- `'Terrazzo'`
- `'Other'`

### Vue Form Options:
```javascript
buildingMaterialsOptions = [
  { label: 'Mud', value: 'mud' },
  { label: 'Timber', value: 'timber' },
  { label: 'Iron Sheet', value: 'iron_sheet' },
  { label: 'Blocks/Stone', value: 'blocks_stone' }
]
```

**❌ MAJOR MISMATCH:**
- SQL has 12 single value options
- Vue only has 4 options
- SQL uses: `'Iron sheets'` (lowercase 's', plural), `'Stone/Blocks'`
- Vue uses: `'iron_sheet'` (singular, underscore), `'blocks_stone'` (reversed order)
- SQL uses: `'Timber/Wood'`, Vue uses: `'timber'` (missing '/Wood')
- **Vue is missing 8 options**: `'Earth'`, `'Cement'`, `'Tiles'`, `'Grass'`, `'Plastic/Polythene'`, `'Concrete/Slab'`, `'Terrazzo'`, `'Other'`

---

## 7. Landuse (Single Values Only)

### SQL Normalized Values (Base Single Values):
- `'Mixed'`
- `'Residential'`
- `'Commercial'`
- `'Industrial'`
- `'Educational'`
- `'Public Purpose'`
- `'Public Utility'`
- `'Transportation'`
- `'Agricultural'`
- `'Undeveloped'`
- `'Conservation'`
- `'Other'`

### Vue Form Options:
```javascript
// In the form, landuse is a free text input:
<el-input v-model="settlementForm.landuse" placeholder="Enter landuse" />
```

**❌ MISMATCH:**
- SQL has 12 controlled, normalized single value categories
- Vue uses free text input (no dropdown/options)
- **No validation or consistency!**
- Users can enter any value, which won't match SQL normalized values

---

## 8. Parcel Owner (parcel_owner field)

### SQL Normalized Values:
- Not explicitly normalized in clean.sql (appears to be free text)

### Vue Form Options:
```javascript
parcelOwnershipOptions = [
  { label: 'Public', value: 'public' },
  { label: 'Private', value: 'private' },
  { label: 'Community', value: 'community' }
]
```

**⚠️ NOTE:**
- This field (`parcel_owner`) is different from `parcel_owner_type`
- SQL doesn't normalize this field
- Vue provides dropdown options

---

## 9. Boolean Fields

### SQL Normalized Values:
- `near_river`: `FALSE` (boolean)
- `on_wayleave`: `FALSE` (boolean)
- `on_road_reserve`: `FALSE` (boolean)
- `encumbrance`: `FALSE` (boolean)
- `electricity_availability`: `FALSE` (boolean)
- `piped_water_availability`: `FALSE` (boolean)

### Vue Form Options:
```javascript
// Uses yesNoOptions for these fields:
yesNoOptions = [
  { label: 'Yes', value: 'yes' },
  { label: 'No', value: 'no' }
]
```

**❌ TYPE MISMATCH:**
- SQL expects boolean (`TRUE`/`FALSE`)
- Vue sends string values (`'yes'`/`'no'`)
- **Backend needs to convert strings to booleans!**

---

## 10. Development (Level of Development)

### SQL Normalized Values:
- Not explicitly normalized in clean.sql

### Vue Form Options:
```javascript
levelDevtOptions = [
  { label: 'Single Storey', value: 'singleStorey' },
  { label: 'Multi Storey', value: 'multiStorey' }
]
```

**⚠️ NOTE:**
- SQL doesn't normalize this field
- Vue provides 2 options

---

## Critical Issues Summary (Single Values Only)

### 🔴 CRITICAL (Data Won't Match):
1. **Settlement Type**: `'Slum'` vs `'slum'` (capitalization)
2. **Structure Types**: `'Permanent'`, `'Semi-permanent'`, `'Temporary'` vs `'permanent'`, `'semi_permanent'`, `'temporary'` (format mismatch)
3. **Land Status**: Completely different concepts (planning/surveying vs registration/dispute)
4. **Parcel Owner Type**: Completely different categories (ownership type vs entity type)
5. **Building Materials**: Different values and missing 8 options
6. **Surveyed**: `'Yes'`/`'No'` vs `'yes'`/`'no'` (capitalization)

### 🟡 WARNING (Type/Format Issues):
1. **Boolean Fields**: SQL expects booleans (`TRUE`/`FALSE`), Vue sends strings (`'yes'`/`'no'`)
2. **Landuse**: Free text vs 12 controlled categories

### 🟢 MISSING OPTIONS:
1. **Building Materials**: Vue missing 8 options (`'Earth'`, `'Cement'`, `'Tiles'`, `'Grass'`, `'Plastic/Polythene'`, `'Concrete/Slab'`, `'Terrazzo'`, `'Other'`)
2. **Parcel Owner Type**: Vue missing `'Unknown'` and `'Mixed'` options
3. **Landuse**: Vue has no dropdown (should have 12 options)

---

---

## Quick Comparison Table (Single Values Only)

| Field | SQL Normalized Value | Vue Form Value | Status |
|-------|---------------------|----------------|--------|
| **settlement_type** | `'Slum'` | `'slum'` | ❌ Case mismatch |
| **settlement_type** | `'Informal Settlement'` | `'Informal Settlement'` | ✅ Match |
| **structure_types** | `'Permanent'` | `'permanent'` | ❌ Case/format mismatch |
| **structure_types** | `'Semi-permanent'` | `'semi_permanent'` | ❌ Case/format mismatch |
| **structure_types** | `'Temporary'` | `'temporary'` | ❌ Case mismatch |
| **surveyed** | `'Yes'` | `'yes'` | ❌ Case mismatch |
| **surveyed** | `'No'` | `'no'` | ❌ Case mismatch |
| **surveyed** | `'Unknown'` | `'Unknown'` | ✅ Match |
| **land_status** | `'Planned, Surveyed'` | `'registered'` | ❌ Different concept |
| **land_status** | `'Planned, Unsurveyed'` | `'unregistered'` | ❌ Different concept |
| **land_status** | `'Unplanned, Surveyed'` | `'disputed'` | ❌ Different concept |
| **parcel_owner_type** | `'Private'` | `'individual'` | ❌ Different concept |
| **parcel_owner_type** | `'Public'` | `'government'` | ❌ Different concept |
| **parcel_owner_type** | `'Communal'` | `'community'` | ⚠️ Similar but different |
| **typical_building_materials** | `'Mud'` | `'mud'` | ❌ Case mismatch |
| **typical_building_materials** | `'Timber/Wood'` | `'timber'` | ❌ Format mismatch |
| **typical_building_materials** | `'Iron sheets'` | `'iron_sheet'` | ❌ Format mismatch |
| **typical_building_materials** | `'Stone/Blocks'` | `'blocks_stone'` | ❌ Format mismatch |
| **landuse** | 12 controlled values | Free text input | ❌ No validation |

---

## Recommendations

1. **Align Vue form values with SQL normalized values** - Use exact same capitalization and formatting
2. **Update Land Status options** - Decide whether to use planning/surveying status (SQL) or registration status (Vue)
3. **Update Parcel Owner Type options** - Align with SQL categories
4. **Add missing Building Materials options** - Include all SQL options
5. **Fix boolean fields** - Either convert in backend or use boolean values in Vue
6. **Add Landuse dropdown** - Replace free text with controlled dropdown matching SQL categories
7. **Add validation** - Ensure form values match database constraints

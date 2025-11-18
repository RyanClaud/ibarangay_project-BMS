# PSGC Integration Guide

## Overview

We've integrated the **Philippine Standard Geographic Code (PSGC)** library to ensure accurate and official barangay data for Oriental Mindoro.

## Library Used

**Package**: `ph-geo-admin-divisions`
- **Version**: 1.0.8
- **Last Updated**: January 2025
- **Source**: Official PSGC data from Philippine Statistics Authority (PSA)

## Benefits of Using PSGC Library

### 1. **Official Data Source**
- Data comes from the Philippine Statistics Authority (PSA)
- Ensures accuracy and compliance with government standards
- Regularly updated with official administrative changes

### 2. **Unique PSGC Codes**
- Each barangay has a unique 10-digit PSGC code
- Format: `RRPPMMBBB` where:
  - `RR` = Region code (17 = MIMAROPA)
  - `PP` = Province code (052 = Oriental Mindoro)
  - `MM` = Municipality code
  - `BBB` = Barangay code
- Example: `1705201001` = Alag, Baco, Oriental Mindoro

### 3. **Data Integrity**
- Prevents typos and spelling errors
- Ensures consistent naming conventions
- Maintains proper municipality-barangay relationships

### 4. **Complete Coverage**
- All 426 barangays across 15 municipalities
- Includes Calapan City (capital)
- No missing or duplicate entries

## Generated Files

### 1. **oriental_mindoro_barangays_psgc.csv**
- Complete list of 426 barangays
- Includes official PSGC codes
- Ready for bulk import

### 2. **oriental_mindoro_barangays.csv** (manual)
- Previously created manual list
- Can be used as backup or comparison

## Barangay Count by Municipality

| Municipality | Barangays | Notes |
|-------------|-----------|-------|
| Baco | 27 | |
| Bansud | 13 | |
| Bongabong | 36 | Largest municipality |
| Bulalacao | 15 | |
| Calapan City | 62 | Provincial capital |
| Gloria | 27 | |
| Mansalay | 17 | |
| Naujan | 70 | Most barangays |
| Pinamalayan | 37 | |
| Pola | 23 | |
| Puerto Galera | 13 | Tourist destination |
| Roxas | 20 | |
| San Teodoro | 8 | Smallest municipality |
| Socorro | 26 | |
| Victoria | 32 | |
| **TOTAL** | **426** | |

## How to Regenerate the CSV

If you need to update the data in the future:

```bash
# Run the generation script
npx tsx src/scripts/generate-oriental-mindoro-csv-v3.ts
```

This will:
1. Fetch the latest PSGC data from the library
2. Filter for Oriental Mindoro province
3. Extract all barangays with their municipalities
4. Generate a new CSV file with PSGC codes

## Using the CSV for Import

The generated CSV can be imported through your system's bulk import feature:

1. Navigate to `/barangays/import`
2. Upload `oriental_mindoro_barangays_psgc.csv`
3. The system will create:
   - 426 barangay records
   - Auto-generated admin emails (e.g., `admin@ibarangayalag.com`)
   - Proper municipality and province associations

## PSGC Code Benefits for Your System

### Future Features You Can Build:

1. **Geographic Hierarchy**
   - Navigate from region → province → municipality → barangay
   - Build hierarchical dropdowns

2. **Data Validation**
   - Verify user-entered addresses against PSGC codes
   - Prevent invalid location combinations

3. **Reporting & Analytics**
   - Generate reports by municipality or province
   - Compare statistics across regions

4. **Integration with Government Systems**
   - PSGC codes are used by PSA, DILG, and other agencies
   - Easier data sharing and compliance

5. **Address Standardization**
   - Consistent address formats
   - Better geocoding and mapping

## Additional PSGC Library Features

The library also provides:

```typescript
import { 
  regions,        // All Philippine regions
  provinces,      // All provinces
  municipalities, // All cities and municipalities
  baranggays,     // All barangays
  searchRegion,
  searchProvince,
  searchMunicipality,
  searchBaranggay
} from 'ph-geo-admin-divisions';

// Example: Search for a barangay
const results = searchBaranggay({ name: 'Poblacion' });

// Example: Get all barangays in a province
const orientalMindoroBarangays = baranggays.filter(
  b => b.provinceId === '052'
);
```

## Verification

To verify the data matches your manual list:

```bash
# Count barangays in each file
wc -l oriental_mindoro_barangays.csv
wc -l oriental_mindoro_barangays_psgc.csv

# Both should show 427 lines (426 barangays + 1 header)
```

## Recommendation

**Use `oriental_mindoro_barangays_psgc.csv` for production deployment** because:
- ✅ Official PSGC codes included
- ✅ Data verified against PSA records
- ✅ Consistent naming conventions
- ✅ Future-proof for government integrations
- ✅ Easier to maintain and update

## Support

If you encounter any issues:
1. Check the library documentation: https://github.com/MarkMatute/ph-geo-admin-divisions
2. Verify PSGC codes at: https://psa.gov.ph/classification/psgc
3. Run the generation script again to get the latest data

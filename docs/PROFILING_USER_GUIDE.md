# Barangay Profiling — Staff User Guide

## What is the Profiling Module?

The Barangay Profiling module lets you build a complete masterlist of your barangay — households, family members, their sectors (senior citizen, PWD, solo parent, etc.), program beneficiaries (4Ps, Social Pension, TUPAD, etc.), and voter registration status.

All data lives in one place. Every list you need — masterlist, voter list, sector list, beneficiary list — is just a filtered view of the same database.

---

## Getting Started

### Who can access the Profiling Module?

| Role | What you can do |
|---|---|
| **Admin** | Everything — view, add, edit, import, export, manage puroks |
| **Secretary** | View, add, edit, import, export, manage puroks |
| **Barangay Captain** | View, export reports |
| **Treasurer** | View, export (income bracket visible) |
| **BHW** | View, add, edit (voter info and income hidden) |
| **Encoder** | View, add, edit (no export) |

If you don't see "Barangay Profiling" in your sidebar, your role doesn't have access. Ask your Admin to assign you a role that includes it.

---

## The Masterlist Screen

When you open Barangay Profiling, you'll see four tabs:

### Masterlist Tab

This is the main list of all individuals in your barangay.

**Filters** (top of the page):
- **Search by name** — type any part of a person's name
- **Purok** — filter to one purok/sitio
- **Sex** — Male or Female
- **Sector** — Senior Citizen, PWD, Solo Parent, etc.
- **Program** — 4Ps, Social Pension, AICS, TUPAD, Scholarship, Listahanan/NHTS-PR
- **Voter Status** — Registered, Not registered, Transferred, Unknown (if your role can see voter data)
- **Individual Status** — Active, Deceased, Transferred
- **Age range** — minimum and maximum age
- **Eligible but unregistered only** — shows people 18+ who are not yet registered to vote

Click **Clear filters** to reset everything.

**Export buttons** (top right):
- **Export Excel** — downloads the current filtered list as an Excel file
- **Export PDF** — downloads as a PDF table
- **Import** — goes to the bulk import page (Admin and Secretary only)
- **Template** — downloads the blank Excel template for importing

### Households Tab

Shows all households with their IDs, purok, address, head of household, member count, housing type, income bracket, and last verified date.

### Dashboard Tab

Charts and summary cards:
- Total individuals, households, registered voters, eligible/unregistered
- Individuals per purok (bar chart)
- Individuals per sector (cards with counts)
- Beneficiaries per program (bar chart)
- Voter status breakdown (grid)

### Reports Tab

Prebuilt one-click reports:
1. **Barangay Masterlist** — full list with all fields
2. **Household List with Members** — all households with member counts
3. **Program Beneficiary Lists** — beneficiaries per government program
4. **Registered Voter List** — all registered voters with precinct numbers
5. **Non-Voter List** — individuals not registered to vote
6. **Eligible but Unregistered** — 18+ and 6+ months residency, not yet registered
7. **Sector Lists** — individuals grouped by sector tag
8. **Demographic Summary** — population breakdown by age, sex, sector, voter

Each report downloads as an Excel file. The current filters are applied.

Below the reports is the **Audit Log**, which records every view, export, edit, and import action with the user's name and timestamp.

---

## Importing Data in Bulk

Only **Admin** and **Secretary** can import data.

### Step 1: Download the Template

1. Go to **Barangay Profiling** → click **Import**
2. Click **Download Import Template**
3. Open the downloaded Excel file
4. You'll see columns for all the fields you need, plus one sample row

### Step 2: Fill In Your Data

- One row per individual
- People in the same household should share the same **Household ID** (e.g., `HH-BONG-0001`)
- Use the exact dropdown values for Sex, Civil Status, Education, etc. (see the Instructions sheet in the template)
- Dates must be in YYYY-MM-DD format (e.g., `1985-03-15`)
- **Sector Tags**: comma-separated (e.g., `Senior Citizen, PWD`)
- **Program** fields: leave blank if the person is not a beneficiary
- Save the file as .xlsx or .csv

### Step 3: Upload

1. Click **Choose File** and select your filled-in file
2. The system validates every row and checks for duplicates
3. You'll see a summary:
   - **Valid** — ready to import (green badge)
   - **Errors** — something is wrong (red badge) — hover over the Issues column to see what
   - **Duplicates** — this person already exists in your barangay (yellow badge)

### Step 4: Commit

1. Review the validation table
2. Only valid, non-duplicate rows will be imported
3. Click **Commit Import**
4. The data is now live — go back to the Profiling page to view it

### Duplicate Detection

A person is considered a duplicate if another record has the same:
- First name + Last name + Birthdate + Household ID

This prevents importing the same person twice, even across different upload sessions.

---

## Sample Data for Testing

A sample CSV file with 10 households (38 individuals) is included at:
`public/sample-profiling-data.csv`

You can use this to test the import feature:
1. Go to **Import** → **Choose File**
2. Select `sample-profiling-data.csv` from the `public/` folder
3. Review the validation results
4. Click **Commit Import**

The sample data includes a variety of sectors, programs, voter statuses, and household types for testing all filter and report combinations.

---

## Sensitive Fields by Role

Some fields are hidden based on your role:

| Field | Who can see it |
|---|---|
| Voter status, precinct number, eligible/unregistered | Admin, Captain, Secretary |
| Income bracket | Admin, Captain, Secretary, Treasurer |
| PhilHealth status | Admin, Secretary, BHW |

If a field is hidden from your role, it will show as "—" in tables and be absent from filters and reports.

---

## Audit Trail

Every action in the profiling module is logged:

| Action | What triggers it |
|---|---|
| View | Opening the masterlist (logged on export actions) |
| Create | Adding a household or individual |
| Edit | Updating any record |
| Delete | Removing a record |
| Export | Downloading an Excel or PDF file |
| Import | Bulk importing data |

The audit log is visible in the **Reports** tab at the bottom. It shows the last 50 actions with the user's name, role, action type, and details.

---

## Voter Eligibility Flag

The system automatically flags individuals as "Eligible but Unregistered" when:

- They are **18 years or older** (or 15–30 for SK eligibility)
- They have been a resident for **at least 6 months** (if residency is known)
- Their voter status is **not** "Registered" or "Transferred"

This helps the barangay identify residents who may want to register but haven't yet. The flag is computed when data is imported or entered, and can be updated by re-saving the record.

**Important:** Voter data is for verification and service planning only. It must not be used for political targeting or shared with political campaigns.

---

## Compliance Notes

- **Data Privacy Act (RA 10173):** Every household and individual has a consent field. Only collect data from residents who have given consent. Display the purpose of data collection during registration.
- **CBMS / RBI:** Field names align with RA 11315 (Community-Based Monitoring System) and the Registry of Barangay Inhabitants.
- **Data retention:** Records are retained per government audit requirements. Use "Mark as Transferred" or "Mark as Deceased" rather than deleting records when possible.

---

## Annual Household Verification

The `lastVerifiedDate` field on each household records when the household data was last confirmed as accurate. Households should be re-verified at least once a year. A future enhancement will add automatic reminders for households that haven't been verified in 12+ months.

---

## Tips

- Use the **Template** button to get a correctly formatted import file every time
- When importing, always check the validation preview before committing
- Use filters to create focused reports (e.g., all Senior Citizens in Purok 3, or all 4Ps beneficiaries aged 18–30)
- Export to PDF for printing and posting on the barangay bulletin board
- Export to Excel for further analysis or submission to the municipal/city hall

---

*User Guide v1.0 — August 2026*

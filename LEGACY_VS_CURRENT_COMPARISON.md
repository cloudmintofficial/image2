# Legacy vs Current System — Deep Comparison Report

**Legacy URL:** https://medfileshared2.bharathcloud.com/lab
**Analysis Date:** 2026-05-15

---

## 1. EXECUTIVE SUMMARY

The legacy system is a mature, production-grade LIMS with 1650+ bills processed. The current system replicates ~60% of core workflows but has critical gaps in security, admin modules, reporting, and several production features.

**Overall Feature Parity: ~55%**

| Area | Legacy | Current | Parity |
|------|--------|---------|--------|
| Order Entry | Fully functional | Fully functional | 90% |
| In-Process/Results | Fully functional | Fully functional | 85% |
| Completed Bills | Bill Payment + Print + Orders List | Print only | 50% |
| Previous Bills | Real data + ShiftCollection reports | Hardcoded dummy data | 5% |
| Dashboard | 4 tabs with live data (Financial/Bills/Orders/Billing Category) | 1 tab live, 3 placeholder | 30% |
| Order Maintenance | Full CRUD + Details + Templates + Components | Full CRUD + Details | 85% |
| User Management | Full CRUD + Roles + Discount Approvers + Lab Roles | Hardcoded static data | 5% |
| Doctor Management | Full CRUD | Full CRUD | 90% |
| Department Maintenance | Full CRUD module | Not implemented | 0% |
| Locations | Full CRUD module | Not implemented | 0% |
| Patient Requests | Dedicated module | Not implemented | 0% |
| SMS | Dedicated module | Not implemented | 0% |
| Incoming Labs | Full CRUD (LabName/Address/Contact/Phone/Status) | Not implemented | 0% |
| Reports | ShiftCollectionDetailed + ShiftCollection + SummaryReport | Config pages only, no report generation | 15% |
| Security/Auth | Role-based page restrictions, server-validated | Client-only guards, zero API auth | 15% |

---

## 2. LEGACY SYSTEM — COMPLETE MODULE MAP

### 2.1 Navigation (Icon Sidebar — 11 items)

| # | Icon | Module | Legacy Status |
|---|------|--------|--------------|
| 1 | ➕ | Order Entry (home) | ✅ Full |
| 2 | 🔍 | Search / Previous Bills | ✅ Full |
| 3 | 📋 | In-Process Orders | ✅ Full |
| 4 | ⚙️ | Settings (submenu) | ✅ Full |
| 5 | 🟢 | Completed Bills | ✅ Full |
| 6 | 📊 | Dashboard | ✅ Full |
| 7 | 📄 | Non-Financial Report | ✅ Full |
| 8 | 📑 | Non-Financial Status Report | ✅ Full |
| 9 | 🔧 | Online Request Sample Status | ✅ Full |
| 10 | 🛠️ | Settings/Admin (gear icon, opens submenu) | ✅ Full |
| 11 | 📝 | Worksheet | ✅ Full |

### 2.2 Settings Submenu (Legacy — Admin Only)

| Item | Current Status |
|------|---------------|
| Order Maintenance | ✅ Implemented |
| Department Maintenance | ❌ Missing |
| Doctors | ✅ Implemented |
| Locations | ❌ Missing |
| Lab Users | ❌ Hardcoded only |
| Patient Requests | ❌ Missing |
| SMS | ❌ Missing |
| Incoming Labs | ❌ Missing |

### 2.3 Legacy TopNav Actions (per page)

**Order Entry:** Submit, Clear, Enter Results, Discount, Bill Details, Add Doctor, Add Order, Add Expense

**In-Process:** Non Financial Report, Non Financial Status Report, Online Request Sample Status, WorkSheet

**In-Process Detail (per bill):** Back To Bills, Edit Patient Details, Dispatch, Refresh Bill

**Result Entry:** Bill Orders, Edit Order, Refresh Order

**Completed Bills:** (no top actions — actions are per-row buttons)

**Previous Bills:** ShiftCollectionDetailed, ShiftCollection, SummaryReport

**Order Maintenance:** Add Order, Service Group, Lab Profiles, Lab Default Font, Print Price List, Price List Excel

**Order Details:** Add Order Details, Back To Orders, Order Font, Templates, Add Components Of Existing Order, Print Preview

**Lab Users:** Add Lab User, Add Bill Discount Approvers, Lab Roles

**Dashboard:** Financial, Bills, Orders, Billing Category tabs + Back to Order Entry

---

## 3. FEATURE-BY-FEATURE COMPARISON

### 3.1 Order Entry

| Feature | Legacy | Current | Gap |
|---------|--------|---------|-----|
| Phone/UMR search | ✅ | ✅ | — |
| Patient autocomplete | ✅ | ✅ | — |
| Name field (required, highlighted red border) | ✅ Required border | ✅ Required marker | Minor UI |
| Age/Gender (M/F radio) | ✅ Radio buttons | ✅ Radio buttons | — |
| Source field | ✅ | ✅ | — |
| Phone field | ✅ | ✅ | — |
| Doctor autocomplete | ✅ | ✅ | — |
| Order Name autocomplete | ✅ | ✅ | — |
| Order table (S.No, Name, Date, Amount) | ✅ | ✅ | Current shows more columns |
| Total Bill / Payment Type / Paid Amount / Balance | ✅ | ✅ | — |
| Payment Type dropdown (Cash default) | ✅ Cash/Card/UPI | ✅ Cash/Card/UPI/Online | Current has more options |
| Pat Orders button | ✅ | ✅ | — |
| Addl. Details button | ✅ | ✅ | — |
| Advance Search | ✅ | ✅ | — |
| Add button (for patient) | ✅ | ✅ via inline | — |
| Clear button | ✅ | ✅ | — |
| Patient avatar/photo | ✅ Generic avatar shown | ✅ Similar | — |
| Enter Results (top nav) | ✅ Direct navigation | ✅ | — |
| Bill Details (top nav) | ✅ Opens details | ⚠️ Partial — modal exists but limited | Gap |
| Discount modal | ✅ | ✅ | — |

### 3.2 In-Process / Result Entry

| Feature | Legacy | Current | Gap |
|---------|--------|---------|-----|
| Bill list with Orders List button per row | ✅ Green "Orders List" buttons | ✅ Similar | — |
| Color coding (green = pending, black = completed) | ✅ | ✅ Status badges | Different visual approach |
| Bill detail header (Bill No, Patient, Phone, Gender, Age, UMR) | ✅ | ✅ | — |
| GroupNumber column | ✅ Editable group number input | ❌ Missing | Gap — legacy allows grouping orders |
| Result Entry button per order | ✅ | ✅ | — |
| Edit Dates button per order | ✅ | ✅ | — |
| Sample.Type column | ✅ Shows sample type per order | ⚠️ Not shown in list | Gap |
| Rich text editor (Page 1 / Page 2 tabs) | ✅ | ✅ | — |
| Method field | ✅ | ✅ | — |
| Service Doctor dropdown | ✅ "Select Service Doctor" | ✅ | — |
| ADVICE textarea | ✅ | ✅ | — |
| Upload Result File + Add Attachments | ✅ | ❌ Missing | Gap — no file attachment on results |
| Status: "Sample Received" label | ✅ Shows on result entry | ⚠️ Shows differently | Minor |
| Department display on result entry | ✅ Shows department prominently | ✅ | — |
| Reff.Doctor display on result entry | ✅ Shows referring doctor | ⚠️ Partial | — |
| Edit Order (top nav in result entry) | ✅ | ❌ Missing | Gap |
| Refresh Order (top nav in result entry) | ✅ | ❌ Missing | Gap |
| Dispatch (greyed until authorized) | ✅ Disabled until ready | ✅ | — |
| Refresh Bill | ✅ | ❌ Missing | Gap |

### 3.3 Completed Bills

| Feature | Legacy | Current | Gap |
|---------|--------|---------|-----|
| Bill list with action buttons per row | ✅ 3 buttons per row | ✅ 2 buttons | Gap |
| Bill Payment button (green) | ✅ Functional — records payment | ⚠️ Button exists but non-functional | 🐞 Bug |
| Print Bill button (blue) | ✅ | ✅ | — |
| Orders List button (orange) | ✅ Opens order details | ❌ Button exists, no handler | 🐞 Bug |
| Bill Details button (red, for authorized bills) | ✅ | ❌ | Gap |
| Patient details in table (Name/Age/Gender/Phone) | ✅ Combined column | ✅ Separate columns | — |

### 3.4 Previous Bills / Search

| Feature | Legacy | Current | Gap |
|---------|--------|---------|-----|
| Real bill data from API | ✅ Live data (1650+ bills) | ❌ Hardcoded 10 dummy rows | 🔴 Critical |
| Bill list (Bill No, Bill Date with time, Patient, Orders) | ✅ | ❌ Dummy | 🔴 Critical |
| ShiftCollectionDetailed report button | ✅ Opens report | ❌ Not implemented | Gap |
| ShiftCollection report button | ✅ Opens report | ❌ Not implemented | Gap |
| SummaryReport button | ✅ Opens report | ❌ Not implemented | Gap |
| Date/time format (15-May-2026 07:10 PM) | ✅ | N/A | — |

### 3.5 Dashboard

| Feature | Legacy | Current | Gap |
|---------|--------|---------|-----|
| Financial tab — Billing Overview | ✅ Live data | ✅ Live data | — |
| Financial — No of Logged In Users | ✅ Shows count | ❌ Missing | Gap |
| Financial — No of Bills / Cancelled Bills | ✅ | ✅ | — |
| Financial — No of Refunded Orders | ✅ | ⚠️ Shows refunded bills not orders | Minor |
| Financial — No of Cancelled Orders | ✅ | ❌ Missing | Gap |
| Financial — Total Billed/Cancelled/Refunded/Returned Amount | ✅ | ⚠️ Partial (3 of 4) | Gap — missing Total Returned |
| Bills tab — Bill Status Overview | ✅ Total/Pending/Saved/Completed/Dispatched | ❌ Placeholder | Gap |
| Orders tab — Orders Status Overview | ✅ Total/Pending/Saved/Completed/Dispatched | ❌ Placeholder | Gap |
| Billing Category tab — OP/None breakdown | ✅ Billed Amount + Paid Amount per category | ❌ Placeholder | Gap |
| Back to Order Entry button | ✅ | ❌ Missing | Minor |

### 3.6 Order Maintenance

| Feature | Legacy | Current | Gap |
|---------|--------|---------|-----|
| Order list (Name, Amount, Order Type, Status) | ✅ | ✅ (more columns) | Current is better |
| Details button per order (red) | ✅ Opens component page | ✅ | — |
| Add Order form | ✅ Modal-style full page | ✅ Full page | — |
| Service Group | ✅ | ✅ | — |
| Lab Profiles | ✅ | ❌ Missing | Gap |
| Lab Default Font | ✅ | ✅ | — |
| Print Price List | ✅ | ✅ | — |
| Price List Excel | ✅ | ✅ (CSV) | Minor format difference |
| Order Details page — Sub Heading/Component/Range/Units/Status | ✅ | ✅ | — |
| Order Font (per-test font config) | ✅ | ✅ | — |
| Templates (age/gender based) | ✅ | ✅ | — |
| Add Components Of Existing Order | ✅ | ✅ | — |
| Print Preview | ✅ | ✅ | — |

### 3.7 Lab Users (Admin)

| Feature | Legacy | Current | Gap |
|---------|--------|---------|-----|
| User list (Username, Location, Default Screen, Role, Status) | ✅ Live data (16+ users) | ❌ 3 hardcoded users | 🔴 Critical |
| Add Lab User | ✅ Functional | ❌ Not implemented | 🔴 Critical |
| Add Bill Discount Approvers | ✅ | ❌ Not implemented | Gap |
| Lab Roles management | ✅ | ❌ Not implemented | Gap |
| Default Screen per user (Order Entry / InProcess Orders) | ✅ | ❌ Not implemented | Gap |
| Location per user | ✅ | ❌ Not implemented | Gap |
| Role types: Lab, lab&Reception, Moderator, manager&ct tech, usg department, SrinivasManager, reception | ✅ Granular roles | ⚠️ Only Owner/Reception/LabEntry | Gap |
| Active/InActive status toggle | ✅ | ❌ Not implemented | Gap |

### 3.8 Incoming Labs

| Feature | Legacy | Current | Gap |
|---------|--------|---------|-----|
| Lab list (LabName, LabAddress, ContactPerson, PrimaryPhone, Status) | ✅ 3 labs configured | ❌ Entire module missing | 🔴 Missing |
| Add Incoming Lab | ✅ | ❌ | Missing |

### 3.9 Doctors

| Feature | Legacy | Current | Gap |
|---------|--------|---------|-----|
| Doctor CRUD | ✅ | ✅ | — |
| Commission tracking | ✅ | ✅ | — |
| Status management | ✅ | ✅ | — |

---

## 4. MISSING MODULES (Legacy has, Current doesn't)

| Module | Priority | Estimated Effort |
|--------|----------|-----------------|
| **Department Maintenance** — CRUD for lab departments | High | 2 days |
| **Locations** — Multi-location management | Medium | 2 days |
| **Lab Users** — Full CRUD with roles, default screens, locations | 🔴 Critical | 4 days |
| **Lab Roles** — Custom role creation and permission mapping | High | 3 days |
| **Bill Discount Approvers** — Approval workflow for discounts | Medium | 2 days |
| **Patient Requests** — Patient-facing request system | Medium | 5 days |
| **SMS** — SMS notification system | Medium | 3 days |
| **Incoming Labs** — External lab referral management | Medium | 2 days |
| **Lab Profiles** — Lab configuration profiles | Medium | 2 days |
| **Report Generation** — ShiftCollectionDetailed, ShiftCollection, SummaryReport | 🔴 Critical | 5 days |

---

## 5. WORKFLOW COMPARISON

### 5.1 Patient Registration → Billing

| Step | Legacy | Current | Gap |
|------|--------|---------|-----|
| 1. Enter phone/UMR | ✅ Click "Search" button | ✅ Auto-search on input | Current is better |
| 2. Patient found → auto-fill | ✅ | ✅ | — |
| 3. New patient → fill Name (required) | ✅ Red border on Name | ✅ Required marker | — |
| 4. Select orders | ✅ Type in Order Name field | ✅ Autocomplete dropdown | Current is better |
| 5. Doctor selection | ✅ Autocomplete | ✅ Autocomplete | — |
| 6. Payment entry | ✅ Payment Type + Paid Amount | ✅ Same + reference number | Current is better |
| 7. Submit | ✅ Top nav "Submit" | ✅ Top nav "Submit" | — |
| 8. Auto-navigate to results | ✅ "Enter Results" takes to in-process | ✅ Same | — |

### 5.2 Result Entry → Dispatch

| Step | Legacy | Current | Gap |
|------|--------|---------|-----|
| 1. Select bill from list | ✅ Click "Orders List" | ✅ Click bill row | — |
| 2. View order list with group numbers | ✅ GroupNumber editable | ❌ No group number | Gap |
| 3. Click "Result Entry" | ✅ | ✅ | — |
| 4. Rich text entry with template | ✅ Page 1/Page 2 tabs | ✅ Same | — |
| 5. Upload result file attachment | ✅ "Add Attachments" button | ❌ Missing | Gap |
| 6. Select service doctor | ✅ Dropdown | ✅ Dropdown | — |
| 7. Save/Complete | ✅ | ✅ | — |
| 8. Authorize | ✅ | ✅ | — |
| 9. Dispatch | ✅ Enabled after auth | ✅ Same | — |

### 5.3 Report Generation

| Step | Legacy | Current | Gap |
|------|--------|---------|-----|
| 1. Navigate to Previous Bills | ✅ Real data | ❌ Dummy data | 🔴 Critical |
| 2. Click ShiftCollectionDetailed | ✅ Opens report window | ❌ Not implemented | 🔴 Critical |
| 3. Click ShiftCollection | ✅ Opens summary report | ❌ Not implemented | 🔴 Critical |
| 4. Click SummaryReport | ✅ Opens summary | ❌ Not implemented | 🔴 Critical |

---

## 6. UI/UX COMPARISON

| Aspect | Legacy | Current | Assessment |
|--------|--------|---------|-----------|
| Visual design | Classic/functional, dated look | Modern, polished, dark mode | ✅ Current is better |
| Navigation | Icon-only sidebar (no labels) | Labeled sidebar with icons | ✅ Current is better |
| Responsiveness | Desktop-only, no mobile support | Responsive with mobile layout | ✅ Current is better |
| Form styling | Basic HTML inputs | Styled with focus states, gradients | ✅ Current is better |
| Loading states | No loading indicators | Toast notifications + spinners | ✅ Current is better |
| Dark mode | Not available | ✅ Full dark mode | ✅ Current is better |
| Action buttons per row | Color-coded (Green/Blue/Orange/Red) | Fewer actions available | ⚠️ Legacy has more actions |
| Table density | Compact, more data visible | More spacing, fewer rows visible | Trade-off |
| Print output | Professional formatted reports | Professional formatted reports | Equal |
| Keyboard shortcuts | Not observed | Alt+O/I/C/P shortcuts | ✅ Current is better |
| Settings submenu | Dropdown overlay on sidebar | Dedicated sidebar section | ✅ Current is better |
| Speed/Performance | Fast (server-rendered) | Fast (client SPA) | Equal |

### Missing UI Elements in Current

| Element | Details |
|---------|---------|
| GroupNumber input in in-process | Legacy shows editable group number per order |
| Sample.Type column in in-process | Legacy shows sample type per order row |
| "Add Attachments" on result entry | Legacy allows file upload per result |
| "Edit Order" in result entry topnav | Legacy allows editing order from result view |
| "Refresh Bill" / "Refresh Order" buttons | Legacy has explicit refresh actions |
| Bill Payment modal (functional) | Current modal exists but submit is broken |
| Orders List button (completed bills) | Current button has no click handler |
| Discount Approvers management | Entire workflow missing |
| Lab Roles management screen | Entire screen missing |

---

## 7. BACKEND & API GAPS

### 7.1 Missing API Endpoints

| Endpoint | Purpose | Priority |
|----------|---------|----------|
| `GET/POST /api/departments` | Department CRUD | High |
| `GET/POST /api/locations` | Location CRUD | Medium |
| `GET/POST/PUT /api/users` | User CRUD (currently hardcoded) | 🔴 Critical |
| `GET/POST /api/roles` | Lab role management | High |
| `GET/POST /api/discount-approvers` | Discount approval config | Medium |
| `GET/POST /api/incoming-labs` | Incoming lab management | Medium |
| `GET /api/bills/previous` | Previous bills with real data | 🔴 Critical |
| `GET /api/reports/shift-collection` | Shift collection report data | 🔴 Critical |
| `GET /api/reports/shift-collection-detailed` | Detailed shift collection | 🔴 Critical |
| `GET /api/reports/summary` | Summary report | 🔴 Critical |
| `GET /api/dashboard/bills-status` | Bills status overview (Pending/Saved/Completed/Dispatched) | High |
| `GET /api/dashboard/orders-status` | Orders status overview | High |
| `GET /api/dashboard/billing-category` | Billing category breakdown | High |
| `POST /api/bills/[id]/payment` | Record payment on completed bill | High |
| `POST /api/orders/[id]/attachments` | Upload result file attachment | Medium |
| `GET /api/lab-profiles` | Lab profile management | Medium |
| `GET/POST /api/patient-requests` | Patient request handling | Medium |
| `POST /api/sms/send` | SMS notification sending | Medium |

### 7.2 Missing API Auth (ALL routes)

Every single API route in the current system lacks authentication. The legacy system validates sessions server-side.

---

## 8. DATABASE GAPS

### 8.1 Missing Models/Tables

| Model | Fields Needed | Purpose |
|-------|--------------|---------|
| `Department` | id, name, status, labId | Department management |
| `Location` | id, name, address, phone, labId, status | Multi-location support |
| `Role` | id, name, permissions, labId | Custom role definitions |
| `DiscountApprover` | id, userId, maxAmount, labId | Discount approval rules |
| `IncomingLab` | id, labName, labAddress, contactPerson, primaryPhone, status | External lab referrals |
| `PatientRequest` | id, patientId, requestType, status, createdAt | Patient request tracking |
| `SMSLog` | id, phone, message, status, sentAt | SMS delivery tracking |
| `ResultAttachment` | id, orderItemId, fileUrl, fileName, uploadedAt | Result file attachments |

### 8.2 Missing Fields on Existing Models

| Model | Missing Field | Purpose |
|-------|--------------|---------|
| `User` | `defaultScreen` | Legacy shows Order Entry / InProcess Orders per user |
| `User` | `locationId` | User-location assignment |
| `OrderItem` | `groupNumber` | Legacy allows grouping orders on a bill |
| `OrderItem` | `sampleReceivedAt` | Track sample collection timestamp |
| `Bill` | `savedStatus` | Legacy has Pending/Saved/Completed/Dispatched granularity |

---

## 9. SECURITY COMPARISON

| Security Feature | Legacy | Current |
|-----------------|--------|---------|
| Server-side session validation | ✅ | ❌ None |
| Role-based page access | ✅ Server-enforced | ⚠️ Client-only sidebar hiding |
| Role-based API access | ✅ | ❌ Zero API auth |
| Discount approval workflow | ✅ Dedicated approvers | ❌ Anyone can discount |
| User CRUD (admin only) | ✅ | ❌ Hardcoded |
| Password management | ✅ | ❌ No change password |
| Audit logging | ✅ Implied by structured data | ❌ AuditLog model exists but unused |
| Multi-lab data isolation | ✅ | ❌ No labId filtering |

---

## 10. PRODUCTION READINESS

| Metric | Score | Blocker? |
|--------|-------|----------|
| Core workflow (Order→Result→Dispatch) | 85% | No |
| Admin modules | 20% | 🔴 Yes |
| User management | 5% | 🔴 Yes |
| Reports | 10% | 🔴 Yes |
| Previous Bills | 5% | 🔴 Yes |
| API Security | 0% | 🔴 Yes |
| Dashboard completeness | 30% | ⚠️ Partial |
| Missing modules (Dept/Location/IncomingLabs/SMS) | 0% | ⚠️ Yes for parity |

**Overall Production Readiness: 25%**

---

## 11. PRIORITIZED DEVELOPMENT ROADMAP

### Phase 1 — Critical Blockers (Week 1-2)
1. API authentication middleware on ALL routes
2. User Management CRUD (replace hardcoded data)
3. Previous Bills page with real API data
4. Bill Payment functionality (completed bills)
5. Orders List button handler (completed bills)

### Phase 2 — Feature Parity (Week 3-4)
6. Dashboard — Bills Status, Orders Status, Billing Category tabs
7. Report generation — ShiftCollection, ShiftCollectionDetailed, SummaryReport
8. Department Maintenance module
9. Incoming Labs module
10. Role management + Discount Approvers

### Phase 3 — Advanced Features (Week 5-6)
11. Locations management
12. Lab Profiles
13. Result file attachments (Add Attachments on result entry)
14. GroupNumber support in in-process
15. Patient Requests module
16. SMS module

### Phase 4 — Polish (Week 7-8)
17. Audit logging implementation
18. Multi-lab data isolation
19. Edit Order from result entry view
20. Refresh Bill/Order buttons
21. Comprehensive E2E tests

---

## 12. CONCLUSION

The current system has a **significantly better UI/UX** than the legacy system — modern design, dark mode, responsive layout, and smooth interactions. However, it is missing **critical backend and admin functionality** that the legacy system provides. The biggest gaps are:

1. **Zero API security** (legacy validates all requests server-side)
2. **User Management is completely non-functional** (hardcoded data vs 16+ real users in legacy)
3. **Previous Bills uses dummy data** (legacy has 1650+ real bills)
4. **Reports are not implemented** (legacy generates 3 types of shift/summary reports)
5. **5 entire modules are missing** (Departments, Locations, Incoming Labs, Patient Requests, SMS)

**The core lab workflow (Order Entry → In-Process → Results → Authorization → Dispatch) is at 85-90% feature parity** and works well. The gap is primarily in administrative, reporting, and security layers.

**Estimated effort to reach legacy feature parity: 6-8 weeks of focused development.**

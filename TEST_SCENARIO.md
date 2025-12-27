# GearGuard - Comprehensive Test Scenario

## Overview
This test scenario walks through all major features of the GearGuard maintenance management system. Complete these steps sequentially to validate the full workflow.

---

## Step 1: Create Admin User via Signup

**URL:** `http://localhost:5173/signup`

**Actions:**
1. Click "Sign Up" link or navigate directly to signup
2. Fill in form:
   - **Email:** admin@gearguard.com
   - **Password:** Admin@123456
   - **Confirm Password:** Admin@123456
3. Click "Sign Up" button
4. **Expected Result:** Redirected to Dashboard; user logged in as admin

**Verify:**
- Navbar shows "Admin" user name
- Sidebar shows all menu items including "Teams" option

---

## Step 2: Login as Admin

**URL:** `http://localhost:5173/login`

**Actions:**
1. Click "Log Out" in navbar (to test login)
2. Fill login form:
   - **Email:** admin@gearguard.com
   - **Password:** Admin@123456
3. Click "Login" button
4. **Expected Result:** Redirected to Dashboard; authenticated

**Verify:**
- User remains logged in across page navigation
- Token stored in localStorage (check DevTools → Application → Local Storage)

---

## Step 3: Create Maintenance Teams

**URL:** `http://localhost:5173/teams`

**Actions - Team 1 (Mechanics):**
1. Click "Create Team" button
2. Fill modal form:
   - **Team Name:** Mechanics
   - **Specialization:** Equipment repair and maintenance
3. Click "Create" button
4. **Expected Result:** Team appears in grid

**Actions - Team 2 (IT):**
1. Click "Create Team" button
2. Fill modal form:
   - **Team Name:** IT
   - **Specialization:** Computer systems and software support
3. Click "Create" button
4. **Expected Result:** Team appears in grid; total of 2 teams visible

**Verify:**
- Both teams display in grid layout
- Teams are clickable (prepare for Step 4)

---

## Step 4: Add Technicians to Teams

**Actions - Add to Mechanics Team:**
1. Click on "Mechanics" team card
2. In modal, you should see "Add Members" dropdown
3. Select a user to add (or create new test user first via signup in another browser tab)
   - Create test user: `tech1@gearguard.com` / `Tech@123456`
   - Create test user: `tech2@gearguard.com` / `Tech@123456`
4. Add `tech1@gearguard.com` to Mechanics team
5. Click member chip X button to confirm addition
6. **Expected Result:** Member appears as chip in modal

**Actions - Add to IT Team:**
1. Click on "IT" team card
2. Add `tech2@gearguard.com` to IT team
3. **Expected Result:** Member added to IT team

**Verify:**
- Each team shows selected members as chips with X button
- Members can be added/removed dynamically

---

## Step 5: Create Equipment Items Assigned to Teams

**URL:** `http://localhost:5173/equipment`

**Actions - Equipment 1 (CNC Machine):**
1. Click "Create Equipment" button
2. Fill form:
   - **Name:** CNC Machine Model X
   - **Serial Number:** CNC-2024-001
   - **Category:** Machinery
   - **Department:** Production
   - **Location:** Building A - Floor 2
   - **Purchase Date:** 2023-01-15
   - **Warranty Expiry:** 2025-01-15
   - **Maintenance Team:** Mechanics
   - **Assigned Employee:** tech1@gearguard.com
3. Click "Create" button
4. **Expected Result:** Equipment appears in grid

**Actions - Equipment 2 (Server):**
1. Click "Create Equipment" button
2. Fill form:
   - **Name:** Main Server
   - **Serial Number:** SRV-2024-001
   - **Category:** IT
   - **Department:** IT
   - **Location:** Server Room
   - **Purchase Date:** 2022-06-20
   - **Warranty Expiry:** 2025-06-20
   - **Maintenance Team:** IT
   - **Assigned Employee:** tech2@gearguard.com
3. Click "Create" button
4. **Expected Result:** Equipment appears in grid

**Verify:**
- Both equipment items visible on Equipment page
- Filter by team or department works
- Search by name/serial works
- Equipment detail page shows correct info

---

## Step 6: Create a Corrective Maintenance Request

**URL:** `http://localhost:5173/equipment`

**Actions:**
1. Click on "CNC Machine Model X" equipment card
2. In Equipment Detail page, click "Create Request" button
3. Fill request form:
   - **Equipment:** CNC Machine Model X (auto-filled)
   - **Request Type:** Corrective
   - **Subject:** CNC machine spindle not responding
   - **Description:** Machine spindle fails to start. Error code 05 displayed on control panel.
   - **Do NOT fill:** "Scheduled Date" (only for preventive)
4. Click "Create" button
5. **Expected Result:** Request created; redirected to Maintenance Requests (Kanban)

**Verify:**
- Request appears in "NEW" column of Kanban board
- Request shows correct subject and equipment
- Request card displays "Corrective" badge
- Tech avatar visible (if assigned)

---

## Step 7: Assign Technician and Move to In-Progress

**URL:** `http://localhost:5173/requests`

**Actions:**
1. Click on the "CNC machine spindle" request card
2. Request Detail page opens
3. In sidebar, click "Assign to Me" button (assuming you're logged in as admin)
   - **Note:** If button not available, use "Assign Technician" dropdown and select tech1
4. **Expected Result:** Request shows assigned technician
5. Change stage to "In Progress":
   - Click stage dropdown currently showing "NEW"
   - Select "IN_PROGRESS"
6. **Expected Result:** Stage updated; request moved to IN_PROGRESS column in Kanban
7. Go back to Kanban board to verify

**Verify:**
- Request moved to "IN_PROGRESS" column
- Technician name displayed on request
- Timestamp updated

---

## Step 8: Complete Request with Duration

**Actions:**
1. Click on the "CNC machine spindle" request card
2. In Request Detail page, scroll to bottom of sidebar
3. Enter duration:
   - **Duration Hours:** 2
4. Click "Mark as Repaired" button
5. **Expected Result:** Request moves to "REPAIRED" column; marked complete

**Verify:**
- Request appears in "REPAIRED" column on Kanban
- Duration stored (visible on request detail: "Completed in 2 hours")
- Completion timestamp recorded

---

## Step 9: Create Preventive Request with Scheduled Date

**URL:** `http://localhost:5173/equipment`

**Actions:**
1. Click on "Main Server" equipment card
2. In Equipment Detail page, click "Create Request" button
3. Fill request form:
   - **Equipment:** Main Server (auto-filled)
   - **Request Type:** Preventive
   - **Subject:** Monthly server health check
   - **Description:** Regular preventive maintenance. Check system logs, disk usage, memory, backup status.
   - **Scheduled Date:** 2025-01-15 (future date)
4. Click "Create" button
5. **Expected Result:** Request created with scheduled date

**Verify:**
- Request appears in "NEW" column
- Request shows "Preventive" badge
- Scheduled date visible on card (if not overdue)

---

## Step 10: View on Calendar

**URL:** `http://localhost:5173/requests`

**Actions:**
1. Look for calendar toggle or view option (if calendar view implemented)
   - **Note:** Calendar view may not be fully integrated in current version
2. **Alternative:** Click on preventive request to view scheduled date in detail
3. Check if request shows scheduled date of January 15, 2025

**Verify:**
- Preventive request displays scheduled date clearly
- Date is future-dated (not marked overdue)
- Can navigate back to Kanban view

**Note on Calendar Feature:**
- React Big Calendar is installed in package.json
- Full calendar integration not yet implemented
- Scheduled dates are visible in request details

---

## Step 11: Check Dashboard Statistics

**URL:** `http://localhost:5173/dashboard`

**Actions:**
1. Click on "Dashboard" in sidebar
2. **Expected Results by Card:**

   **Total Requests Card:**
   - Shows "2" (1 completed corrective + 1 new preventive)
   - Or shows "3" if incomplete requests included

   **Open Requests Card:**
   - Shows "1" (only preventive request in NEW status)

   **Overdue Requests Card:**
   - Shows "0" (preventive has future date)

   **Completed Requests Card:**
   - Shows "1" (completed corrective request)

3. **Bar Chart Section:**
   - X-axis shows teams (Mechanics, IT)
   - Y-axis shows request count
   - Mechanics bar height = 1 (CNC request)
   - IT bar height = 1 (Server request)

4. **Recent Requests Table:**
   - Shows last 5 requests (in this case, both requests)
   - Displays: Subject, Equipment, Stage, Technician, Created Date
   - Sorting by most recent first

**Verify:**
- Numbers match actual requests created
- Chart reflects team distribution
- Recent requests show latest activity
- All statistics are clickable/drill-down capable (optional enhancement)

---

## Additional Test Cases (Optional)

### Test Case A: Filter Equipment
1. Go to Equipment page
2. Use filters:
   - **Search:** Type "CNC" → should show CNC Machine only
   - **Category:** Select "IT" → should show Main Server only
   - **Department:** Select "Production" → should show CNC Machine only
3. Reset filters

### Test Case B: Drag-Drop in Kanban
1. Go to Maintenance Requests (Kanban view)
2. Drag "Monthly server health check" request from NEW to IN_PROGRESS column
3. **Expected Result:** Request moves and API updates stage
4. Refresh page → request stays in new column (persisted)

### Test Case C: Edit Equipment
1. Go to Equipment page
2. Click on equipment card → Equipment Detail page
3. Click "Edit" button
4. Modify:
   - **Location:** Changed to "Building B - Floor 1"
   - **Assigned Employee:** Change to different tech
5. Click "Update" button
6. **Expected Result:** Equipment updated; detail page refreshes with new values

### Test Case D: Delete Request
1. Create a test corrective request
2. On request detail page, click "Delete" button
3. Confirm deletion
4. **Expected Result:** Request removed from Kanban board

### Test Case E: Multi-User Login
1. Open private/incognito browser window
2. Login as `tech1@gearguard.com`
3. Go to Equipment page
4. Click on "CNC Machine" → see it's assigned to this user
5. Go to Requests → see requests assigned to this technician
6. Try to access "Teams" page → should see "Access Denied" (technician role)
7. **Expected Result:** Role-based access control enforced

### Test Case F: Error Handling
1. Try to create equipment without required fields
   - **Expected:** Form validation error below field
2. Try to create request with subject < 3 characters
   - **Expected:** Validation error shown
3. Disconnect backend server
4. Refresh page
   - **Expected:** Error message displayed (LoadingSpinner → ErrorMessage)
5. Restart backend
6. Click retry or refresh
   - **Expected:** Data loads successfully

---

## Summary of Test Coverage

| Feature | Step | Status |
|---------|------|--------|
| User Authentication | 1-2 | ✓ Signup, Login |
| Team Management | 3-4 | ✓ Create teams, Add members |
| Equipment Management | 5 | ✓ Create, Filter, View |
| Corrective Requests | 6-8 | ✓ Create, Assign, Complete |
| Preventive Requests | 9 | ✓ Create with scheduled date |
| Calendar View | 10 | ◐ Dates visible, full calendar UI pending |
| Dashboard | 11 | ✓ KPIs, Charts, Recent activity |
| Role-Based Access | Optional | ✓ Implemented via ProtectedRoute |

---

## Known Limitations

1. **Calendar View:** Full calendar UI not yet implemented; dates visible in request details
2. **Real-Time Updates:** No WebSocket; manual refresh required to see changes from other users
3. **Pagination:** Equipment list paginated; Kanban loads all requests
4. **Notifications:** No in-app notifications for request assignments

---

## Running the Application

**Backend:**
```bash
cd backend
pip install -r requirements.txt
python -m uvicorn main:app --reload
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

**Expected URLs:**
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:8000`
- API Docs: `http://localhost:8000/docs` (Swagger)

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| API connection error | Check backend is running; verify VITE_API_BASE_URL in frontend/.env |
| Login fails | Verify user created in Step 1; check DATABASE_URL in backend/.env |
| Requests not showing | Check team/equipment created first; refresh page |
| Role-based access denied | Verify user role matches required role; logout and re-login |
| Style/UI broken | Clear browser cache; run `npm run build` in frontend |


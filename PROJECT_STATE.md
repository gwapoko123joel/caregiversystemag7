## 🐛 Active Issues (As of [today])

### Critical
- [ ] system_users referenced in 23 places across 3 files
  - src/services/authService.ts (7 refs)
  - src/services/profileService.ts (10 refs)  
  - src/contexts/AuthContext.tsx (6 refs)
  
- [ ] Caregiver dashboard makes 50+ requests on load
  - Render loop in unknown component
  - Includes 400 errors from system_users queries
  
- [ ] AuthContext has useCallback loop
  - Profile fetched 3-5 times per login
  - All 3 user roles affected

### Medium  
- [ ] Role string mismatch ('practitioner' vs 'medical_practitioner')
  - Found in queries that try BOTH values
  - Should standardize on 'medical_practitioner'

### Low
- [ ] /governance route documentation was wrong
  - Real route is /governance, not /login/governance
  - Update DECISIONS.md


  ## 🔄 Currently Refactoring

**Goal:** Replace all `system_users` references with `caregivers` table

**Files being refactored:**
1. src/services/profileService.ts (10 refs)
2. src/contexts/AuthContext.tsx (6 refs)
3. src/services/authService.ts (7 refs)

**Started:** [today's date]
**Status:** In progress

**Success criteria:**
- All 3 logins work
- No 400 errors in console  
- No more than 5 network requests on dashboard load
- system_users view can be dropped at the end



## ✅ Recently Completed

### [Today's Date] — Phase B: profileService.ts Refactored
- Replaced 10 system_users references with caregivers
- All profile-fetch operations now use real schema
- Caregiver and admin login still work
- AuthContext-related 400 errors remain (Phase C)
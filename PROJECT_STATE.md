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
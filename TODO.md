## 📋 Important (Do Soon)

- [ ] Fix AuthContext loop: profile is fetched 3x on login
  - File: src/contexts/AuthContext.tsx
  - Issue: useCallback dependencies cause re-renders
  - Fix: Remove `profile` and `loading` from useCallback deps,
         add proper guards instead
  - Symptom: Console shows INITIAL_SESSION 5x, SIGNED_IN 3x
  - Discovered: [today's date]
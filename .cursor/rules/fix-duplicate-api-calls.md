# Fix Duplicate API Calls Rule

## Problem
React 18 Strict Mode causes useEffect to run twice in development, which can cause duplicate API calls if not handled properly.

## Solution Pattern

### 1. For data fetching functions - ALWAYS use useCallback with AbortController

**WRONG ❌:**
```tsx
const fetchData = () => {
  api.getData().then(setData);
};

useEffect(() => {
  fetchData();
}, []);
```

**RIGHT ✅:**
```tsx
const fetchData = useCallback((signal?: AbortSignal) => {
  api.getData({ signal }).then(setData);
}, []);

useEffect(() => {
  const ctrl = new AbortController();
  fetchData(ctrl.signal);
  return () => ctrl.abort();
}, [fetchData]);
```

### 2. If using inline promise in useEffect - use AbortController pattern

**WRONG ❌:**
```tsx
useEffect(() => {
  api.getData().then(setData);
}, []);
```

**RIGHT ✅:**
```tsx
useEffect(() => {
  const ctrl = new AbortController();
  api.getData({ signal: ctrl.signal })
    .then(setData)
    .catch(() => {});
  return () => ctrl.abort();
}, []);
```

### 3. If defining fetch function outside useEffect - use useCallback

**WRONG ❌:**
```tsx
const fetchCertificates = () => {
  doctorsApi.me.getCertificates()
    .then((res) => setCertificates(...))
    .finally(() => setLoading(false));
};

useEffect(() => {
  fetchCertificates();
}, []);
```

**RIGHT ✅:**
```tsx
const fetchCertificates = useCallback(() => {
  setLoading(true);
  doctorsApi.me.getCertificates()
    .then((res) => {
      const list = res.data?.certificates ?? res.data?.data?.certificates ?? [];
      setCertificates(Array.isArray(list) ? list : []);
    })
    .catch(() => setCertificates([]))
    .finally(() => setLoading(false));
}, []);

useEffect(() => {
  const ctrl = new AbortController();
  fetchCertificates();
  return () => ctrl.abort();
}, [fetchCertificates]);
```

## Files to Fix

### High Priority (has the bug):
1. `frontend/src/pages/doctor/UploadCertificates.tsx` - fetchCertificates không dùng useCallback, không có AbortController
2. `frontend/src/pages/doctor/Dashboard.tsx` - Promise.all không có abort
3. `frontend/src/pages/doctor/Appointments.tsx` - không có return abort
4. `frontend/src/pages/doctor/Patients.tsx` - không có return abort
5. `frontend/src/pages/doctor/Schedule.tsx` - Promise.all không có abort
6. `frontend/src/pages/customer/Dashboard.tsx` - Promise.all không có abort
7. `frontend/src/pages/customer/Appointments.tsx` - không có return abort
8. `frontend/src/pages/customer/AvailableDoctors.tsx` - 2 useEffect không có abort
9. `frontend/src/pages/customer/Consult.tsx` - 2 useEffect không có abort
10. `frontend/src/pages/customer/SearchResults.tsx` - runSearch không dùng useCallback

### Medium Priority:
- `frontend/src/pages/admin/Dashboard.tsx`
- `frontend/src/pages/admin/Reports.tsx`
- `frontend/src/pages/admin/Hospitals.tsx`
- `frontend/src/pages/admin/Doctors.tsx`
- `frontend/src/pages/admin/Employees.tsx`
- `frontend/src/pages/admin/Logs.tsx`
- `frontend/src/pages/admin/Users.tsx`
- `frontend/src/pages/public/DoctorsList.tsx`
- `frontend/src/pages/public/DoctorProfile.tsx`

## Implementation Steps

For each file, apply the fix pattern:

1. Add `useCallback` to fetch functions
2. Add `AbortController` to all useEffect that calls API
3. Add cleanup return `() => ctrl.abort()`
4. Include all required dependencies in useEffect dependency array

## Important Notes

- Always pass `{ signal: ctrl.signal }` to API calls
- Use `.catch(() => {})` to prevent unhandled promise rejections when aborted
- The `cancelled` object pattern is optional - AbortController alone is sufficient
- Make sure to set loading state properly in both success and error cases
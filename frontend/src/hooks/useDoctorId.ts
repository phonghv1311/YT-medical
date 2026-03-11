import { useEffect } from 'react';
import { useAppSelector, useAppDispatch } from './useAppDispatch';
import { fetchDoctorId } from '../store/authSlice';
import { getRole } from '../utils/auth';

/**
 * Returns the current doctor's ID (Doctor.id from backend).
 * For doctor users, fetches /doctors/me once and caches in auth state so that
 * API calls use the correct doctor row id, not the user id.
 */
export function useDoctorId(): number {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const doctorId = useAppSelector((state) => state.auth.doctorId);

  useEffect(() => {
    if (!user || getRole(user) !== 'doctor') return;
    if (doctorId != null) return;
    dispatch(fetchDoctorId());
  }, [user, doctorId, dispatch]);

  return doctorId ?? user?.id ?? 1;
}

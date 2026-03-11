import { useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '../hooks/useAppDispatch';
import { logout } from '../store/authSlice';
import { TOKEN_EXPIRES_AT_KEY } from '../utils/jwt';

const CHECK_INTERVAL_MS = 60 * 1000; // 1 minute

/**
 * When the user is logged in, checks every minute if the access token has expired (e.g. after 2h).
 * If expired, dispatches logout so the user is redirected to login.
 */
export default function SessionExpiryChecker() {
  const dispatch = useAppDispatch();
  const accessToken = useAppSelector((s) => s.auth.accessToken);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    function check() {
      const expiresAt = localStorage.getItem(TOKEN_EXPIRES_AT_KEY);
      if (!expiresAt || !accessToken) return;
      if (Date.now() >= Number(expiresAt)) {
        dispatch(logout());
      }
    }

    check();
    intervalRef.current = setInterval(check, CHECK_INTERVAL_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [accessToken, dispatch]);

  return null;
}

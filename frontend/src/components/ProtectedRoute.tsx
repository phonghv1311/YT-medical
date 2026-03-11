import { Navigate, Outlet } from 'react-router-dom';
import { useAppSelector } from '../hooks/useAppDispatch';
import { useLanguage } from '../contexts/LanguageContext';
import { getRole } from '../utils/auth';

interface Props {
  allowedRoles?: string[];
}

export default function ProtectedRoute({ allowedRoles }: Props) {
  const { user, accessToken } = useAppSelector((s) => s.auth);
  const { t } = useLanguage();
  const role = getRole(user);

  if (!accessToken || !user) {
    return (
      <Navigate
        to="/"
        replace
        state={{ from: 'auth', message: t('messages.signInToContinue') }}
      />
    );
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

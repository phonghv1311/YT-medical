import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import LanguageSwitcher from './LanguageSwitcher';
import NotificationPopover from './NotificationPopover';

export type HeaderVariant = 'customer' | 'doctor' | 'admin';

interface AppHeaderProps {
  variant: HeaderVariant;
  user: { firstName?: string; lastName?: string } | null;
  homeHref: string;
  menuRef: React.RefObject<HTMLDivElement | null>;
  menuOpen: boolean;
  setMenuOpen: (open: boolean | ((prev: boolean) => boolean)) => void;
  onLogout: () => void;
  onCloseMenu: () => void;
  /** Optional page title shown next to logo (e.g. "Employee Directory") */
  title?: string;
}

const avatarBg: Record<HeaderVariant, string> = {
  customer: 'bg-teal-500',
  doctor: 'bg-blue-600',
  admin: 'bg-violet-600',
};

export default function AppHeader({
  variant,
  user,
  homeHref,
  menuRef,
  menuOpen,
  setMenuOpen,
  onLogout,
  onCloseMenu,
  title,
}: AppHeaderProps) {
  const { t } = useLanguage();

  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-30 relative">
      <div className="max-w-lg mx-auto px-4 sm:px-4 h-14 flex items-center justify-between">
        <Link to={homeHref} className="flex items-center gap-2 text-gray-900 min-w-0" aria-label={t('common.appName')}>
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600" aria-hidden>
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
          </span>
          {title && <span className="font-bold text-gray-900 truncate hidden sm:block">{title}</span>}
        </Link>
        <div className="relative flex items-center gap-1 sm:gap-2" ref={menuRef}>
          <LanguageSwitcher iconOnly className="shrink-0" />
          <NotificationPopover />
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            className="flex items-center gap-2 p-1.5 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            aria-expanded={menuOpen}
            aria-haspopup="true"
          >
            <div className={`w-8 h-8 ${avatarBg[variant]} rounded-full flex items-center justify-center text-white text-sm font-medium shrink-0`}>
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </div>
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 w-48 rounded-lg bg-white border border-gray-200 shadow-lg py-1 z-50">
              <Link to="/profile" onClick={onCloseMenu} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                {t('common.profileSettings')}
              </Link>
              <button type="button" onClick={onLogout} className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                {t('common.logout')}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

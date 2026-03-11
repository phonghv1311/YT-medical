import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../hooks/useAppDispatch';
import { fetchProfile } from '../store/authSlice';
import { getRole } from '../utils/auth';
import type { Package } from '../types';
import CompleteProfileModal from './CompleteProfileModal';
import ChoosePlanModal from './ChoosePlanModal';
import PaymentDetailsModal from './PaymentDetailsModal';

interface Props {
  children: React.ReactNode;
}

export default function CustomerLayout({ children }: Props) {
  const { user, accessToken, profileFetched } = useAppSelector((s) => ({ ...s.auth, profileFetched: (s.auth as { profileFetched?: boolean }).profileFetched }));
  const dispatch = useAppDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  const fromRegistration = (location.state as { fromRegistration?: boolean })?.fromRegistration === true;

  const [profileLoaded, setProfileLoaded] = useState(false);
  const [showCompleteProfile, setShowCompleteProfile] = useState(false);
  const [profileCompleteDismissed, setProfileCompleteDismissed] = useState(false);
  const [step1Done, setStep1Done] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const role = getRole(user);

  useEffect(() => {
    if (!accessToken || role !== 'customer') {
      setProfileLoaded(true);
      return;
    }
    if (profileFetched) {
      const customer = (user as { customer?: { dateOfBirth?: string; gender?: string; height?: number; weight?: number } })?.customer;
      const hasBasic = customer && (customer.dateOfBirth || customer.gender || customer.height != null || customer.weight != null);
      setShowCompleteProfile(!hasBasic && !profileCompleteDismissed);
      setProfileLoaded(true);
      return;
    }
    dispatch(fetchProfile())
      .then((r) => {
        const payload = r.payload as { customer?: { dateOfBirth?: string; gender?: string; height?: number; weight?: number } };
        const customer = payload?.customer;
        const hasBasic = customer && (customer.dateOfBirth || customer.gender || customer.height != null || customer.weight != null);
        setShowCompleteProfile(!hasBasic && !profileCompleteDismissed);
      })
      .catch(() => { })
      .finally(() => setProfileLoaded(true));
  }, [accessToken, role, dispatch, profileCompleteDismissed, profileFetched, user]);

  const handleProfileComplete = () => {
    setShowCompleteProfile(false);
    setStep1Done(true);
  };
  const handleProfileSkip = () => {
    setProfileCompleteDismissed(true);
    setShowCompleteProfile(false);
    setStep1Done(true);
  };

  const clearOnboarding = () => {
    setSelectedPackage(null);
    navigate('/customer', { replace: true, state: {} });
  };

  const showChoosePlan = fromRegistration && step1Done && !selectedPackage;
  const showPaymentModal = fromRegistration && selectedPackage != null;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {children}
      {showCompleteProfile && profileLoaded && (
        <CompleteProfileModal onComplete={handleProfileComplete} onSkip={handleProfileSkip} />
      )}
      {showChoosePlan && (
        <ChoosePlanModal
          onSelectPlan={(pkg) => setSelectedPackage(pkg)}
          onClose={clearOnboarding}
        />
      )}
      {showPaymentModal && selectedPackage && (
        <PaymentDetailsModal
          pkg={selectedPackage}
          onSuccess={clearOnboarding}
          onClose={clearOnboarding}
        />
      )}
    </div>
  );
}

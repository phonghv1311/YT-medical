import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { doctorsApi, type DoctorCertificateItem, type DoctorCertificateType } from '../../api/doctors';
import { useToast } from '../../contexts/ToastContext';

const REQUIRED_TYPES: { type: DoctorCertificateType; label: string }[] = [
  { type: 'medical_degree', label: 'Medical Degree (MBBS/MD)' },
  { type: 'board_certification', label: 'Board Certification' },
  { type: 'identity_proof', label: 'Identity Proof (Passport/ID)' },
  { type: 'medical_license', label: 'Medical License' },
];

const ICONS: Record<DoctorCertificateType, React.ReactNode> = {
  medical_degree: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" /></svg>
  ),
  board_certification: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>
  ),
  identity_proof: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" /></svg>
  ),
  medical_license: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
  ),
};

function statusLabel(status: string, uploading?: number): string {
  if (uploading != null) return `UPLOADING ${uploading}%`;
  switch (status) {
    case 'verified': return 'VERIFIED';
    case 'verifying': return 'UNDER REVIEW';
    case 'rejected': return 'REJECTED';
    case 'uploaded': return 'UPLOADED';
    default: return 'NO FILE SELECTED';
  }
}

function hasFile(cert: DoctorCertificateItem | null): boolean {
  return cert != null && !!cert.fileUrl;
}

export default function UploadCertificates() {
  const navigate = useNavigate();
  const toast = useToast();
  const [certificates, setCertificates] = useState<DoctorCertificateItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingType, setUploadingType] = useState<DoctorCertificateType | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRefs = useRef<Record<DoctorCertificateType, HTMLInputElement | null>>({} as Record<DoctorCertificateType, HTMLInputElement | null>);
  const apiBase = (import.meta.env.VITE_API_URL || '').replace(/\/api\/?$/, '').replace(/\/$/, '');

  const fetchCertificates = useCallback((signal?: AbortSignal) => {
    setLoading(true);
    doctorsApi.me.getCertificates({ signal })
      .then((res) => {
        const list = res.data?.certificates ?? res.data?.data?.certificates ?? [];
        setCertificates(Array.isArray(list) ? list : []);
      })
      .catch((err) => {
        if (err.name !== 'CanceledError' && err.name !== 'AbortError') {
          setCertificates([]);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const ctrl = new AbortController();
    fetchCertificates(ctrl.signal);
    return () => ctrl.abort();
  }, [fetchCertificates]);

  const byType = (type: DoctorCertificateType) => certificates.find((c) => c.type === type) ?? null;
  const completedCount = REQUIRED_TYPES.filter(({ type }) => hasFile(byType(type))).length;
  const allHaveFile = completedCount === 4;

  const handleFileSelect = useCallback((type: DoctorCertificateType, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File too large. Maximum size is 10MB.');
      return;
    }
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
    if (!allowed.includes(file.type?.toLowerCase())) {
      toast.error('Allowed: image (JPEG, PNG, GIF, WebP) or PDF.');
      return;
    }
    setUploadingType(type);
    setUploadProgress(0);
    doctorsApi.me.uploadCertificate(file, type, (p) => setUploadProgress(p))
      .then(() => {
        toast.success('Document uploaded.');
        fetchCertificates();
      })
      .catch(() => toast.error('Upload failed. Please try again.'))
      .finally(() => { setUploadingType(null); setUploadProgress(0); });
  }, [fetchCertificates, toast]);

  const handleDelete = useCallback((id: number) => {
    doctorsApi.me.deleteCertificate(id)
      .then(() => { fetchCertificates(); toast.success('Document removed.'); })
      .catch(() => toast.error('Failed to remove document.'));
  }, [fetchCertificates, toast]);

  const handleView = (cert: DoctorCertificateItem) => {
    if (!cert.fileUrl) return;
    const url = cert.fileUrl.startsWith('http') ? cert.fileUrl : (apiBase ? `${apiBase}${cert.fileUrl.startsWith('/') ? cert.fileUrl : `/${cert.fileUrl}`}` : cert.fileUrl);
    window.open(url, '_blank');
  };

  const handleSubmit = () => {
    if (!allHaveFile) {
      toast.error('Please upload all four required documents first.');
      return;
    }
    setSubmitting(true);
    doctorsApi.me.submitCertificatesForVerification()
      .then(() => {
        toast.success('Submitted for verification.');
        fetchCertificates();
      })
      .catch(() => toast.error('Submission failed. Please try again.'))
      .finally(() => setSubmitting(false));
  };

  if (loading) {
    return (
      <div className="py-6">
        <div className="flex items-center gap-3 mb-6">
          <button type="button" onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-lg hover:bg-gray-100" aria-label="Back">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <h1 className="text-xl font-bold text-gray-900">Upload Certificates</h1>
        </div>
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-3/4" />
          <div className="h-24 bg-gray-200 rounded" />
          <div className="h-24 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="py-6">
      <div className="flex items-center gap-3 mb-6">
        <button type="button" onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-lg hover:bg-gray-100" aria-label="Back">
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <h1 className="text-xl font-bold text-gray-900">Upload Certificates</h1>
      </div>

      <section className="mb-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-2">Verification Progress</h2>
        <div className="flex items-center gap-3 mb-1">
          <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-blue-600 rounded-full transition-all" style={{ width: `${(completedCount / 4) * 100}%` }} />
          </div>
          <span className="text-sm font-medium text-gray-700 shrink-0">{completedCount} of 4</span>
        </div>
        <p className="text-sm text-gray-500">Complete all document uploads to submit for final review.</p>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Required Documents</h2>
        <div className="space-y-3">
          {REQUIRED_TYPES.map(({ type, label }) => {
            const cert = byType(type);
            const isUploading = uploadingType === type;
            const progress = isUploading ? uploadProgress : 0;
            const hasFileHere = hasFile(cert);
            const status = cert?.status ?? 'pending';
            const showVerified = status === 'verified';
            const showUploading = isUploading;
            const showNoFile = !hasFileHere && !isUploading;
            const showRequired = showNoFile;

            return (
              <div
                key={type}
                className={`rounded-xl border bg-white p-4 ${isUploading ? 'border-blue-400 border-dashed ring-1 ring-blue-200' : 'border-gray-200'}`}
              >
                <div className="flex items-start gap-3">
                  <span className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    {ICONS[type]}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900">{label}</p>
                    {showVerified && (
                      <p className="flex items-center gap-1.5 mt-1 text-sm text-green-600">
                        <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                        VERIFIED
                      </p>
                    )}
                    {showUploading && (
                      <>
                        <p className="mt-1 text-sm text-blue-600 font-medium">UPLOADING {progress}%...</p>
                        <div className="mt-2 h-1.5 bg-blue-100 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-600 rounded-full transition-all" style={{ width: `${progress}%` }} />
                        </div>
                      </>
                    )}
                    {showNoFile && (
                      <p className="mt-1 text-sm text-gray-500">{showRequired ? 'REQUIRED' : 'NO FILE SELECTED'}</p>
                    )}
                    {hasFileHere && !showVerified && !isUploading && status !== 'verified' && (
                      <p className="mt-1 text-sm text-gray-600">{statusLabel(status)}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {showVerified && (
                      <>
                        <button type="button" onClick={() => cert && handleView(cert)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-600" aria-label="View">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                        </button>
                        <button type="button" onClick={() => cert && handleDelete(cert.id)} className="p-2 rounded-lg hover:bg-red-50 text-red-600" aria-label="Delete">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </>
                    )}
                    {isUploading && (
                      <button type="button" disabled className="p-2 rounded-lg text-gray-400 cursor-not-allowed" aria-label="Uploading">
                        <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                      </button>
                    )}
                    {hasFileHere && !showVerified && !isUploading && (
                      <button type="button" onClick={() => cert && handleView(cert)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-600" aria-label="View">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                      </button>
                    )}
                    {hasFileHere && !showVerified && !isUploading && (
                      <button type="button" onClick={() => fileInputRefs.current[type]?.click()} className="p-2 rounded-lg hover:bg-blue-50 text-blue-600" aria-label="Re-upload">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                      </button>
                    )}
                    {showNoFile && !isUploading && (
                      <button type="button" onClick={() => fileInputRefs.current[type]?.click()} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6m-0 11a4 4 0 01-4 4" /></svg>
                        Upload
                      </button>
                    )}
                    <input
                      ref={(el) => { fileInputRefs.current[type] = el; }}
                      type="file"
                      accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,image/jpeg,image/png,image/gif,image/webp,application/pdf"
                      className="hidden"
                      onChange={(e) => handleFileSelect(type, e)}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <div className="mt-8 pb-4">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!allHaveFile || submitting}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {submitting ? (
            <>
              <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
              Submitting…
            </>
          ) : (
            <>
              Submit for Verification
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

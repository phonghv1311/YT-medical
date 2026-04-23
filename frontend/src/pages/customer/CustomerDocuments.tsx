import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { useToast } from '../../contexts/ToastContext';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPT = 'image/*,.pdf,.doc,.docx';

type UploadedFile = { file: File; id: string; name: string; size: number };

export default function CustomerDocuments() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const toast = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [uploading, setUploading] = useState(false);

  const handleSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files;
    if (!selected?.length) return;
    const next: UploadedFile[] = [];
    for (let i = 0; i < selected.length; i++) {
      const file = selected[i];
      if (file.size > MAX_FILE_SIZE) {
        toast.error(t('documents.fileTooLarge') || `File "${file.name}" exceeds 10MB.`);
        continue;
      }
      next.push({
        file,
        id: `${file.name}-${file.size}-${Date.now()}-${i}`,
        name: file.name,
        size: file.size,
      });
    }
    setFiles((prev) => [...prev, ...next]);
    e.target.value = '';
  };

  const remove = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleUpload = async () => {
    if (files.length === 0) return;
    setUploading(true);
    try {
      // Placeholder: in production, call API to upload each file
      await new Promise((r) => setTimeout(r, 800));
      toast.success(t('documents.uploadSuccess') || 'Files added. Backend upload can be wired here.');
    } catch {
      toast.error(t('documents.uploadFailed') || 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <header className="sticky top-0 z-10 bg-white border-b border-gray-100 h-14 flex items-center justify-between px-4">
        <button type="button" onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-lg hover:bg-gray-100" aria-label={t('common.back')}>
          <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <h1 className="text-lg font-bold text-gray-900">{t('settings.uploadDocuments')}</h1>
        <div className="w-10" />
      </header>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        <p className="text-sm text-gray-500">{t('settings.uploadDocumentsDescription')}</p>

        <div
          role="button"
          tabIndex={0}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
          className="border-2 border-dashed border-gray-200 rounded-2xl p-8 flex flex-col items-center justify-center gap-2 bg-white hover:border-blue-300 hover:bg-blue-50/50 transition cursor-pointer"
        >
          <span className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
          </span>
          <span className="font-medium text-gray-900">{t('documents.selectFiles') || 'Select files'}</span>
          <span className="text-xs text-gray-500">{t('documents.maxSize') || 'PDF, DOC, images. Max 10MB per file.'}</span>
          <input ref={inputRef} type="file" accept={ACCEPT} multiple className="hidden" onChange={handleSelect} />
        </div>

        {files.length > 0 && (
          <div className="space-y-2">
            <h2 className="text-sm font-semibold text-gray-700">{t('documents.selectedFiles') || 'Selected files'} ({files.length})</h2>
            <ul className="space-y-2">
              {files.map((item) => (
                <li key={item.id} className="flex items-center gap-3 p-3 rounded-xl bg-white border border-gray-200">
                  <span className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600 shrink-0">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900 truncate">{item.name}</p>
                    <p className="text-xs text-gray-500">{formatSize(item.size)}</p>
                  </div>
                  <button type="button" onClick={() => remove(item.id)} className="p-2 rounded-lg text-red-500 hover:bg-red-50" aria-label={t('common.delete')}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </li>
              ))}
            </ul>
            <button type="button" onClick={handleUpload} disabled={uploading} className="w-full py-3 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50">
              {uploading ? t('common.loading') : (t('documents.upload') || 'Upload')}
            </button>
          </div>
        )}

        {files.length === 0 && (
          <p className="text-center text-sm text-gray-400">{t('documents.noFilesYet') || 'No files selected. Tap the area above to add documents.'}</p>
        )}
      </div>
    </div>
  );
}

import { useEffect, useMemo, useRef, useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useConfirm } from '../../contexts/ConfirmContext';
import { useToast } from '../../contexts/ToastContext';
import { newsApi } from '../../api/news';
import type { ArticleCategory } from '../../data/healthNews';

type ArticleStatus = 'DRAFT' | 'PUBLISHED' | 'SCHEDULED';
type StatusFilter = 'ALL' | ArticleStatus;

type AdminNewsItem = {
  id: number;
  title: string;
  category?: ArticleCategory | string | null;
  content: string[];
  status: ArticleStatus;
  coverImageUrl?: string | null;
  scheduledAt?: string | null;
  publishedAt?: string | null;
  createdAt?: string | null;
};

const CATEGORIES: { key: ArticleCategory; label: string }[] = [
  { key: 'NUTRITION', label: 'Nutrition' },
  { key: 'MENTAL HEALTH', label: 'Mental Health' },
  { key: 'PREVENTION', label: 'Prevention' },
  { key: 'LIFESTYLE', label: 'Lifestyle' },
  { key: 'HEALTH TIPS', label: 'Health Tips' },
];

function formatDate(iso?: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function toDatetimeLocalValue(iso?: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  // Store as UTC slice; acceptable for admin scheduling UI.
  return d.toISOString().slice(0, 16);
}

function getCoverPreviewUrl(formCoverPreviewUrl: string | null, formCoverImageUrl: string | null): string | null {
  return formCoverPreviewUrl || formCoverImageUrl || null;
}

export default function AdminNewsV2() {
  const { t } = useLanguage();
  const toast = useToast();
  const { confirm } = useConfirm();

  const [articles, setArticles] = useState<AdminNewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');

  const [modal, setModal] = useState<
    | null
    | {
        mode: 'add' | 'edit';
        item?: AdminNewsItem;
      }
  >(null);

  const [previewMode, setPreviewMode] = useState(false);

  const [previewItem, setPreviewItem] = useState<AdminNewsItem | null>(null);

  const [form, setForm] = useState<{
    title: string;
    category: ArticleCategory;
    content: string[];
    status: ArticleStatus;
    scheduledAtLocal: string; // for input[type=datetime-local]
    coverImageUrl: string | null; // existing url (edit)
    coverFile: File | null;
    coverPreviewUrl: string | null; // object url
  }>({
    title: '',
    category: 'NUTRITION',
    content: [''],
    status: 'PUBLISHED',
    scheduledAtLocal: '',
    coverImageUrl: null,
    coverFile: null,
    coverPreviewUrl: null,
  });

  const objectUrlRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    };
  }, []);

  async function refresh() {
    setLoading(true);
    const ctrl = new AbortController();
    try {
      const res = await newsApi.getList({ signal: ctrl.signal });
      const raw = (res.data as any)?.data ?? res.data ?? [];
      const list = Array.isArray(raw) ? raw : [];
      setArticles(
        list.map((item: any): AdminNewsItem => ({
          id: Number(item.id),
          title: String(item.title ?? ''),
          category: (item.category ?? 'NUTRITION') as ArticleCategory,
          content: Array.isArray(item.content) ? item.content.map((x: unknown) => String(x)) : [],
          status: (item.status ?? 'PUBLISHED') as ArticleStatus,
          coverImageUrl: item.coverImageUrl ?? item.coverImage ?? item.cover ?? null,
          scheduledAt: item.scheduledAt ?? null,
          publishedAt: item.publishedAt ?? null,
          createdAt: item.createdAt ?? null,
        })),
      );
    } catch (e) {
      setArticles([]);
    } finally {
      setLoading(false);
    }
    return () => ctrl.abort();
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return articles.filter((a) => {
      const matchesStatus = statusFilter === 'ALL' ? true : a.status === statusFilter;
      const matchesSearch = !q
        ? true
        : a.title.toLowerCase().includes(q) || String(a.category ?? '').toLowerCase().includes(q);
      return matchesStatus && matchesSearch;
    });
  }, [articles, search, statusFilter]);

  function resetFormForAdd() {
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    objectUrlRef.current = null;

    setForm({
      title: '',
      category: 'NUTRITION',
      content: [''],
      status: 'PUBLISHED',
      scheduledAtLocal: '',
      coverImageUrl: null,
      coverFile: null,
      coverPreviewUrl: null,
    });
    setPreviewMode(false);
  }

  function openAdd() {
    resetFormForAdd();
    setModal({ mode: 'add' });
  }

  function openEdit(item: AdminNewsItem) {
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    objectUrlRef.current = null;

    setForm({
      title: item.title,
      category: (item.category as ArticleCategory) ?? 'NUTRITION',
      content: (item.content ?? []).length ? item.content : [''],
      status: item.status ?? 'PUBLISHED',
      scheduledAtLocal: toDatetimeLocalValue(item.scheduledAt ?? null),
      coverImageUrl: item.coverImageUrl ?? null,
      coverFile: null,
      coverPreviewUrl: null,
    });
    setPreviewMode(false);
    setModal({ mode: 'edit', item });
  }

  function onPickCover(file: File | null) {
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    objectUrlRef.current = null;

    if (!file) {
      setForm((f) => ({ ...f, coverFile: null, coverPreviewUrl: null }));
      return;
    }

    const objUrl = URL.createObjectURL(file);
    objectUrlRef.current = objUrl;
    setForm((f) => ({ ...f, coverFile: file, coverPreviewUrl: objUrl }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const title = form.title.trim();
    if (!title) {
      toast.error('Title is required');
      return;
    }

    const content = form.content.map((p) => p.trim()).filter(Boolean);

    let scheduledAtIso: string | undefined;
    if (form.status === 'SCHEDULED') {
      if (!form.scheduledAtLocal) {
        toast.error('Scheduled time is required');
        return;
      }
      scheduledAtIso = new Date(form.scheduledAtLocal).toISOString();
    }

    try {
      if (!modal) return;
      if (modal.mode === 'add') {
        await newsApi.create({
          title,
          category: form.category,
          status: form.status,
          scheduledAt: scheduledAtIso,
          content,
          coverImage: form.coverFile,
        });
      } else if (modal.mode === 'edit' && modal.item) {
        await newsApi.update(modal.item.id, {
          title,
          category: form.category,
          status: form.status,
          scheduledAt: scheduledAtIso,
          content,
          coverImage: form.coverFile,
        });
      }
      setModal(null);
      setPreviewMode(false);
      await refresh();
      toast.success('Saved');
    } catch {
      toast.error('Failed to save');
    }
  }

  async function handleDelete(item: AdminNewsItem) {
    const ok = await confirm({
      title: t('newsManagement.deleteArticle'),
      message: t('newsManagement.deleteConfirm'),
      confirmLabel: t('common.delete'),
      cancelLabel: t('common.cancel'),
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await newsApi.deleteById(item.id);
      setPreviewItem(null);
      await refresh();
      toast.success('Deleted');
    } catch {
      toast.error('Failed to delete');
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pb-24">
        <div className="max-w-lg mx-auto px-4 py-12 text-center text-gray-500">{t('common.loading')}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <header className="sticky top-0 z-10 bg-white border-b border-gray-200">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center gap-2">
          <button type="button" onClick={() => window.history.back()} className="p-2 -ml-2 rounded-lg hover:bg-gray-100" aria-label={t('common.back')}>
            <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-xl font-bold text-gray-900 flex-1">{t('newsManagement.title')}</h1>
          <button type="button" className="p-2 rounded-lg hover:bg-gray-100" aria-label="More">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </button>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input
            type="search"
            placeholder={t('newsManagement.searchNews')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {(['ALL', 'PUBLISHED', 'DRAFT', 'SCHEDULED'] as StatusFilter[]).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatusFilter(s)}
              className={`shrink-0 px-4 py-2 text-sm font-medium transition ${
                statusFilter === s ? 'text-blue-600 border-b-2 border-blue-600 font-bold' : 'text-gray-500'
              }`}
            >
              {s === 'ALL' ? t('newsManagement.allPublished') : s === 'PUBLISHED' ? t('newsManagement.published') : s === 'DRAFT' ? t('newsManagement.draft') : t('newsManagement.scheduled')}
              {s === 'ALL' ? ` (${articles.length})` : ''}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <p className="text-gray-500 py-12 text-center">{t('newsManagement.noArticles')}</p>
        ) : (
          <div className="space-y-4">
            {filtered.map((article) => {
              const badgeClass =
                article.status === 'PUBLISHED'
                  ? 'bg-green-600'
                  : article.status === 'DRAFT'
                    ? 'bg-gray-500'
                    : 'bg-blue-600';
              const dateLabel = formatDate(article.publishedAt ?? article.createdAt);
              return (
                <div key={article.id} className="rounded-xl bg-white border border-gray-200 overflow-hidden shadow-sm">
                  <div className="relative">
                    {article.coverImageUrl ? (
                      <img src={article.coverImageUrl} alt="" className="h-40 w-full object-cover" />
                    ) : (
                      <div className="h-40 bg-gray-100" />
                    )}
                    <span className={`absolute top-2 right-2 px-2 py-0.5 rounded text-xs font-semibold text-white ${badgeClass}`}>
                      {article.status === 'PUBLISHED'
                        ? t('newsManagement.published')
                        : article.status === 'DRAFT'
                          ? t('newsManagement.draft')
                          : t('newsManagement.scheduled')}
                    </span>
                  </div>
                  <div className="p-4">
                    <h2 className="font-bold text-gray-900 line-clamp-2">{article.title}</h2>
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">{(article.content ?? [])[0] ?? ''}</p>
                    <p className="text-xs text-gray-400 mt-2">
                      {t('newsManagement.postedDate')} {dateLabel || '—'}
                    </p>
                    <div className="flex justify-end gap-2 mt-3">
                      <button type="button" onClick={() => setPreviewItem(article)} className="p-2 rounded-lg text-gray-500 hover:bg-gray-100" aria-label={t('newsManagement.preview')}>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                      <button type="button" onClick={() => openEdit(article)} className="p-2 rounded-lg text-gray-500 hover:bg-gray-100" aria-label={t('common.edit')}>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                      <button type="button" onClick={() => handleDelete(article)} className="p-2 rounded-lg text-red-500 hover:bg-red-50" aria-label={t('common.delete')}>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <button
          type="button"
          onClick={openAdd}
          className="fixed bottom-20 right-4 w-14 h-14 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg hover:bg-blue-700 z-30"
          aria-label={t('newsManagement.addArticle')}
        >
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm" onClick={() => setModal(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center justify-between gap-2 mb-4">
                <button type="button" onClick={() => setModal(null)} className="p-2 -ml-2 rounded-lg hover:bg-gray-100" aria-label={t('common.back')}>
                  <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <h3 className="text-lg font-semibold text-gray-900 flex-1">
                  {modal.mode === 'add' ? t('newsManagement.writeNew') : t('newsManagement.editArticle')}
                </h3>
                <button
                  type="button"
                  onClick={() => setPreviewMode((v) => !v)}
                  className="px-3 py-1.5 rounded-lg border border-blue-600 text-blue-600 text-sm font-medium"
                >
                  {t('newsManagement.preview')}
                </button>
              </div>

              {!previewMode ? (
                <form onSubmit={handleSave} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('newsManagement.titleLabel')}</label>
                    <input
                      value={form.title}
                      onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                      placeholder={t('newsManagement.newsTitlePlaceholder')}
                      className="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 text-sm"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('newsManagement.coverImage')}</label>
                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 flex flex-col items-center justify-center gap-2 bg-gray-50">
                      {getCoverPreviewUrl(form.coverPreviewUrl, form.coverImageUrl) ? (
                        <img
                          src={getCoverPreviewUrl(form.coverPreviewUrl, form.coverImageUrl) as string}
                          alt=""
                          className="h-28 w-full object-cover rounded-lg"
                        />
                      ) : null}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => onPickCover(e.target.files?.[0] ?? null)}
                        className="w-full text-sm"
                      />
                      <p className="text-xs text-gray-500">{t('newsManagement.ratio16_9')}</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('newsManagement.category')}</label>
                    <select
                      value={form.category}
                      onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as ArticleCategory }))}
                      className="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 text-sm"
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c.key} value={c.key}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('newsManagement.content')}</label>
                    <textarea
                      value={form.content.join('\n\n')}
                      onChange={(e) => setForm((f) => ({ ...f, content: e.target.value.split(/\n\n+/).filter(Boolean) }))}
                      rows={7}
                      placeholder={t('newsManagement.startWritingContent')}
                      className="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 text-sm resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('newsManagement.articleStatus')}</label>
                    <select
                      value={form.status}
                      onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as ArticleStatus }))}
                      className="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 text-sm"
                    >
                      <option value="PUBLISHED">{t('newsManagement.published')}</option>
                      <option value="DRAFT">{t('newsManagement.draft')}</option>
                      <option value="SCHEDULED">{t('newsManagement.scheduled')}</option>
                    </select>
                    {form.status === 'SCHEDULED' && (
                      <div className="mt-3">
                        <input
                          type="datetime-local"
                          value={form.scheduledAtLocal}
                          onChange={(e) => setForm((f) => ({ ...f, scheduledAtLocal: e.target.value }))}
                          className="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 text-sm"
                        />
                      </div>
                    )}
                  </div>

                  <button type="submit" className="w-full py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700">
                    {t('newsManagement.saveArticle')}
                  </button>

                  {modal.mode === 'edit' && modal.item && (
                    <button
                      type="button"
                      onClick={() => {
                        handleDelete(modal.item as AdminNewsItem);
                        setModal(null);
                      }}
                      className="w-full py-3 rounded-xl border-2 border-red-200 text-red-600 font-medium hover:bg-red-50 flex items-center justify-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      {t('newsManagement.deleteNews')}
                    </button>
                  )}
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="rounded-xl border border-gray-200 overflow-hidden">
                    {getCoverPreviewUrl(form.coverPreviewUrl, form.coverImageUrl) ? (
                      <img src={getCoverPreviewUrl(form.coverPreviewUrl, form.coverImageUrl) as string} alt="" className="h-44 w-full object-cover" />
                    ) : (
                      <div className="h-44 bg-gray-100" />
                    )}
                    <div className="p-4">
                      <h2 className="font-bold text-gray-900 text-lg">{form.title || '—'}</h2>
                      <p className="text-sm text-gray-500 mt-1">{String(form.category)}</p>
                      <p className="text-xs text-gray-400 mt-2">
                        {form.status === 'PUBLISHED'
                          ? t('newsManagement.published')
                          : form.status === 'DRAFT'
                            ? t('newsManagement.draft')
                            : t('newsManagement.scheduled')}
                        {form.status === 'SCHEDULED' && form.scheduledAtLocal ? ` • ${form.scheduledAtLocal}` : ''}
                      </p>
                    </div>
                  </div>

                  <div className="prose max-w-none">
                    {(form.content ?? []).filter(Boolean).map((p, idx) => (
                      <p key={idx} className="text-gray-700 whitespace-pre-wrap">
                        {p}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {previewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm" onClick={() => setPreviewItem(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center justify-between gap-2 mb-4">
                <button type="button" onClick={() => setPreviewItem(null)} className="p-2 -ml-2 rounded-lg hover:bg-gray-100" aria-label={t('common.back')}>
                  <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <h3 className="text-lg font-semibold text-gray-900 flex-1">{t('newsManagement.preview')}</h3>
                <button type="button" onClick={() => handleDelete(previewItem)} className="px-3 py-1.5 rounded-lg border border-red-200 text-red-600 text-sm font-medium">
                  {t('common.delete')}
                </button>
              </div>

              <div className="space-y-4">
                <div className="rounded-xl border border-gray-200 overflow-hidden">
                  {previewItem.coverImageUrl ? (
                    <img src={previewItem.coverImageUrl} alt="" className="h-44 w-full object-cover" />
                  ) : (
                    <div className="h-44 bg-gray-100" />
                  )}
                  <div className="p-4">
                    <h2 className="font-bold text-gray-900 text-lg">{previewItem.title}</h2>
                    <p className="text-sm text-gray-500 mt-1">{String(previewItem.category ?? '')}</p>
                    <p className="text-xs text-gray-400 mt-2">
                      {previewItem.status === 'PUBLISHED'
                        ? t('newsManagement.published')
                        : previewItem.status === 'DRAFT'
                          ? t('newsManagement.draft')
                          : t('newsManagement.scheduled')}
                      {previewItem.status === 'SCHEDULED' && previewItem.scheduledAt ? ` • ${formatDate(previewItem.scheduledAt)}` : ''}
                    </p>
                  </div>
                </div>

                <div className="prose max-w-none">
                  {(previewItem.content ?? []).filter(Boolean).map((p, idx) => (
                    <p key={idx} className="text-gray-700 whitespace-pre-wrap">
                      {p}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


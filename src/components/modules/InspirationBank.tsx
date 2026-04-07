/**
 * Inspiration Bank — main module UI.
 *
 * Lets the user upload reference videos and briefs (briefs include scripts),
 * runs the analyzer agent on them, and shows the bank with tag-driven filters.
 */

import { useEffect, useMemo, useState, useRef } from 'react';
import type {
  InspirationItem,
  InspirationKind,
  InspirationTags,
  InspirationStats,
} from '../../engine/inspirationTypes';
import { getEffectiveTags } from '../../engine/inspirationTypes';
import {
  getAllItems,
  putItem,
  updateItem,
  deleteItem,
  getStats,
  generateId,
  clearAll,
  getBlob,
} from '../../inspiration/inspirationStore';
import { extractVideoFrames } from '../../inspiration/frameExtractor';
import { extractTextFromFile } from '../../inspiration/textExtractor';
import {
  analyzeVideoItem,
  analyzeTextItem,
  markFailed,
} from '../../inspiration/inspirationAnalyzer';
import type { AdType, AngleType, ProductCategory } from '../../engine/types';

interface Props {
  apiKey: string;
  onBack: () => void;
}

const KIND_LABEL: Record<InspirationKind, string> = {
  video: 'Video Ad',
  brief: 'Brief',
};

const AD_TYPES: (AdType | 'all')[] = [
  'all',
  'AGC (Actor Generated Content)',
  'UGC (User Generated Content)',
  'Ecom Style',
  'Static',
  'Founder Style',
  'Fake Podcast Ads',
  'Spokesperson',
  'Packaging/Employee',
  'Full AI (Documentary, story, education, etc)',
];

const ANGLE_TYPES: (AngleType | 'all')[] = [
  'all',
  'Problem-Based',
  'Emotion-Based',
  'Solution-Based',
  'Identity-Based',
  'Comparison-Based',
  'Testimonial-Based',
  'Seasonal/Situational',
  'Fear-Based',
  'Aspiration-Based',
  'Education-Based',
  '3 Reasons/Signs Why',
  'Negative Marketing',
];

const PRODUCT_CATEGORIES: (ProductCategory | 'all')[] = [
  'all',
  'EasyStretch',
  'Compression',
  'Ankle Compression',
  'Other',
];

export default function InspirationBank({ apiKey, onBack }: Props) {
  const [items, setItems] = useState<InspirationItem[]>([]);
  const [stats, setStats] = useState<InspirationStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<InspirationItem | null>(null);
  const [showUpload, setShowUpload] = useState(false);

  // Filters
  const [filterKind, setFilterKind] = useState<InspirationKind | 'all'>('all');
  const [filterAdType, setFilterAdType] = useState<string>('all');
  const [filterAngle, setFilterAngle] = useState<string>('all');
  const [filterProduct, setFilterProduct] = useState<string>('all');
  const [filterStarred, setFilterStarred] = useState(false);
  const [searchText, setSearchText] = useState('');

  const reload = async () => {
    setLoading(true);
    try {
      const [allItems, statsResult] = await Promise.all([getAllItems(), getStats()]);
      setItems(allItems);
      setStats(statsResult);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reload();
  }, []);

  const filtered = useMemo(() => {
    const search = searchText.trim().toLowerCase();
    return items.filter((item) => {
      if (filterKind !== 'all' && item.kind !== filterKind) return false;
      if (filterStarred && !item.starred) return false;
      const tags = getEffectiveTags(item);
      if (filterAdType !== 'all' && tags.adType !== filterAdType) return false;
      if (filterAngle !== 'all' && tags.angleType !== filterAngle) return false;
      if (filterProduct !== 'all' && tags.productCategory !== filterProduct) return false;
      if (search) {
        const hay = [
          item.title,
          item.filename,
          item.summary,
          item.styleNotes,
          ...item.learnings,
          ...tags.customTags,
        ]
          .join(' ')
          .toLowerCase();
        if (!hay.includes(search)) return false;
      }
      return true;
    });
  }, [items, filterKind, filterAdType, filterAngle, filterProduct, filterStarred, searchText]);

  const handleUpload = async (
    file: File,
    kind: InspirationKind,
    title: string,
    attachedScript: string,
  ) => {
    setError(null);
    setUploadStatus(`Preparing ${file.name}…`);

    const id = generateId();
    const baseItem: InspirationItem = {
      id,
      kind,
      title: title || file.name,
      filename: file.name,
      uploadedAt: new Date().toISOString(),
      fileSize: file.size,
      mimeType: file.type,
      tags: {
        duration: 'unknown',
        adType: 'unknown',
        angleType: 'unknown',
        isFullAi: false,
        customTags: [],
      },
      summary: '',
      learnings: [],
      styleNotes: '',
      starred: false,
      userNotes: '',
      status: 'analyzing',
    };

    try {
      if (kind === 'video') {
        setUploadStatus(`Extracting frames from ${file.name}…`);
        const extracted = await extractVideoFrames(file);
        const itemWithMeta: InspirationItem = {
          ...baseItem,
          durationSeconds: extracted.durationSeconds,
          thumbnailDataUrl: extracted.thumbnailDataUrl,
          frameCount: extracted.frames.length,
          attachedScriptText: attachedScript.trim() || undefined,
        };
        await putItem(itemWithMeta, file, extracted.frames);
        await reload();
        setShowUpload(false);

        setUploadStatus(`Analyzing ${file.name} with Claude…`);
        try {
          await analyzeVideoItem(
            {
              item: itemWithMeta,
              frames: extracted.frames,
              attachedScriptText: itemWithMeta.attachedScriptText,
            },
            apiKey,
          );
        } catch (analyzeErr) {
          await markFailed(itemWithMeta, analyzeErr);
        }
      } else {
        setUploadStatus(`Extracting text from ${file.name}…`);
        const text = await extractTextFromFile(file);
        const itemWithMeta: InspirationItem = {
          ...baseItem,
          textContent: text,
        };
        await putItem(itemWithMeta, file);
        await reload();
        setShowUpload(false);

        setUploadStatus(`Analyzing ${file.name} with Claude…`);
        try {
          await analyzeTextItem({ item: itemWithMeta, textContent: text }, apiKey);
        } catch (analyzeErr) {
          await markFailed(itemWithMeta, analyzeErr);
        }
      }

      await reload();
      setUploadStatus('');
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setUploadStatus('');
    }
  };

  const handleStar = async (item: InspirationItem) => {
    const updated = { ...item, starred: !item.starred };
    await updateItem(updated);
    await reload();
    if (selectedItem?.id === item.id) setSelectedItem(updated);
  };

  const handleDelete = async (item: InspirationItem) => {
    if (!confirm(`Delete "${item.title}"? This cannot be undone.`)) return;
    await deleteItem(item.id);
    await reload();
    if (selectedItem?.id === item.id) setSelectedItem(null);
  };

  const handleClearAll = async () => {
    if (
      !confirm(
        'Permanently delete the ENTIRE inspiration bank? This cannot be undone.',
      )
    )
      return;
    await clearAll();
    await reload();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-6xl mx-auto">
        <button
          onClick={onBack}
          className="text-sm text-slate-500 hover:text-slate-700 mb-6 flex items-center gap-1"
        >
          {'\u2190'} Back to Dashboard
        </button>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 mb-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-800 mb-1">Inspiration Bank</h2>
              <p className="text-slate-500 text-sm">
                Reference ads and briefs the system learns from. Tagged automatically by an
                expert agent — used by every generator below.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowUpload(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
              >
                + Add Inspiration
              </button>
            </div>
          </div>

          {/* Stats row */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <StatTile label="Total" value={String(stats.total)} />
              <StatTile label="Videos" value={String(stats.byKind.video)} />
              <StatTile label="Briefs" value={String(stats.byKind.brief)} />
              <StatTile label="Starred" value={String(stats.starredCount)} />
            </div>
          )}

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-6 gap-3 mb-4">
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Search title, summary, learnings…"
              className="md:col-span-2 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={filterKind}
              onChange={(e) => setFilterKind(e.target.value as InspirationKind | 'all')}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All kinds</option>
              <option value="video">Videos</option>
              <option value="brief">Briefs</option>
            </select>
            <select
              value={filterAdType}
              onChange={(e) => setFilterAdType(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {AD_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t === 'all' ? 'All ad types' : t}
                </option>
              ))}
            </select>
            <select
              value={filterAngle}
              onChange={(e) => setFilterAngle(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {ANGLE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t === 'all' ? 'All angles' : t}
                </option>
              ))}
            </select>
            <select
              value={filterProduct}
              onChange={(e) => setFilterProduct(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {PRODUCT_CATEGORIES.map((t) => (
                <option key={t} value={t}>
                  {t === 'all' ? 'All products' : t}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 text-slate-600 cursor-pointer">
              <input
                type="checkbox"
                checked={filterStarred}
                onChange={(e) => setFilterStarred(e.target.checked)}
              />
              Starred only
            </label>
            <div className="flex items-center gap-3 text-slate-500">
              <span>{filtered.length} of {items.length} items</span>
              {items.length > 0 && (
                <button
                  onClick={handleClearAll}
                  className="text-xs text-red-500 hover:text-red-700"
                >
                  Clear bank
                </button>
              )}
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        {uploadStatus && (
          <div className="mb-4 px-4 py-3 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg text-sm">
            {uploadStatus}
          </div>
        )}

        {loading && items.length === 0 ? (
          <div className="text-center text-slate-400 py-12">Loading bank…</div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400">
            {items.length === 0
              ? 'Your inspiration bank is empty. Upload a winning ad or brief to get started.'
              : 'No items match your filters.'}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((item) => (
              <InspirationCard
                key={item.id}
                item={item}
                onClick={() => setSelectedItem(item)}
                onStar={() => handleStar(item)}
              />
            ))}
          </div>
        )}
      </div>

      {showUpload && (
        <UploadDialog onClose={() => setShowUpload(false)} onSubmit={handleUpload} />
      )}

      {selectedItem && (
        <DetailModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onStar={() => handleStar(selectedItem)}
          onDelete={() => handleDelete(selectedItem)}
          onTagsChange={async (newOverrides) => {
            const updated = { ...selectedItem, userTagOverrides: newOverrides };
            await updateItem(updated);
            await reload();
            setSelectedItem(updated);
          }}
          onNotesChange={async (notes) => {
            const updated = { ...selectedItem, userNotes: notes };
            await updateItem(updated);
            await reload();
            setSelectedItem(updated);
          }}
        />
      )}
    </div>
  );
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-slate-50 rounded-lg px-4 py-3">
      <div className="text-2xl font-bold text-slate-800">{value}</div>
      <div className="text-xs text-slate-500 uppercase tracking-wider">{label}</div>
    </div>
  );
}

function InspirationCard({
  item,
  onClick,
  onStar,
}: {
  item: InspirationItem;
  onClick: () => void;
  onStar: () => void;
}) {
  const tags = getEffectiveTags(item);
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer overflow-hidden flex flex-col"
    >
      {item.thumbnailDataUrl ? (
        <div className="aspect-video bg-slate-100 overflow-hidden">
          <img src={item.thumbnailDataUrl} alt={item.title} className="w-full h-full object-cover" />
        </div>
      ) : (
        <div className="aspect-video bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-slate-400 text-4xl">
          {item.kind === 'brief' ? '\uD83D\uDCC4' : '\uD83C\uDFAC'}
        </div>
      )}
      <div className="p-4 flex-1 flex flex-col">
        <div className="flex items-start justify-between mb-1 gap-2">
          <h3 className="font-semibold text-slate-800 text-sm leading-tight line-clamp-2 flex-1">
            {item.title}
          </h3>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onStar();
            }}
            className={`text-lg leading-none ${item.starred ? 'text-yellow-400' : 'text-slate-300 hover:text-yellow-400'}`}
            title={item.starred ? 'Unstar' : 'Star'}
          >
            {item.starred ? '\u2605' : '\u2606'}
          </button>
        </div>
        <div className="text-xs text-slate-500 mb-2">
          {KIND_LABEL[item.kind]} · {new Date(item.uploadedAt).toLocaleDateString()}
        </div>
        {item.status === 'analyzing' && (
          <div className="text-xs text-blue-600 italic mb-2">Analyzing…</div>
        )}
        {item.status === 'failed' && (
          <div className="text-xs text-red-600 mb-2" title={item.analysisError}>
            Analysis failed
          </div>
        )}
        {item.status === 'ready' && item.summary && (
          <p className="text-xs text-slate-600 line-clamp-3 mb-2">{item.summary}</p>
        )}
        {item.status === 'ready' && (
          <div className="flex flex-wrap gap-1 mt-auto">
            {tags.adType !== 'unknown' && <TagPill text={tags.adType} />}
            {tags.angleType !== 'unknown' && <TagPill text={tags.angleType} />}
            {tags.duration !== 'unknown' && <TagPill text={tags.duration} />}
            {tags.isFullAi && <TagPill text="Full AI" />}
          </div>
        )}
      </div>
    </div>
  );
}

function TagPill({ text }: { text: string }) {
  return (
    <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] rounded-full">
      {text}
    </span>
  );
}

function UploadDialog({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (file: File, kind: InspirationKind, title: string, script: string) => void;
}) {
  const [kind, setKind] = useState<InspirationKind>('video');
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [attachedScript, setAttachedScript] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const accept = kind === 'video' ? 'video/*' : '.docx,.pdf,.txt,.md';

  const handleSubmit = () => {
    if (!file) return;
    onSubmit(file, kind, title, attachedScript);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-6">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6">
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-lg font-bold text-slate-800">Add Inspiration</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            {'\u2715'}
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Kind</label>
            <div className="grid grid-cols-2 gap-2">
              {(['video', 'brief'] as InspirationKind[]).map((k) => (
                <button
                  key={k}
                  onClick={() => {
                    setKind(k);
                    setFile(null);
                  }}
                  className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                    kind === k
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-blue-300'
                  }`}
                >
                  {KIND_LABEL[k]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Title <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Nurse pain hook — Q1 winner"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">File</label>
            <input
              ref={inputRef}
              type="file"
              accept={accept}
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="w-full text-sm"
            />
            {file && (
              <div className="mt-1 text-xs text-slate-500">
                {file.name} · {(file.size / (1024 * 1024)).toFixed(1)} MB
              </div>
            )}
          </div>

          {kind === 'video' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Script / Voiceover{' '}
                <span className="text-slate-400 font-normal">
                  (optional — improves analysis)
                </span>
              </label>
              <textarea
                value={attachedScript}
                onChange={(e) => setAttachedScript(e.target.value)}
                rows={5}
                placeholder="Paste the voiceover or script here if you have it…"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
        </div>

        <div className="flex gap-2 justify-end mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!file}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed"
          >
            Upload & Analyze
          </button>
        </div>
      </div>
    </div>
  );
}

function DetailModal({
  item,
  onClose,
  onStar,
  onDelete,
  onTagsChange,
  onNotesChange,
}: {
  item: InspirationItem;
  onClose: () => void;
  onStar: () => void;
  onDelete: () => void;
  onTagsChange: (overrides: Partial<InspirationTags>) => void;
  onNotesChange: (notes: string) => void;
}) {
  const tags = getEffectiveTags(item);
  const [overrides, setOverrides] = useState<Partial<InspirationTags>>(item.userTagOverrides ?? {});
  const [notes, setNotes] = useState(item.userNotes);
  const [customTagInput, setCustomTagInput] = useState('');
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoError, setVideoError] = useState<string | null>(null);

  // Load the raw video blob from IndexedDB and turn it into an object URL
  // for the <video> element. Cleanup revokes the URL and resets state to free
  // memory and clear any prior error before the next item loads.
  // Non-video items don't need to load anything; videoUrl stays null and the
  // <video> branch never renders for them.
  useEffect(() => {
    if (item.kind !== 'video') return;
    let revoked = false;
    let url: string | null = null;
    getBlob(item.id)
      .then((blob) => {
        if (revoked) return;
        if (!blob) {
          setVideoError('Video file not found in storage.');
          return;
        }
        url = URL.createObjectURL(blob);
        setVideoUrl(url);
      })
      .catch((e) => {
        if (revoked) return;
        setVideoError(e instanceof Error ? e.message : String(e));
      });
    return () => {
      revoked = true;
      if (url) URL.revokeObjectURL(url);
      setVideoUrl(null);
      setVideoError(null);
    };
  }, [item.id, item.kind]);

  // Esc-to-close so the user always has a way out even if they can't see the X.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const updateOverride = <K extends keyof InspirationTags>(key: K, value: InspirationTags[K]) => {
    const next = { ...overrides, [key]: value };
    setOverrides(next);
    onTagsChange(next);
  };

  const addCustomTag = () => {
    const t = customTagInput.trim();
    if (!t) return;
    const current = overrides.customTags ?? tags.customTags;
    if (current.includes(t)) return;
    const next = { ...overrides, customTags: [...current, t] };
    setOverrides(next);
    onTagsChange(next);
    setCustomTagInput('');
  };

  const removeCustomTag = (t: string) => {
    const current = overrides.customTags ?? tags.customTags;
    const next = { ...overrides, customTags: current.filter((x) => x !== t) };
    setOverrides(next);
    onTagsChange(next);
  };

  // Top-level tag pills shown right under the title so the user gets the
  // full classification at a glance without scrolling.
  const headerPills: Array<{ label: string; tone: 'blue' | 'violet' | 'emerald' | 'amber' | 'slate' }> = [];
  if (tags.adType && tags.adType !== 'unknown') headerPills.push({ label: tags.adType, tone: 'blue' });
  if (tags.angleType && tags.angleType !== 'unknown') headerPills.push({ label: tags.angleType, tone: 'violet' });
  if (tags.productCategory && tags.productCategory !== 'unknown') headerPills.push({ label: tags.productCategory, tone: 'emerald' });
  if (tags.duration && tags.duration !== 'unknown') headerPills.push({ label: tags.duration, tone: 'amber' });
  if (tags.framework && tags.framework !== 'unknown') headerPills.push({ label: String(tags.framework), tone: 'slate' });

  const pillTone: Record<string, string> = {
    blue: 'bg-blue-100 text-blue-700 border-blue-200',
    violet: 'bg-violet-100 text-violet-700 border-violet-200',
    emerald: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    amber: 'bg-amber-100 text-amber-800 border-amber-200',
    slate: 'bg-slate-100 text-slate-700 border-slate-200',
  };

  return (
    // Backdrop: click outside the card closes. We use items-start with a
    // small top offset (no flex centering) so the modal is reliably scrollable
    // on small viewports — `items-center` + `overflow-y-auto` is the classic
    // broken-modal trap that hides the top of tall content above scroll origin.
    <div
      className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Fixed header — never scrolls, X is always reachable */}
        <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-start justify-between gap-4 flex-shrink-0">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-bold text-slate-800 truncate">{item.title}</h3>
              <button
                onClick={onStar}
                className={`text-2xl leading-none flex-shrink-0 transition-colors ${
                  item.starred ? 'text-yellow-400' : 'text-slate-300 hover:text-yellow-400'
                }`}
                aria-label={item.starred ? 'Unstar' : 'Star'}
              >
                {item.starred ? '\u2605' : '\u2606'}
              </button>
            </div>
            <div className="text-xs text-slate-500 mt-1 truncate">
              {KIND_LABEL[item.kind]} {'\u00B7'} {item.filename} {'\u00B7'} uploaded{' '}
              {new Date(item.uploadedAt).toLocaleString()}
            </div>
            {headerPills.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {headerPills.map((p, i) => (
                  <span
                    key={i}
                    className={`inline-flex items-center px-2 py-0.5 text-[10px] font-semibold rounded-full border ${pillTone[p.tone]}`}
                  >
                    {p.label}
                  </span>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 w-9 h-9 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-800 flex items-center justify-center text-lg transition-colors"
            aria-label="Close"
            type="button"
          >
            {'\u2715'}
          </button>
        </div>

        {/* Scrollable body — has its own overflow context so the X stays put */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4 bg-slate-50">
          {item.kind === 'video' ? (
            videoUrl ? (
              <video
                src={videoUrl}
                poster={item.thumbnailDataUrl}
                controls
                playsInline
                className="w-full max-h-[28rem] rounded-xl bg-black shadow-md"
              />
            ) : videoError ? (
              <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {videoError}
              </div>
            ) : (
              <div className="w-full aspect-video flex items-center justify-center rounded-xl bg-slate-100 text-slate-400 text-sm">
                Loading video{'\u2026'}
              </div>
            )
          ) : (
            item.thumbnailDataUrl && (
              <img
                src={item.thumbnailDataUrl}
                alt=""
                className="w-full max-h-72 object-contain rounded-xl bg-slate-100"
              />
            )
          )}

          {item.status === 'failed' && (
            <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              <strong>Analysis failed:</strong> {item.analysisError}
            </div>
          )}

          {item.status === 'ready' && (
            <>
              {item.summary && (
                <Section title="Why this works" icon={'\uD83D\uDCA1'} accent="amber">
                  <p>{item.summary}</p>
                </Section>
              )}
              {item.learnings.length > 0 && (
                <Section title="What to apply" icon={'\u2728'} accent="emerald">
                  <ul className="space-y-2">
                    {item.learnings.map((l, i) => (
                      <li key={i} className="flex gap-2">
                        <span className="text-emerald-500 font-bold mt-0.5">{'\u2192'}</span>
                        <span>{l}</span>
                      </li>
                    ))}
                  </ul>
                </Section>
              )}
              {item.styleNotes && (
                <Section title="Style notes" icon={'\uD83C\uDFA8'} accent="violet">
                  <p>{item.styleNotes}</p>
                </Section>
              )}
              {item.hookBreakdown && (
                <Section title="Hook breakdown" icon={'\uD83C\uDFAF'} accent="blue">
                  <p>{item.hookBreakdown}</p>
                </Section>
              )}
              {item.narrativeArc && (
                <Section title="Narrative arc" icon={'\uD83D\uDCD6'} accent="slate">
                  <p>{item.narrativeArc}</p>
                </Section>
              )}
            </>
          )}

          <Section title="Tags (you can override the agent)" icon={'\uD83C\uDFF7\uFE0F'} accent="slate">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <TagSelect
                label="Ad Type"
                value={tags.adType}
                options={AD_TYPES.filter((x) => x !== 'all') as string[]}
                onChange={(v) => updateOverride('adType', v as InspirationTags['adType'])}
              />
              <TagSelect
                label="Angle"
                value={tags.angleType}
                options={ANGLE_TYPES.filter((x) => x !== 'all') as string[]}
                onChange={(v) => updateOverride('angleType', v as InspirationTags['angleType'])}
              />
              <TagSelect
                label="Product"
                value={tags.productCategory ?? 'unknown'}
                options={PRODUCT_CATEGORIES.filter((x) => x !== 'all') as string[]}
                onChange={(v) =>
                  updateOverride('productCategory', v as InspirationTags['productCategory'])
                }
              />
              <TagSelect
                label="Duration"
                value={tags.duration}
                options={['15s', '30s', '60s', '90s']}
                onChange={(v) => updateOverride('duration', v as InspirationTags['duration'])}
              />
            </div>

            <div className="mt-4">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                Custom Tags
              </div>
              <div className="flex flex-wrap gap-1 mb-2">
                {(overrides.customTags ?? tags.customTags).map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full border border-blue-200"
                  >
                    {t}
                    <button
                      onClick={() => removeCustomTag(t)}
                      className="text-blue-500 hover:text-blue-900"
                      aria-label={`Remove ${t}`}
                    >
                      {'\u2715'}
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customTagInput}
                  onChange={(e) => setCustomTagInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addCustomTag()}
                  placeholder={'Add custom tag\u2026'}
                  className="flex-1 px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={addCustomTag}
                  className="px-3 py-1.5 bg-slate-200 text-slate-700 rounded-lg text-sm hover:bg-slate-300 transition-colors"
                  type="button"
                >
                  Add
                </button>
              </div>
            </div>
          </Section>

          <Section title="Notes" icon={'\uD83D\uDCDD'} accent="slate">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={() => onNotesChange(notes)}
              rows={3}
              placeholder={'Your private notes\u2026'}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />
          </Section>
        </div>

        {/* Fixed footer with destructive action */}
        <div className="bg-white border-t border-slate-200 px-6 py-3 flex justify-between items-center flex-shrink-0">
          <div className="text-[11px] text-slate-400">
            Press <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded text-[10px] font-mono">Esc</kbd> to close
          </div>
          <button
            onClick={onDelete}
            className="px-4 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            type="button"
          >
            Delete from bank
          </button>
        </div>
      </div>
    </div>
  );
}

function Section({
  title,
  icon,
  children,
  accent = 'slate',
}: {
  title: string;
  icon?: string;
  children: React.ReactNode;
  accent?: 'slate' | 'blue' | 'emerald' | 'amber' | 'violet';
}) {
  const accents: Record<string, { card: string; title: string }> = {
    slate: { card: 'bg-white border-slate-200', title: 'text-slate-700' },
    blue: { card: 'bg-blue-50/60 border-blue-200', title: 'text-blue-800' },
    emerald: { card: 'bg-emerald-50/60 border-emerald-200', title: 'text-emerald-800' },
    amber: { card: 'bg-amber-50/60 border-amber-200', title: 'text-amber-800' },
    violet: { card: 'bg-violet-50/60 border-violet-200', title: 'text-violet-800' },
  };
  const a = accents[accent];
  return (
    <div className={`rounded-xl border ${a.card} p-4 shadow-sm`}>
      <div className="flex items-center gap-2 mb-2">
        {icon && <span className="text-base leading-none">{icon}</span>}
        <div className={`text-[10px] font-bold uppercase tracking-wider ${a.title}`}>{title}</div>
      </div>
      <div className="text-sm text-slate-700 leading-relaxed">{children}</div>
    </div>
  );
}

function TagSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-500 uppercase mb-1">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="unknown">unknown</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}

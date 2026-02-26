/**
 * PersonaResultsView — Interactive, channel-aware persona output.
 *
 * HYBRID ARCHITECTURE (same as SegmentResultsView):
 * - Visual elements (snapshot strip, Venn, radar, sales intelligence)
 *   come from DETERMINISTIC engine data. These never fail.
 * - Persona content comes from Claude and is PARSED into structured cards.
 *   Parsing always has a markdown fallback.
 *
 * Layout:
 * 1. Header Bar (nav + export + regenerate)
 * 2. PersonaSnapshotStrip (per-persona cards with sales metrics)
 * 3. VennDiagram (identity x motivation overlap)
 * 4. SegmentRadarChart (product affinity)
 * 5. MarketGeoComparison (if market analysis enabled)
 * 6. Sales Intelligence section (revenue comparison, cross-purchase, journeys, geography)
 * 7. PersonaAccordion (all personas, expand/collapse)
 * 8. Raw Output Toggle
 * 9. PersonaChat (fixed side panel)
 */

import { useState, useMemo } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { FullAnalysis, ProductCategory, PersonaChannel, MarketRegion } from '../engine/types';
import { downloadAsDoc, downloadAsPdf } from '../utils/downloadUtils';
import { parsePersonaOutput, type ChannelType } from './persona/personaParser';
import PersonaSnapshotStrip from './persona/PersonaSnapshotStrip';
import PersonaAccordion from './persona/PersonaAccordion';
import VennDiagram from './persona/VennDiagram';
import SegmentRadarChart from './persona/SegmentRadarChart';
import MarketGeoComparison from './persona/MarketGeoComparison';
import SegmentRevenueComparison from './persona/SegmentRevenueComparison';
import CrossPurchasePanel from './persona/CrossPurchasePanel';
import ProductJourneyMap from './persona/ProductJourneyMap';
import GeographyBreakdown from './persona/GeographyBreakdown';
import PersonaChat from './persona/PersonaChat';
import { hasSalesEnrichment, salesEnrichment } from '../data/salesEnrichmentLoader';
import { DISPLAY_NAME_MAP } from '../utils/segmentNames';

/* ── Props ──────────────────────────────────────────────────────────────── */

interface Props {
  content: string;
  title: string;
  analysis: FullAnalysis;
  product: ProductCategory;
  channel: PersonaChannel;
  selectedPersonas: string[];
  includeMarket: boolean;
  markets: MarketRegion[];
  apiKey: string;
  onBack: () => void;
  onBackToBuilder: () => void;
  onRegenerate: () => void;
  loading?: boolean;
  error?: string | null;
}

/* ── Main Component ─────────────────────────────────────────────────────── */

export default function PersonaResultsView({
  content,
  title,
  analysis,
  product,
  channel,
  selectedPersonas,
  includeMarket,
  markets,
  apiKey,
  onBack,
  onBackToBuilder,
  onRegenerate,
  loading,
  error,
}: Props) {
  // ── Parse Claude's output into structured personas ──
  const parsedPersonas = useMemo(
    () => content ? parsePersonaOutput(content, channel as ChannelType) : [],
    [content, channel],
  );

  // ── Deterministic data lookups ──
  const segmentTotals = useMemo(() => {
    const totals = new Map<string, number>();
    const sb = analysis.segmentBreakdown;
    if (!sb) return totals;
    for (const seg of sb.segments) {
      const productData = seg.byProduct[product];
      const count = productData?.count ?? 0;
      if (count > 0) {
        totals.set(seg.segmentName.toLowerCase(), count);
        const displayName = DISPLAY_NAME_MAP.get(seg.segmentName.toLowerCase());
        if (displayName) totals.set(displayName.toLowerCase(), count);
      }
    }
    return totals;
  }, [analysis, product]);

  // ── Export handlers ──
  const handleCopy = () => navigator.clipboard.writeText(content);

  const handleDownloadMd = () => {
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.toLowerCase().replace(/\s+/g, '-')}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Loading state ──
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md text-center">
          <div className="text-5xl mb-6 animate-pulse">{'\uD83C\uDFAD'}</div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Building Personas...</h2>
          <p className="text-slate-500 text-sm">
            Claude is crafting detailed {channel} personas for {product}
          </p>
          <div className="mt-4 flex justify-center gap-1">
            {[0, 1, 2].map(i => (
              <div
                key={i}
                className="w-2 h-2 rounded-full bg-blue-400 animate-bounce"
                style={{ animationDelay: `${i * 150}ms` }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Error state ──
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md text-center">
          <div className="text-5xl mb-6">{'\u274C'}</div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Error</h2>
          <p className="text-red-500 mb-6 text-sm">{error}</p>
          <div className="flex gap-3 justify-center">
            <button onClick={onBackToBuilder} className="px-4 py-2 text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 text-sm">
              Edit Selections
            </button>
            <button onClick={onRegenerate} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const showSalesIntelligence = hasSalesEnrichment();
  const meta = showSalesIntelligence ? salesEnrichment.meta : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-6">
      <div className="max-w-5xl mx-auto">

        {/* ── Header Bar ── */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <button onClick={onBackToBuilder} className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1">
              {'\u2190'} Edit Selections
            </button>
            <span className="text-slate-300">|</span>
            <button onClick={onBack} className="text-sm text-slate-400 hover:text-slate-600">
              Dashboard
            </button>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={handleCopy} className="px-3 py-1.5 text-xs text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">
              Copy
            </button>
            <button onClick={handleDownloadMd} className="px-3 py-1.5 text-xs text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">
              .md
            </button>
            <button onClick={() => downloadAsDoc(content, title)} className="px-3 py-1.5 text-xs text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">
              .doc
            </button>
            <button onClick={() => downloadAsPdf(content, title)} className="px-3 py-1.5 text-xs text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">
              .pdf
            </button>
            <button onClick={onRegenerate} className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
              Regenerate
            </button>
          </div>
        </div>

        {/* ── 1. Persona Snapshot Strip (replaces old KPI Summary) ── */}
        <PersonaSnapshotStrip
          personas={parsedPersonas}
          selectedPersonas={selectedPersonas}
          product={product}
          channel={channel}
          analysis={analysis}
          includeMarket={includeMarket}
        />

        {/* ── 2. Venn Diagram (identity x motivation overlap) ── */}
        <VennDiagram
          overlaps={analysis.segmentBreakdown?.crossSegmentOverlap ?? []}
          selectedPersonas={selectedPersonas}
          product={product}
          segmentTotals={segmentTotals}
          displayNameMap={DISPLAY_NAME_MAP}
        />

        {/* ── 3. Segment Radar Chart (product affinity) ── */}
        <SegmentRadarChart
          analysis={analysis}
          selectedPersonas={selectedPersonas}
          product={product}
        />

        {/* ── 4. Market Geo Comparison (when market analysis enabled) ── */}
        {includeMarket && markets.length > 0 && (
          <MarketGeoComparison markets={markets} />
        )}

        {/* ── 5. Sales Intelligence Section ── */}
        {showSalesIntelligence && (
          <>
            {/* Main Sales Intelligence card */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
              <h3 className="text-sm font-semibold text-slate-800 mb-1">
                Sales Intelligence
              </h3>
              <p className="text-xs text-slate-400 mb-5">
                Real purchase data from{' '}
                {meta ? (
                  <>
                    <span className="font-medium text-slate-600">
                      {meta.reviewersLinkedToOrders.toLocaleString()}
                    </span>{' '}
                    linked customers across{' '}
                    <span className="font-medium text-slate-600">
                      {meta.totalOrderLines.toLocaleString()}
                    </span>{' '}
                    orders ({(meta.linkRate * 100).toFixed(0)}% link rate).
                  </>
                ) : (
                  'linked customer-order data.'
                )}
              </p>

              {/* Revenue Comparison Bars */}
              <SegmentRevenueComparison selectedSegments={selectedPersonas} />

              {/* Customer Journey Map */}
              <div className="mt-6">
                <ProductJourneyMap selectedSegments={selectedPersonas} />
              </div>

              {/* Geographic Breakdown */}
              <div className="mt-6">
                <GeographyBreakdown selectedSegments={selectedPersonas} />
              </div>
            </div>

            {/* Cross-Purchase Behavior (has its own card wrapper) */}
            <CrossPurchasePanel selectedSegments={selectedPersonas} product={product} />
          </>
        )}

        {/* ── 6. Persona Accordion (all personas, expand/collapse) ── */}
        {parsedPersonas.length > 0 ? (
          <PersonaAccordion
            personas={parsedPersonas}
            channel={channel}
            product={product}
            analysis={analysis}
            includeMarket={includeMarket}
          />
        ) : content ? (
          /* Fallback: if parsing produced 0 personas, render raw markdown */
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8">
            <div className="prose prose-sm prose-slate max-w-none">
              <Markdown remarkPlugins={[remarkGfm]}>{content}</Markdown>
            </div>
          </div>
        ) : null}

        {/* ── Raw Output Toggle (for debugging/verification) ── */}
        {parsedPersonas.length > 0 && (
          <RawOutputToggle content={content} />
        )}
      </div>

      {/* ── Persona Intelligence Assistant (fixed side panel) ── */}
      {content && !loading && !error && (
        <PersonaChat
          generatedOutput={content}
          apiKey={apiKey}
          analysis={analysis}
          product={product}
          channel={channel}
          selectedPersonas={selectedPersonas}
          includeMarket={includeMarket}
          markets={markets}
        />
      )}
    </div>
  );
}

/* ── Raw Output Toggle ──────────────────────────────────────────────────── */

function RawOutputToggle({ content }: { content: string }) {
  const [showRaw, setShowRaw] = useState(false);

  return (
    <div className="mt-6">
      <button
        onClick={() => setShowRaw(!showRaw)}
        className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1 mx-auto"
      >
        <span className={`transition-transform ${showRaw ? 'rotate-180' : ''}`}>{'\u25BC'}</span>
        {showRaw ? 'Hide' : 'Show'} Raw Markdown Output
      </button>
      {showRaw && (
        <div className="mt-3 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <pre className="text-xs text-slate-600 whitespace-pre-wrap font-mono leading-relaxed max-h-96 overflow-y-auto">
            {content}
          </pre>
        </div>
      )}
    </div>
  );
}

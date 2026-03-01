import React, { useState } from 'react';
import { Provider } from '../types';
import { Star, Phone, Globe, MapPin, ExternalLink, Trash2 } from 'lucide-react';
import { generateOneSheet } from '../lib/ai';
import { saveProviderOneSheet } from '../lib/queries';
import { OneSheetOutput } from './OneSheetOutput';

interface ProviderCardProps {
  provider: Provider & { one_sheet?: string | null; territory_id?: string };
  onClick?: () => void;
  onDelete?: (id: string) => void;
  onLogContact?: (id: string) => void;
  territoryName?: string;
  openBuyerCount?: number;
}

const QualityDots: React.FC<{ score: number }> = ({ score }) => (
  <div className="flex gap-0.5" title={`Quality: ${score}/5`}>
    {[1, 2, 3, 4, 5].map(i => (
      <div
        key={i}
        className={`w-1.5 h-1.5 rounded-full ${i <= score ? 'bg-accent-green' : 'bg-border-subtle'
          }`}
      />
    ))}
  </div>
);

export const ProviderCard: React.FC<ProviderCardProps> = ({ provider, onClick, onDelete, onLogContact, territoryName, openBuyerCount }) => {
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [contactError, setContactError] = useState<string | null>(null);

  // One-sheet state
  const [oneSheetContent, setOneSheetContent] = useState<string | null>(provider.one_sheet || null);
  const [oneSheetLoading, setOneSheetLoading] = useState(false);
  const [oneSheetError, setOneSheetError] = useState<string | null>(null);
  const [oneSheetCopied, setOneSheetCopied] = useState(false);
  const [showOneSheet, setShowOneSheet] = useState(false);

  const canGenerate = provider.stage === 'active' || provider.stage === 'bench';

  const handleGenerateOneSheet = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowOneSheet(true);
    setOneSheetLoading(true);
    setOneSheetError(null);
    try {
      const template = provider.stage === 'bench' ? 'overflow_pitch' : 'provider_profile';
      const result = await generateOneSheet({
        template: template as any,
        provider,
        territory: territoryName,
        openBuyerCount: template === 'overflow_pitch' ? (openBuyerCount || 0) : undefined,
      });
      setOneSheetContent(result);
      // Auto-save
      await saveProviderOneSheet(provider.id, result);
    } catch (err: any) {
      setOneSheetError(err?.message || 'Failed to generate one-sheet');
    } finally {
      setOneSheetLoading(false);
    }
  };

  const handleCopyOneSheet = async () => {
    if (!oneSheetContent) return;
    try {
      await navigator.clipboard.writeText(oneSheetContent);
      setOneSheetCopied(true);
      setTimeout(() => setOneSheetCopied(false), 2000);
    } catch {
      console.error('Copy failed');
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      await onDelete(provider.id);
    }
  };

  return (
    <div
      onClick={onClick}
      className="bg-bg-card border border-border-subtle p-5 rounded-xl hover:bg-bg-card-hover hover:border-border-hover transition-all cursor-pointer group relative"
    >
      {/* Header Row */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1 min-w-0">
          <h4 className="text-lg truncate">{provider.business_name || provider.name}</h4>
          {provider.address && (
            <div className="flex items-center gap-1 mt-1 text-text-muted">
              <MapPin size={10} />
              <span className="font-mono text-[10px] truncate">{provider.address}</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 ml-2 shrink-0">
          {(!provider.last_contact || (Date.now() - new Date(provider.last_contact).getTime() > 14 * 24 * 60 * 60 * 1000)) && (
            <span className="font-mono text-[10px] text-accent-red uppercase">Overdue</span>
          )}
          <span className="font-mono text-[10px] text-accent-green uppercase border border-accent-green/30 px-2 py-0.5 rounded">
            {provider.niche}
          </span>
          {onDelete && !confirmingDelete && (
            <button
              onClick={(e) => { e.stopPropagation(); setConfirmingDelete(true); }}
              className="text-text-muted hover:text-accent-red transition-colors p-1 opacity-0 group-hover:opacity-100"
              title="Delete provider"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Inline Delete Confirmation */}
      {confirmingDelete && (
        <div
          className="flex items-center gap-3 mb-3 p-2 bg-accent-red/5 border border-accent-red/20 rounded-lg"
          onClick={e => e.stopPropagation()}
        >
          <span className="font-mono text-[10px] text-accent-red uppercase tracking-wider">Delete?</span>
          <button
            onClick={handleDelete}
            className="px-3 py-1 bg-accent-red text-white font-mono text-[10px] uppercase tracking-wider rounded-full hover:bg-accent-red/80 transition-colors"
          >
            Confirm
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setConfirmingDelete(false); }}
            className="font-mono text-[10px] text-text-muted uppercase tracking-wider hover:text-text-primary transition-colors"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Reviews + Quality Row */}
      <div className="flex items-center gap-4 mb-3">
        {provider.review_score != null && (
          <div className="flex items-center gap-1.5">
            <Star size={12} className="text-accent-yellow fill-accent-yellow" />
            <span className="text-sm font-semibold">{provider.review_score}</span>
            {provider.review_count != null && (
              <span className="font-mono text-[10px] text-text-muted">
                ({provider.review_count})
              </span>
            )}
          </div>
        )}
        {provider.quality_score != null && (
          <QualityDots score={provider.quality_score} />
        )}
        {provider.website_status && (
          <span className={`font-mono text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded ${provider.website_status === 'terrible'
            ? 'text-accent-red/70 bg-accent-red/5'
            : provider.website_status === 'good'
              ? 'text-accent-green/70 bg-accent-green/5'
              : 'text-text-muted bg-bg-surface'
            }`}>
            Site: {provider.website_status}
          </span>
        )}
      </div>

      {/* Contact Row */}
      <div className="flex items-center gap-3 mb-3">
        {provider.phone && (
          <a
            href={`tel:${provider.phone}`}
            onClick={e => e.stopPropagation()}
            className="flex items-center gap-1 text-text-secondary hover:text-accent-green transition-colors"
          >
            <Phone size={11} />
            <span className="font-mono text-[11px]">{provider.phone}</span>
          </a>
        )}
      </div>

      {/* Links Row */}
      <div className="flex items-center gap-3 mb-3">
        {provider.current_website_url && (
          <a
            href={provider.current_website_url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            className="flex items-center gap-1 text-text-muted hover:text-accent-blue transition-colors"
          >
            <Globe size={10} />
            <span className="font-mono text-[10px] truncate max-w-[160px]">Website</span>
            <ExternalLink size={8} className="opacity-0 group-hover:opacity-100 transition-opacity" />
          </a>
        )}
        {provider.google_business_url && (
          <a
            href={provider.google_business_url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            className="flex items-center gap-1 text-text-muted hover:text-accent-blue transition-colors"
          >
            <MapPin size={10} />
            <span className="font-mono text-[10px]">Google</span>
            <ExternalLink size={8} className="opacity-0 group-hover:opacity-100 transition-opacity" />
          </a>
        )}
      </div>

      {/* Footer Row */}
      <div className="flex justify-between items-center pt-2 border-t border-border-subtle">
        <span className="font-mono text-[10px] text-text-faint uppercase">
          Stage: {provider.stage}
        </span>
        <div className="flex items-center gap-3">
          {/* One-Sheet Button */}
          {canGenerate ? (
            <button
              onClick={oneSheetContent && !showOneSheet
                ? (e) => { e.stopPropagation(); setShowOneSheet(true); }
                : handleGenerateOneSheet
              }
              className="text-text-secondary hover:text-text-primary font-mono text-[10px] uppercase tracking-wider transition-colors"
            >
              ● one-sheet
            </button>
          ) : (
            <span className="relative group/tooltip">
              <span className="text-text-muted cursor-not-allowed font-mono text-[10px] uppercase tracking-wider">
                ● one-sheet
              </span>
              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-bg-card border border-border-subtle rounded text-text-muted font-mono text-[9px] whitespace-nowrap opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none">
                available once active or bench
              </span>
            </span>
          )}
          <span className="font-mono text-[10px] text-text-muted uppercase">
            {provider.last_contact
              ? `Last: ${new Date(provider.last_contact).toLocaleDateString()}`
              : 'No contact yet'}
          </span>
          {onLogContact && (
            <button
              onClick={async (e) => {
                e.stopPropagation();
                try {
                  setContactError(null);
                  await onLogContact(provider.id);
                } catch {
                  setContactError('Failed to log');
                }
              }}
              className="text-accent-blue hover:underline font-mono text-[10px] uppercase"
            >Log Contact</button>
          )}
        </div>
      </div>
      {contactError && (
        <div className="mt-1">
          <span className="font-mono text-[10px] text-accent-red">{contactError}</span>
        </div>
      )}

      {/* One-Sheet Output */}
      {showOneSheet && (
        <div onClick={e => e.stopPropagation()}>
          <OneSheetOutput
            content={oneSheetContent}
            loading={oneSheetLoading}
            error={oneSheetError}
            copied={oneSheetCopied}
            onRegenerate={(e?: any) => handleGenerateOneSheet(e || { stopPropagation: () => { } } as any)}
            onCopy={handleCopyOneSheet}
          />
        </div>
      )}
    </div>
  );
};

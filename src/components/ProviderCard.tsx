import React from 'react';
import { Provider } from '../types';
import { Star, Phone, Globe, MapPin, ExternalLink } from 'lucide-react';

interface ProviderCardProps {
  provider: Provider;
  onClick?: () => void;
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

export const ProviderCard: React.FC<ProviderCardProps> = ({ provider, onClick }) => {
  return (
    <div
      onClick={onClick}
      className="bg-bg-card border border-border-subtle p-5 rounded-xl hover:bg-bg-card-hover hover:border-border-hover transition-all cursor-pointer group"
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
        <span className="font-mono text-[10px] text-accent-green uppercase border border-accent-green/30 px-2 py-0.5 rounded ml-2 shrink-0">
          {provider.niche}
        </span>
      </div>

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
        <span className="font-mono text-[10px] text-text-muted uppercase">
          {provider.last_contact
            ? `Last: ${new Date(provider.last_contact).toLocaleDateString()}`
            : 'No contact yet'}
        </span>
      </div>
    </div>
  );
};

import React from 'react';
import { Buyer } from '../types';

interface BuyerCardProps {
  buyer: Buyer;
  onClick?: () => void;
}

export const BuyerCard: React.FC<BuyerCardProps> = ({ buyer, onClick }) => {
  return (
    <div 
      onClick={onClick}
      className="bg-bg-card border border-border-subtle p-4 rounded-xl hover:bg-bg-card-hover transition-all cursor-pointer"
    >
      <div className="flex justify-between items-start mb-2">
        <h4 className="text-xl">{buyer.org_name}</h4>
        <span className="font-mono text-[10px] text-accent-blue uppercase border border-accent-blue/30 px-2 py-0.5 rounded">
          {buyer.property_type}
        </span>
      </div>
      <p className="text-text-secondary text-xs font-mono mb-4">{buyer.units} Units · {buyer.contact_name}</p>
      <div className="flex justify-between items-end">
        <span className="font-mono text-[10px] text-text-faint uppercase">Stage: {buyer.stage}</span>
        <span className="font-mono text-[10px] text-text-muted uppercase">Last: {buyer.last_contact || 'Never'}</span>
      </div>
    </div>
  );
};

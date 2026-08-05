// 🛠️ Updated MessageStatus.tsx
import React from 'react';
import { AlertTriangle, RotateCcw, Anchor, Ship, Eye } from 'lucide-react';
import { MessageDeliveryStatus } from '../types';

interface MessageStatusProps {
  status: MessageDeliveryStatus | string;
  isRead?: boolean;
  onRetry?: () => void;
  className?: string;
}

export const MessageStatus: React.FC<MessageStatusProps> = ({
  status,
  isRead,
  onRetry,
  className = '',
}) => {
  // Read / Submerged
  if (isRead || status === 'submerged' || status === 3) {
    return (
      <div className={`flex items-center gap-1 text-cyan-300 font-semibold text-[10px] ${className}`} title="Submerged (Read)">
        <Eye className="w-3 h-3 text-cyan-300 animate-pulse" />
        <span>Submerged</span>
      </div>
    );
  }

  // Delivered / Surfaced
  if (status === 'delivered' || status === 'surfaced' || status === 2) {
    return (
      <div className={`flex items-center gap-1 text-slate-300 font-medium text-[10px] ${className}`} title="Surfaced (Delivered)">
        <Ship className="w-3 h-3 text-slate-300" />
        <span>Surfaced</span>
      </div>
    );
  }

  // Failed / Stranded
  if (status === 'stranded' || status === 0) {
    return (
      <div className={`flex items-center gap-1 text-rose-400 text-[10px] font-mono ${className}`}>
        <AlertTriangle className="w-3 h-3 text-rose-500 animate-pulse" />
        <span>Stranded</span>
        {onRetry && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRetry();
            }}
            className="p-0.5 rounded hover:bg-rose-500/20 text-rose-300 transition-colors cursor-pointer"
            title="Retry sending"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
        )}
      </div>
    );
  }

  // Default Sent / Anchored
  return (
    <div className={`flex items-center gap-1 text-slate-400 text-[10px] ${className}`} title="Anchored (Sent)">
      <Anchor className="w-3 h-3 text-slate-400" />
      <span>Anchored</span>
    </div>
  );
};
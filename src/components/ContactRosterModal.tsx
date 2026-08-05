import React, { useState } from 'react';
import { Search, X, Users, Anchor, Compass, Radio } from 'lucide-react';
import { Profile } from '../types';

interface ContactRosterModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: Profile;
  profiles: Profile[];
  onSelectContact: (profile: Profile) => void;
}

export const ContactRosterModal: React.FC<ContactRosterModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  profiles,
  onSelectContact,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  // 1. Safe array access
  const safeProfiles = Array.isArray(profiles) ? profiles : [];

  // 2. Self-Exclusion: Exclude currently logged-in / active demo user consistently
  const isSelfUser = (p: Profile, user?: Profile): boolean => {
    if (!p || !user) return false;
    const pId = (p.id || '').trim();
    const uId = (user.id || '').trim();
    if (pId && uId && pId === uId) return true;

    const pEmail = (p.email || '').trim().toLowerCase();
    const uEmail = (user.email || '').trim().toLowerCase();
    if (pEmail && uEmail && pEmail === uEmail) return true;

    const pUsername = (p.username || '').trim().toLowerCase();
    const uUsername = (user.username || '').trim().toLowerCase();
    if (pUsername && uUsername && pUsername === uUsername) return true;

    const pName = (p.full_name || '').trim().toLowerCase();
    const uName = (user.full_name || '').trim().toLowerCase();
    if (pName && uName && pName === uName) return true;

    return false;
  };

  const availableProfiles = safeProfiles.filter((p) => p && p.id && !isSelfUser(p, currentUser));

  // 3. Live Search Filtering (Display Name, Username, Email, or ID - case insensitive & null-safe)
  const q = (searchQuery || '').trim().toLowerCase();
  const filteredProfiles = availableProfiles
    .filter((p) => {
      if (!q) return true;
      const nameMatch = (p.full_name || '').toLowerCase().includes(q);
      const usernameMatch = (p.username || '').toLowerCase().includes(q);
      const emailMatch = (p.email || '').toLowerCase().includes(q);
      const idMatch = (p.id || '').toLowerCase().includes(q);
      return nameMatch || usernameMatch || emailMatch || idMatch;
    })
    .sort((a, b) => (a.full_name || a.username || '').localeCompare(b.full_name || b.username || ''));

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 transition-all animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg bg-slate-900/95 border border-slate-800/90 rounded-3xl p-5 sm:p-6 shadow-2xl shadow-cyan-500/10 relative flex flex-col max-h-[85vh] overflow-hidden backdrop-blur-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ambient Top Glow */}
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 bg-cyan-500/15 rounded-full blur-2xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-100 flex items-center gap-2">
                Select Contact
                <span className="text-xs font-normal text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/20">
                  {filteredProfiles.length} available
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Launch an encrypted nautical stream with any sailor
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800/80 transition-all cursor-pointer"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sticky Search Bar */}
        <div className="pt-4 pb-3 shrink-0">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by name, username, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-9 py-2.5 rounded-2xl bg-slate-950/90 border border-slate-800/90 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/30 focus:outline-none text-xs text-slate-100 placeholder:text-slate-500 transition-all shadow-inner"
              autoFocus
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white rounded-full transition-colors"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Contact List Container - Scrollable max-h-[60vh] with glassmorphic styling */}
        <div className="flex-1 max-h-[60vh] overflow-y-auto pr-1 space-y-2.5 custom-scrollbar">
          {/* STATE 1: No other users exist in database */}
          {availableProfiles.length === 0 ? (
            <div className="py-12 px-4 text-center flex flex-col items-center justify-center rounded-2xl bg-slate-950/50 border border-slate-800/60 my-2">
              <div className="p-3.5 rounded-full bg-slate-900 border border-slate-800 text-cyan-400 mb-3 shadow-inner">
                <Radio className="w-6 h-6 animate-pulse" />
              </div>
              <h4 className="text-sm font-bold text-slate-200">No active users found on the horizon.</h4>
              <p className="text-xs text-slate-500 max-w-xs mt-1">
                As new sailors join the harbor, they will appear here automatically for encrypted direct messaging.
              </p>
            </div>
          ) : filteredProfiles.length === 0 ? (
            /* STATE 2: Search query yields 0 matches */
            <div className="py-12 px-4 text-center flex flex-col items-center justify-center rounded-2xl bg-slate-950/50 border border-slate-800/60 my-2">
              <div className="p-3.5 rounded-full bg-slate-900 border border-slate-800 text-amber-400 mb-3 shadow-inner">
                <Compass className="w-6 h-6 animate-spin-slow" />
              </div>
              <h4 className="text-sm font-bold text-slate-200">
                No sailors found matching &apos;{searchQuery}&apos;
              </h4>
              <p className="text-xs text-slate-500 max-w-xs mt-1">
                Try searching for a different display name, username, or email address.
              </p>
            </div>
          ) : (
            /* STATE 3: Filtered Contact List */
            filteredProfiles.map((prof) => (
              <div
                key={prof.id}
                onClick={() => {
                  onSelectContact(prof);
                  onClose();
                }}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-950/70 hover:bg-slate-800/80 border border-slate-800/80 hover:border-cyan-500/40 transition-all cursor-pointer group shadow-sm hover:shadow-cyan-500/10"
              >
                <div className="flex items-center gap-3.5 min-w-0 pr-2">
                  <div className="relative shrink-0">
                    <img
                      src={prof.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(prof.id)}`}
                      alt={prof.full_name}
                      className="w-11 h-11 rounded-full object-cover border border-slate-700/80 group-hover:border-cyan-400/60 transition-colors"
                    />
                    <span
                      className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-slate-950 ${
                        prof.is_online ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
                      }`}
                    />
                  </div>

                  <div className="min-w-0">
                    <h4 className="font-semibold text-sm text-slate-100 truncate group-hover:text-cyan-300 transition-colors">
                      {prof.full_name}
                    </h4>
                    <div className="flex items-center gap-2 text-xs text-slate-400 truncate mt-0.5">
                      <span className="font-mono text-cyan-400/90 truncate">@{prof.username}</span>
                      {prof.email && (
                        <>
                          <span className="text-slate-600">•</span>
                          <span className="text-slate-500 truncate text-[11px]">{prof.email}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectContact(prof);
                    onClose();
                  }}
                  className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 hover:text-cyan-300 font-semibold text-xs border border-cyan-500/30 hover:border-cyan-400/60 shadow-sm transition-all group-hover:scale-105 cursor-pointer"
                >
                  <Anchor className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Anchor</span>
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

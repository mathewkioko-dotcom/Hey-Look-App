import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  User,
  Shield,
  Award,
  Link,
  Users,
  Briefcase,
  Star,
  Globe,
  Fingerprint,
  Lock,
  VolumeX,
  EyeOff,
  AlertTriangle,
  RotateCcw,
  Check,
  CheckCircle,
  Clock,
  DollarSign
} from 'lucide-react';
import { Profile } from '../../types';

interface ProfileCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetUser: { id: string; name: string; avatar: string; bio?: string; last_seen?: string };
  isVip: boolean;
  onToggleVip: () => void;
  languageOverride: string;
  onChangeLanguage: (lang: string) => void;
  onNotice: (msg: string) => void;
}

export const ProfileCardModal: React.FC<ProfileCardModalProps> = ({
  isOpen,
  onClose,
  targetUser,
  isVip,
  onToggleVip,
  languageOverride,
  onChangeLanguage,
  onNotice,
}) => {
  const [activeTab, setActiveTab] = useState<'identity' | 'relationship' | 'adjustments' | 'locks'>('identity');
  const [tier, setTier] = useState('Enterprise Partner');
  const [dealValue, setDealValue] = useState('$150,000');
  const [muteTyping, setMuteTyping] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [biometricUnlocked, setBiometricUnlocked] = useState(false);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-2xl text-slate-100 relative overflow-hidden"
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>

          {/* User Header Info */}
          <div className="flex items-center gap-4 border-b border-slate-800 pb-4">
            <div className="relative">
              <img
                src={targetUser.avatar}
                alt={targetUser.name}
                className={`w-16 h-16 rounded-full object-cover border-2 ${
                  isVip ? 'border-amber-400 ring-4 ring-amber-400/30' : 'border-slate-700'
                }`}
              />
              {isVip && (
                <div className="absolute -bottom-1 -right-1 p-1 rounded-full bg-amber-500 text-slate-950">
                  <Star className="w-3.5 h-3.5 fill-current" />
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg text-white">{targetUser.name}</h3>
                {isVip && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    VIP
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">{tier} • Verified Nautical Node</p>
              <p className="text-[10px] text-cyan-400 font-mono mt-0.5">ID: {targetUser.id.slice(0, 12)}...</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center justify-between border-b border-slate-800 my-3 pb-2 text-xs">
            {(['identity', 'relationship', 'adjustments', 'locks'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-2.5 py-1 rounded-lg font-bold capitalize ${
                  activeTab === tab ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'text-slate-400 hover:text-white'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* TAB 1: IDENTITY NODES */}
          {activeTab === 'identity' && (
            <div className="space-y-2 text-xs">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-400" />
                  <div>
                    <p className="font-bold text-slate-200">Trust Score Vouch Card</p>
                    <p className="text-[10px] text-slate-500">99.8% Cryptographic Reputation</p>
                  </div>
                </div>
                <button
                  onClick={() => onNotice('Vouch Card Exported')}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 text-cyan-300 hover:bg-slate-700"
                >
                  Verify
                </button>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Link className="w-4 h-4 text-indigo-400" />
                  <div>
                    <p className="font-bold text-slate-200">LinkedIn Business Bridge</p>
                    <p className="text-[10px] text-slate-500">linkedin.com/in/{targetUser.name.toLowerCase().replace(/\s+/g, '')}</p>
                  </div>
                </div>
                <button
                  onClick={() => onNotice('Opened Business Link')}
                  className="px-2.5 py-1 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/40"
                >
                  Open
                </button>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-400" />
                  <div>
                    <p className="font-bold text-slate-200">Mutual Contacts</p>
                    <p className="text-[10px] text-slate-500">14 Shared Enterprise Nodes</p>
                  </div>
                </div>
                <button
                  onClick={() => onNotice('Viewing 14 Mutual Connections')}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300"
                >
                  View List
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: RELATIONSHIP TAGS */}
          {activeTab === 'relationship' && (
            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-slate-400 font-bold">Partner Tier Label</label>
                <select
                  value={tier}
                  onChange={(e) => {
                    setTier(e.target.value);
                    onNotice(`Tier set to ${e.target.value}`);
                  }}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100"
                >
                  <option>Enterprise Partner</option>
                  <option>Strategic Investor</option>
                  <option>Nautical Captain</option>
                  <option>VIP Account</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-bold">Associated Deal Value</label>
                <input
                  type="text"
                  value={dealValue}
                  onChange={(e) => setDealValue(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 font-bold text-emerald-400"
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-cyan-400" />
                  <div>
                    <p className="font-bold text-slate-200">Anchor Connection Started</p>
                    <p className="text-[10px] text-slate-500">October 14, 2025 • 294 Days Active</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ADJUSTMENTS */}
          {activeTab === 'adjustments' && (
            <div className="space-y-2 text-xs">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-amber-400" />
                  <div>
                    <p className="font-bold text-slate-200">VIP Priority Highlight Ring</p>
                    <p className="text-[10px] text-slate-500">Gold border avatar emphasis</p>
                  </div>
                </div>
                <button
                  onClick={onToggleVip}
                  className={`px-3 py-1 rounded-lg font-bold ${
                    isVip ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {isVip ? 'Active' : 'Off'}
                </button>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-indigo-400" />
                  <div>
                    <p className="font-bold text-slate-200">Language Translation Override</p>
                    <p className="text-[10px] text-slate-500">{languageOverride}</p>
                  </div>
                </div>
                <select
                  value={languageOverride}
                  onChange={(e) => {
                    onChangeLanguage(e.target.value);
                    onNotice(`Language set to ${e.target.value}`);
                  }}
                  className="p-1.5 rounded-lg bg-slate-800 text-[11px] text-indigo-300 border border-slate-700"
                >
                  <option>English (US)</option>
                  <option>Spanish (ES)</option>
                  <option>French (FR)</option>
                  <option>German (DE)</option>
                  <option>Japanese (JP)</option>
                </select>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <VolumeX className="w-4 h-4 text-rose-400" />
                  <div>
                    <p className="font-bold text-slate-200">Mute Typing Indicators</p>
                    <p className="text-[10px] text-slate-500">Do not broadcast typing state</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setMuteTyping(!muteTyping);
                    onNotice(muteTyping ? 'Typing Indicator Visible' : 'Typing Indicator Muted');
                  }}
                  className={`px-3 py-1 rounded-lg font-bold ${
                    muteTyping ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {muteTyping ? 'Muted' : 'Off'}
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: ACCESS LOCKS */}
          {activeTab === 'locks' && (
            <div className="space-y-2 text-xs">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Fingerprint className="w-4 h-4 text-cyan-400" />
                  <div>
                    <p className="font-bold text-slate-200">Biometric Room Lock</p>
                    <p className="text-[10px] text-slate-500">Require Touch ID / Face ID</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setBiometricUnlocked(!biometricUnlocked);
                    onNotice(biometricUnlocked ? 'Biometric Lock Engaged' : 'Fingerprint Verified');
                  }}
                  className={`px-3 py-1 rounded-lg font-bold ${
                    biometricUnlocked ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {biometricUnlocked ? 'Unlocked' : 'Scan'}
                </button>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <EyeOff className="w-4 h-4 text-rose-400" />
                  <div>
                    <p className="font-bold text-slate-200">Global Block Anchor</p>
                    <p className="text-[10px] text-slate-500">Restrict all messages and call requests</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setIsBlocked(!isBlocked);
                    onNotice(isBlocked ? 'User Unblocked' : 'User Blocked');
                  }}
                  className={`px-3 py-1 rounded-lg font-bold ${
                    isBlocked ? 'bg-rose-500 text-white' : 'bg-slate-800 text-rose-300'
                  }`}
                >
                  {isBlocked ? 'Blocked' : 'Block'}
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

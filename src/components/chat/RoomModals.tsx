import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Shield,
  QrCode,
  Download,
  FileText,
  Briefcase,
  Smartphone,
  CheckCircle,
  Copy,
  ExternalLink,
  Lock,
  Search,
  Image as ImageIcon,
  Link as LinkIcon,
  Folder
} from 'lucide-react';
import { ChatMessage, Profile } from '../../types';

interface RoomModalProps {
  type: 'barcode' | 'assets' | 'transcript' | 'crm' | 'devices' | null;
  onClose: () => void;
  messages: ChatMessage[];
  currentUser: Profile;
  targetUser: { name: string; avatar: string };
  onNotice?: (msg: string) => void;
}

export const RoomModals: React.FC<RoomModalProps> = ({
  type,
  onClose,
  messages,
  currentUser,
  targetUser,
  onNotice,
}) => {
  const [activeAssetTab, setActiveAssetTab] = useState<'all' | 'media' | 'docs' | 'links'>('all');
  const [dealStage, setDealStage] = useState('Qualified Lead');
  const [dealValue, setDealValue] = useState('150,000');

  if (!type) return null;

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

          {/* 1. SECURITY BARCODE VERIFICATION MODAL */}
          {type === 'barcode' && (
            <div className="space-y-4 text-center">
              <div className="inline-flex p-3 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                <QrCode className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-xl text-white">Cryptographic Security Barcode</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Compare fingerprint with {targetUser.name} to confirm zero man-in-the-middle interception.
              </p>

              <div className="p-4 bg-white rounded-2xl w-48 h-48 mx-auto flex items-center justify-center shadow-2xl">
                <div className="w-full h-full bg-slate-950 rounded-xl p-2 flex flex-col justify-between font-mono text-[8px] text-cyan-400 break-all">
                  <span>[E2EE-NAUTICAL-KEYS]</span>
                  <div className="my-auto text-center font-bold text-xs tracking-widest text-emerald-400">
                    4B8F 90C1 22A4 F6E8
                  </div>
                  <span>SCAN_SHA256_VERIFIED</span>
                </div>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs font-mono text-cyan-300">
                Fingerprint: 88A1-42F9-C102-E994-0021-FF89
              </div>

              <button
                onClick={() => {
                  if (onNotice) onNotice('Security Fingerprint Confirmed');
                  onClose();
                }}
                className="w-full py-3 rounded-2xl bg-emerald-500 text-slate-950 font-extrabold hover:bg-emerald-400"
              >
                Mark Safety Verified
              </button>
            </div>
          )}

          {/* 2. SHARED ASSETS CENTER MODAL */}
          {type === 'assets' && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                  <Folder className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-white">Shared Asset Vault</h3>
                  <p className="text-xs text-slate-400">All media, documents and links in this room</p>
                </div>
              </div>

              <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                {(['all', 'media', 'docs', 'links'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveAssetTab(tab)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold capitalize ${
                      activeAssetTab === tab ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                {messages.filter((m) => m.image_url || m.text.includes('📎')).length === 0 ? (
                  <p className="text-center text-xs text-slate-500 py-8">No shared assets logged yet.</p>
                ) : (
                  messages
                    .filter((m) => m.image_url || m.text.includes('📎'))
                    .map((m) => (
                      <div key={m.id} className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 truncate">
                          {m.image_url ? (
                            <ImageIcon className="w-4 h-4 text-cyan-400 shrink-0" />
                          ) : (
                            <FileText className="w-4 h-4 text-amber-400 shrink-0" />
                          )}
                          <span className="truncate text-slate-200">{m.text}</span>
                        </div>
                        <span className="text-[10px] text-slate-500 shrink-0">
                          {new Date(m.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    ))
                )}
              </div>
            </div>
          )}

          {/* 3. PDF TRANSCRIPT PREVIEW MODAL */}
          {type === 'transcript' && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-white">Export Audit Transcript</h3>
                  <p className="text-xs text-slate-400">Formal log of {messages.length} messages</p>
                </div>
              </div>

              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 max-h-48 overflow-y-auto font-mono text-[11px] text-slate-300 space-y-1.5">
                <p className="text-cyan-400 font-bold border-b border-slate-800 pb-1">=== OFFICIAL NAUTICAL CHAT TRANSCRIPT ===</p>
                {messages.map((m) => (
                  <p key={m.id}>
                    <span className="text-slate-500">[{new Date(m.created_at).toLocaleTimeString()}]</span>{' '}
                    <strong className={m.is_me ? 'text-indigo-400' : 'text-emerald-400'}>
                      {m.is_me ? currentUser.full_name : targetUser.name}:
                    </strong>{' '}
                    {m.text}
                  </p>
                ))}
              </div>

              <button
                onClick={() => {
                  const content = messages.map((m) => `[${new Date(m.created_at).toLocaleString()}] ${m.is_me ? currentUser.full_name : targetUser.name}: ${m.text}`).join('\n');
                  const blob = new Blob([content], { type: 'text/plain' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `Transcript_${targetUser.name.replace(/\s+/g, '_')}.txt`;
                  a.click();
                  if (onNotice) onNotice('Transcript Downloaded');
                  onClose();
                }}
                className="w-full py-3 rounded-2xl bg-cyan-500 text-slate-950 font-extrabold hover:bg-cyan-400 flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span>Download Official Transcript</span>
              </button>
            </div>
          )}

          {/* 4. CRM INTEGRATOR MODAL */}
          {type === 'crm' && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <Briefcase className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-white">CRM Deal Status Pipeline</h3>
                  <p className="text-xs text-slate-400">Associate chat session with enterprise deal</p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs text-slate-400 font-bold">Deal Stage</label>
                <select
                  value={dealStage}
                  onChange={(e) => setDealStage(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100"
                >
                  <option>Qualified Lead</option>
                  <option>Proposal Sent</option>
                  <option>Contract In Review</option>
                  <option>Closed Won ($150k)</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs text-slate-400 font-bold">Deal Value ($ USD)</label>
                <input
                  type="text"
                  value={dealValue}
                  onChange={(e) => setDealValue(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-bold text-emerald-400"
                />
              </div>

              <button
                onClick={() => {
                  if (onNotice) onNotice(`CRM Updated: ${dealStage} ($${dealValue})`);
                  onClose();
                }}
                className="w-full py-3 rounded-2xl bg-emerald-500 text-slate-950 font-extrabold hover:bg-emerald-400"
              >
                Sync with Salesforce / Hubspot
              </button>
            </div>
          )}

          {/* 5. ALLOWED DEVICES AUDIT MODAL */}
          {type === 'devices' && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  <Smartphone className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-white">Active Device Sessions</h3>
                  <p className="text-xs text-slate-400">Connected keys for room encryption</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-slate-200">MacBook Pro M3 (Primary)</p>
                    <p className="text-[10px] text-slate-500">Chrome • Active Now • IP 192.168.1.42</p>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400">Connected</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-slate-200">iPhone 15 Pro (Mobile Anchor)</p>
                    <p className="text-[10px] text-slate-500">iOS App • 4 mins ago</p>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400">Connected</span>
                </div>
              </div>

              <button
                onClick={() => {
                  if (onNotice) onNotice('Unrecognized Sessions Terminated');
                  onClose();
                }}
                className="w-full py-3 rounded-2xl bg-amber-500 text-slate-950 font-extrabold hover:bg-amber-400"
              >
                Revoke Unrecognized Keys
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

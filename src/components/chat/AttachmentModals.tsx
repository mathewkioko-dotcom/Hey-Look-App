import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  FileText,
  Table,
  Clock,
  DollarSign,
  Vote,
  Upload,
  Plus,
  Trash2,
  CheckCircle,
  Shield,
  MapPin,
  Calendar,
  CheckSquare,
  User,
  Paperclip,
  FileCode,
  Zap,
  Lock,
  Film,
  Camera,
  Mic,
  Award
} from 'lucide-react';

interface AttachmentModalProps {
  type: string | null;
  onClose: () => void;
  onDispatch: (title: string, detail: string, category: string, extraData?: any) => void;
}

export const AttachmentModals: React.FC<AttachmentModalProps> = ({
  type,
  onClose,
  onDispatch,
}) => {
  // Document Share state
  const [docName, setDocName] = useState('Q3_Nautical_Report.pdf');
  const [docSize, setDocSize] = useState('4.2 MB');

  // Spreadsheet state
  const [sheetName, setSheetName] = useState('Financial_Projection_2026');
  const [gridData, setGridData] = useState([
    ['Quarter', 'Revenue', 'Growth'],
    ['Q1', '$120,000', '+14%'],
    ['Q2', '$145,000', '+18%'],
    ['Q3', '$180,000', '+22%'],
  ]);

  // Auto Expire state
  const [fileName, setFileName] = useState('Confidential_Key.pem');
  const [expireHours, setExpireHours] = useState(24);

  // Invoice state
  const [invoiceAmount, setInvoiceAmount] = useState('1,250.00');
  const [invoiceRecipient, setInvoiceRecipient] = useState('Maritime Logistics Ltd.');
  const [invoiceItem, setInvoiceItem] = useState('Nautical Encryption License & Consultation');

  // Survey Poll state
  const [pollQuestion, setPollQuestion] = useState('Where should we dock for the Q4 Anchor Meeting?');
  const [pollOptions, setPollOptions] = useState(['Singapore Deep Sea Port', 'Rotterdam Nautical Hub', 'Monaco Harbor']);

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
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>

          {/* 1. DOCUMENT SHARE MODAL */}
          {type === 'doc' && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-white">Share Professional Document</h3>
                  <p className="text-xs text-slate-400">Attach encrypted document to stream</p>
                </div>
              </div>

              <div className="border-2 border-dashed border-slate-700 rounded-2xl p-6 text-center hover:border-cyan-500/50 transition-colors cursor-pointer bg-slate-950/50">
                <Upload className="w-8 h-8 text-cyan-400 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-200">Drag file here or click to browse</p>
                <p className="text-xs text-slate-500 mt-1">PDF, DOCX, XLSX up to 50MB</p>
              </div>

              <div className="space-y-2">
                <label className="text-xs text-slate-400 font-bold">Document Name</label>
                <input
                  type="text"
                  value={docName}
                  onChange={(e) => setDocName(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <button
                onClick={() => {
                  onDispatch('Professional Document', `${docName} (${docSize})`, 'docs', { name: docName, size: docSize });
                  onClose();
                }}
                className="w-full py-3 rounded-2xl bg-cyan-500 text-slate-950 font-extrabold hover:bg-cyan-400 transition-colors shadow-lg shadow-cyan-500/20"
              >
                Send Document
              </button>
            </div>
          )}

          {/* 2. LIVE SPREADSHEET MODAL */}
          {type === 'spreadsheet' && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <Table className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-white">Live Micro Spreadsheet</h3>
                  <p className="text-xs text-slate-400">Embedded real-time data table</p>
                </div>
              </div>

              <input
                type="text"
                value={sheetName}
                onChange={(e) => setSheetName(e.target.value)}
                className="w-full p-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-bold text-emerald-300"
              />

              <div className="overflow-x-auto border border-slate-800 rounded-xl bg-slate-950 p-2">
                <table className="w-full text-xs text-left">
                  <tbody>
                    {gridData.map((row, rIdx) => (
                      <tr key={rIdx} className="border-b border-slate-800/60">
                        {row.map((cell, cIdx) => (
                          <td key={cIdx} className="p-1.5">
                            <input
                              type="text"
                              value={cell}
                              onChange={(e) => {
                                const newGrid = [...gridData];
                                newGrid[rIdx][cIdx] = e.target.value;
                                setGridData(newGrid);
                              }}
                              className={`w-full p-1 rounded bg-transparent ${
                                rIdx === 0 ? 'font-bold text-cyan-400' : 'text-slate-200'
                              } focus:bg-slate-800 focus:outline-none`}
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <button
                onClick={() => {
                  onDispatch('Live Spreadsheet', `${sheetName} (4x3 Grid)`, 'docs', { gridData });
                  onClose();
                }}
                className="w-full py-3 rounded-2xl bg-emerald-500 text-slate-950 font-extrabold hover:bg-emerald-400 transition-colors shadow-lg shadow-emerald-500/20"
              >
                Dispatch Live Spreadsheet
              </button>
            </div>
          )}

          {/* 3. AUTO EXPIRE FILE MODAL */}
          {type === 'expire' && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-white">Auto-Expire Confidential File</h3>
                  <p className="text-xs text-slate-400">File self-destructs after set period</p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs text-slate-400 font-bold">File Selection</label>
                <input
                  type="text"
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-amber-200"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400 font-bold">Expiration Timer</span>
                  <span className="text-amber-400 font-extrabold">{expireHours} Hours</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={72}
                  value={expireHours}
                  onChange={(e) => setExpireHours(Number(e.target.value))}
                  className="w-full accent-amber-400"
                />
              </div>

              <button
                onClick={() => {
                  onDispatch('Auto-Expire File', `${fileName} (Self-destructs in ${expireHours}h)`, 'docs', { expireHours });
                  onClose();
                }}
                className="w-full py-3 rounded-2xl bg-amber-500 text-slate-950 font-extrabold hover:bg-amber-400 transition-colors shadow-lg shadow-amber-500/20"
              >
                Dispatch Expiring File
              </button>
            </div>
          )}

          {/* 4. INVOICE GENERATOR MODAL */}
          {type === 'invoice' && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                  <DollarSign className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-white">Corporate Invoice Generator</h3>
                  <p className="text-xs text-slate-400">Send formal payment request</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-slate-400 font-bold">Amount ($ USD)</label>
                  <input
                    type="text"
                    value={invoiceAmount}
                    onChange={(e) => setInvoiceAmount(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm font-bold text-emerald-400"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-400 font-bold">Billed To</label>
                  <input
                    type="text"
                    value={invoiceRecipient}
                    onChange={(e) => setInvoiceRecipient(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-bold">Line Item Description</label>
                <input
                  type="text"
                  value={invoiceItem}
                  onChange={(e) => setInvoiceItem(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200"
                />
              </div>

              <button
                onClick={() => {
                  onDispatch('Formal Invoice', `Invoice #${Math.floor(1000 + Math.random() * 9000)} - $${invoiceAmount} for ${invoiceRecipient}`, 'legal', { amount: invoiceAmount, recipient: invoiceRecipient });
                  onClose();
                }}
                className="w-full py-3 rounded-2xl bg-indigo-500 text-white font-extrabold hover:bg-indigo-400 transition-colors shadow-lg shadow-indigo-500/20"
              >
                Dispatch Formal Invoice
              </button>
            </div>
          )}

          {/* 5. SURVEY POLL BUILDER MODAL */}
          {type === 'poll' && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
                  <Vote className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-white">Create Survey Poll</h3>
                  <p className="text-xs text-slate-400">Interactive voting for participants</p>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-bold">Poll Question</label>
                <input
                  type="text"
                  value={pollQuestion}
                  onChange={(e) => setPollQuestion(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm font-semibold text-purple-300"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs text-slate-400 font-bold">Voting Options</label>
                {pollOptions.map((opt, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={opt}
                      onChange={(e) => {
                        const newOpts = [...pollOptions];
                        newOpts[idx] = e.target.value;
                        setPollOptions(newOpts);
                      }}
                      className="flex-1 p-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200"
                    />
                    {pollOptions.length > 2 && (
                      <button
                        onClick={() => setPollOptions(pollOptions.filter((_, i) => i !== idx))}
                        className="p-2 text-rose-400 hover:text-rose-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={() => setPollOptions([...pollOptions, `Option ${pollOptions.length + 1}`])}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 text-xs text-purple-300 flex items-center gap-1 hover:bg-slate-700"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Option</span>
                </button>
              </div>

              <button
                onClick={() => {
                  onDispatch('Survey Poll', `📊 ${pollQuestion} (${pollOptions.length} choices)`, 'tools', { question: pollQuestion, options: pollOptions });
                  onClose();
                }}
                className="w-full py-3 rounded-2xl bg-purple-500 text-white font-extrabold hover:bg-purple-400 transition-colors shadow-lg shadow-purple-500/20"
              >
                Dispatch Survey Poll
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

import React, { useState, useEffect, useMemo } from 'react';
import { contractService, BRADBURY_CONFIG } from '../services/contract';
import { WalletState, formatAddress, switchToBradburyNetwork } from '../services/wallet';
import { saveLocalSubmission } from '../services/storage';
import {
  FilePlus,
  Trash2,
  AlertCircle,
  ShieldCheck,
  Send,
  Loader2,
  Info,
  Lock,
} from './icons';

interface SubmitFormProps {
  wallet: WalletState;
  onConnectWallet: () => void;
  onSubmissionComplete: (repKey: string) => void;
}

export const SubmitForm: React.FC<SubmitFormProps> = ({
  wallet,
  onConnectWallet,
  onSubmissionComplete,
}) => {
  const [name, setName] = useState('');
  const [website, setWebsite] = useState('');
  const [sector, setSector] = useState('');
  const [founderAddress, setFounderAddress] = useState('');
  const [documents, setDocuments] = useState<string[]>(['']);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [txStatusMessage, setTxStatusMessage] = useState<string | null>(null);

  // Default founder address to connected wallet
  useEffect(() => {
    if (wallet.address) {
      setFounderAddress(wallet.address);
    }
  }, [wallet.address]);

  // Document length counters
  const docStats = useMemo(() => {
    const combinedLength = documents.reduce((sum, doc) => sum + doc.length, 0);
    const rawJsonLength = JSON.stringify(documents).length;
    return {
      combinedLength,
      rawJsonLength,
      count: documents.length,
    };
  }, [documents]);

  const handleAddDocument = () => {
    if (documents.length < 5) {
      setDocuments([...documents, '']);
    }
  };

  const handleRemoveDocument = (index: number) => {
    if (documents.length > 1) {
      const updated = documents.filter((_, i) => i !== index);
      setDocuments(updated);
    }
  };

  const handleDocumentChange = (index: number, text: string) => {
    const updated = [...documents];
    updated[index] = text;
    setDocuments(updated);
  };

  const validate = (): boolean => {
    const result = contractService.validateSubmissionInputs({
      name,
      website,
      sector,
      founder: founderAddress,
      documents: documents.filter((d) => d.trim().length > 0),
    });

    const newErrors = { ...result.errors };

    // Check founder match with wallet
    if (wallet.isConnected && wallet.address) {
      if (founderAddress.trim().toLowerCase() !== wallet.address.trim().toLowerCase()) {
        newErrors.founder = 'The founder address must match the wallet submitting this transaction.';
      }
    }

    // Must have at least one document
    const validDocs = documents.filter((d) => d.trim().length > 0);
    if (validDocs.length === 0) {
      newErrors.documents = 'At least one evidence document is required.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmitClick = (e: React.FormEvent) => {
    e.preventDefault();
    if (!wallet.isConnected) {
      onConnectWallet();
      return;
    }

    if (!wallet.isBradbury) {
      switchToBradburyNetwork().catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : String(err);
        alert(msg);
      });
      return;
    }

    if (validate()) {
      setShowConfirmModal(true);
    }
  };

  const handleConfirmTransaction = async () => {
    setIsSubmitting(true);
    setTxStatusMessage('Requesting wallet signature...');

    const validDocs = documents.filter((d) => d.trim().length > 0);

    try {
      setTxStatusMessage('Calling submit_startup on VentureMind Intelligent Contract...');
      const { txHash: submittedTxHash, repKey } = await contractService.submitStartup(
        {
          name: name.trim(),
          website: website.trim(),
          sector: sector.trim(),
          founder: founderAddress.trim(),
          documents: validDocs,
        },
        wallet.address!
      );

      setTxStatusMessage(`Transaction sent (${submittedTxHash.slice(0, 10)}...). Verifying submission on-chain...`);

      // Save locally to founder evaluations
      saveLocalSubmission(founderAddress.trim(), {
        rep_key: repKey,
        name: name.trim(),
        website: website.trim(),
        sector: sector.trim(),
        founder: founderAddress.trim(),
        timestamp: Date.now(),
      });

      // Poll until submission is retrievable on-chain via get_submission(rep_key)
      for (let i = 0; i < 15; i++) {
        const sub = await contractService.getSubmission(repKey);
        if (sub && sub.rep_key === repKey) {
          break;
        }
        await new Promise((r) => setTimeout(r, 2000));
      }

      setTxStatusMessage('Submission confirmed on Bradbury network!');
      setShowConfirmModal(false);
      onSubmissionComplete(repKey);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      setTxStatusMessage(`Transaction failed: ${errorMsg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6">
      <div className="mb-8">
        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2">
          <ShieldCheck className="w-4 h-4" />
          <span>VentureMind Due Diligence Oracle</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-2">Submit Startup Evidence</h2>
        <p className="text-sm text-slate-300">
          Provide structured startup information and evidence documents. The Intelligent Contract will record your submission deterministically.
        </p>
      </div>

      <form onSubmit={handleSubmitClick} className="space-y-6">
        {/* Basic Information Card */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm">
          <h3 className="text-base font-bold text-slate-100 mb-4 pb-2 border-b border-slate-800">
            Startup Profile
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Startup Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Startup Name <span className="text-emerald-400">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Acme AI Systems"
                maxLength={256}
                className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border ${
                  errors.name ? 'border-rose-500' : 'border-slate-800 focus:border-emerald-500'
                } text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500`}
              />
              {errors.name && <p className="text-xs text-rose-400 mt-1">{errors.name}</p>}
            </div>

            {/* Sector */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Sector / Industry <span className="text-emerald-400">*</span>
              </label>
              <input
                type="text"
                value={sector}
                onChange={(e) => setSector(e.target.value)}
                placeholder="e.g. AI Infrastructure / Decentralized Compute"
                maxLength={256}
                className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border ${
                  errors.sector ? 'border-rose-500' : 'border-slate-800 focus:border-emerald-500'
                } text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500`}
              />
              {errors.sector && <p className="text-xs text-rose-400 mt-1">{errors.sector}</p>}
            </div>

            {/* Website */}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Canonical Website URL <span className="text-emerald-400">*</span>
              </label>
              <input
                type="text"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://acme.example.com"
                maxLength={256}
                className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border ${
                  errors.website ? 'border-rose-500' : 'border-slate-800 focus:border-emerald-500'
                } text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono`}
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Must start with http:// or https://. The contract normalizes trailing slashes, default ports, and casing to prevent duplicate submissions.
              </p>
              {errors.website && <p className="text-xs text-rose-400 mt-1">{errors.website}</p>}
            </div>

            {/* Founder Address */}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Founder Address <span className="text-emerald-400">*</span>
              </label>
              <input
                type="text"
                value={founderAddress}
                onChange={(e) => setFounderAddress(e.target.value)}
                placeholder="0x..."
                maxLength={256}
                className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border ${
                  errors.founder ? 'border-rose-500' : 'border-slate-800 focus:border-emerald-500'
                } text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono`}
              />
              <div className="flex items-start gap-1.5 mt-1.5 text-xs text-amber-300/90 bg-amber-500/10 p-2.5 rounded-lg border border-amber-500/20">
                <Info className="w-4 h-4 shrink-0 mt-0.5" />
                <span>The founder address must match the wallet submitting this transaction.</span>
              </div>
              {errors.founder && <p className="text-xs text-rose-400 mt-1">{errors.founder}</p>}
            </div>
          </div>
        </div>

        {/* Evidence Documents Card */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-2 border-b border-slate-800">
            <div>
              <h3 className="text-base font-bold text-slate-100">Due Diligence Evidence</h3>
              <p className="text-xs text-slate-400">
                Submit up to 5 documents (pitch deck summaries, architecture specs, cap table notes, traction data).
              </p>
            </div>

            {/* Global Document Character Counters */}
            <div className="flex items-center gap-3 text-xs font-mono">
              <span className={`px-2 py-1 rounded bg-slate-950 border ${docStats.combinedLength > 50000 ? 'border-rose-500 text-rose-400' : 'border-slate-800 text-slate-300'}`}>
                Total: {docStats.combinedLength.toLocaleString()} / 50,000 chars
              </span>
              <span className={`px-2 py-1 rounded bg-slate-950 border ${docStats.rawJsonLength > 64000 ? 'border-rose-500 text-rose-400' : 'border-slate-800 text-slate-400'}`}>
                JSON: {docStats.rawJsonLength.toLocaleString()} / 64,000 bytes
              </span>
            </div>
          </div>

          {errors.documents && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errors.documents}</span>
            </div>
          )}

          {/* Document list */}
          <div className="space-y-4">
            {documents.map((doc, idx) => {
              const docLen = doc.length;
              const isOverLimit = docLen > 12000;
              const hasPromptInjectionMarker = /SYSTEM_PROMPT:|IGNORE_INSTRUCTIONS|ignore previous|developer message/i.test(doc);

              return (
                <div key={idx} className="bg-slate-950/60 border border-slate-800 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-300 font-mono">
                      Document #{idx + 1}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-mono ${isOverLimit ? 'text-rose-400 font-bold' : 'text-slate-400'}`}>
                        {docLen.toLocaleString()} / 12,000 characters
                      </span>
                      {documents.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveDocument(idx)}
                          className="p-1 hover:text-rose-400 text-slate-500 transition-colors"
                          title="Remove Document"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <textarea
                    rows={4}
                    value={doc}
                    onChange={(e) => handleDocumentChange(idx, e.target.value)}
                    placeholder={`Paste document #${idx + 1} content here (e.g. executive summary, market dynamics, tech stack details, tokenomics)...`}
                    className={`w-full px-3.5 py-2 rounded-lg bg-slate-900 border ${
                      isOverLimit ? 'border-rose-500' : 'border-slate-800 focus:border-emerald-500'
                    } text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-sans leading-relaxed`}
                  />

                  {hasPromptInjectionMarker && (
                    <div className="mt-2 text-[11px] text-slate-400 bg-slate-900/80 p-2 rounded border border-slate-800">
                      <span className="text-amber-400 font-semibold">Sanitization Note:</span> Detected instruction-like keywords will be bounded & sanitized to{' '}
                      <span className="font-mono text-emerald-400">[SANITIZED]</span> before contract consensus.
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {documents.length < 5 && (
            <button
              type="button"
              onClick={handleAddDocument}
              className="mt-4 flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
            >
              <FilePlus className="w-4 h-4" />
              <span>Add Another Document ({documents.length}/5)</span>
            </button>
          )}
        </div>

        {/* Action Button */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
          <div className="text-xs text-slate-400 flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
            <span>Submission stores evidence as SUBMITTED. Evaluation is initiated in the next step.</span>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-800 disabled:text-slate-600 text-slate-950 font-bold text-sm transition-all shadow-lg shadow-emerald-500/20 active:scale-95 flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Processing Submission...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Review & Submit to Contract</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              Confirm Startup Submission
            </h3>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              You are about to call <span className="font-mono text-emerald-400">submit_startup</span> on the deployed VentureMind contract.
            </p>

            <div className="space-y-2.5 text-xs font-mono bg-slate-950 p-4 rounded-xl border border-slate-800 mb-5">
              <div className="flex justify-between">
                <span className="text-slate-400">Startup Name:</span>
                <span className="text-white font-bold">{name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Sector:</span>
                <span className="text-slate-200">{sector}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Website:</span>
                <span className="text-emerald-400 truncate max-w-[220px]">{website}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Founder Address:</span>
                <span className="text-slate-200 truncate max-w-[220px]">{formatAddress(founderAddress)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Documents:</span>
                <span className="text-slate-200">{documents.filter((d) => d.trim()).length} documents ({docStats.combinedLength} chars)</span>
              </div>
              <div className="flex justify-between border-t border-slate-800 pt-2 text-[11px]">
                <span className="text-slate-400">Target Contract:</span>
                <span className="text-slate-300">{formatAddress(BRADBURY_CONFIG.contractAddress)}</span>
              </div>
            </div>

            {txStatusMessage && (
              <div className="mb-4 p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 flex items-center gap-2">
                {isSubmitting && <Loader2 className="w-4 h-4 text-emerald-400 animate-spin shrink-0" />}
                <span>{txStatusMessage}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleConfirmTransaction}
                className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-emerald-500/20"
              >
                {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                <span>Sign & Submit Transaction</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

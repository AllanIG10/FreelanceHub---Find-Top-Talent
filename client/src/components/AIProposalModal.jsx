import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Sparkles, RefreshCw, Copy, CheckCheck, DollarSign, Calendar, Pencil } from 'lucide-react'
import { aiAPI } from '../services/api'
import toast from 'react-hot-toast'

function AIProposalModal({ job, isOpen, onClose, onUse }) {
  const [loading, setLoading] = useState(false)
  const [generated, setGenerated] = useState(null)
  const [editing, setEditing] = useState(false)
  const [editedLetter, setEditedLetter] = useState('')
  const [copied, setCopied] = useState(false)

  const generate = async () => {
    setLoading(true)
    setGenerated(null)
    try {
      const result = await aiAPI.generateProposal({
        jobTitle: job?.title,
        jobDescription: job?.description,
        jobSkills: job?.skills,
        budget: job?.budget,
      })
      setGenerated(result)
      setEditedLetter(result.coverLetter)
    } catch (err) {
      toast.error('AI generation failed. Try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(editing ? editedLetter : generated?.coverLetter)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast.success('Copied to clipboard!')
  }

  const handleUse = () => {
    if (!generated) return
    onUse({
      coverLetter: editing ? editedLetter : generated.coverLetter,
      bidAmount: generated.suggestedBid,
      estimatedDays: generated.estimatedDays,
    })
    onClose()
    toast.success('Proposal filled with AI suggestions!')
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-2xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-gradient-to-r from-brand-500 to-brand-600">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="font-bold text-white text-lg">AI Proposal Generator</h2>
                  <p className="text-brand-100 text-sm">Powered by AI</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-white/20 text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Job summary */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Generating proposal for</p>
                <p className="font-semibold text-gray-900 dark:text-white">{job?.title}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{job?.description}</p>
              </div>

              {/* Generate button */}
              {!generated && !loading && (
                <div className="text-center py-6">
                  <div className="w-16 h-16 rounded-full bg-brand-50 dark:bg-brand-900/20 flex items-center justify-center mx-auto mb-4">
                    <Sparkles className="w-8 h-8 text-brand-500" />
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm">
                    AI will analyze the job description and create a personalized cover letter with bid suggestions.
                  </p>
                  <button onClick={generate} className="btn-primary px-8">
                    Generate Proposal
                  </button>
                </div>
              )}

              {/* Loading */}
              {loading && (
                <div className="text-center py-8">
                  <div className="relative w-16 h-16 mx-auto mb-4">
                    <div className="absolute inset-0 rounded-full border-4 border-brand-100 dark:border-brand-900" />
                    <div className="absolute inset-0 rounded-full border-4 border-brand-500 border-t-transparent animate-spin" />
                    <Sparkles className="absolute inset-0 m-auto w-6 h-6 text-brand-500" />
                  </div>
                  <p className="font-medium text-gray-700 dark:text-gray-300">Generating your proposal...</p>
                  <p className="text-sm text-gray-400 mt-1">This may take a moment</p>
                </div>
              )}

              {/* Generated result */}
              {generated && !loading && (
                <div className="space-y-4">
                  {/* Bid suggestions */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-xl">
                      <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/40 flex items-center justify-center">
                        <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Suggested Bid</p>
                        <p className="font-bold text-gray-900 dark:text-white">${generated.suggestedBid?.toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                      <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Timeline</p>
                        <p className="font-bold text-gray-900 dark:text-white">{generated.estimatedDays} days</p>
                      </div>
                    </div>
                  </div>

                  {/* Cover letter */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="label-base mb-0">Cover Letter</label>
                      <button
                        onClick={() => setEditing(p => !p)}
                        className="flex items-center gap-1 text-xs text-brand-500 hover:text-brand-600"
                      >
                        <Pencil className="w-3 h-3" />
                        {editing ? 'Preview' : 'Edit'}
                      </button>
                    </div>
                    {editing ? (
                      <textarea
                        value={editedLetter}
                        onChange={(e) => setEditedLetter(e.target.value)}
                        rows={8}
                        className="input-base text-sm leading-relaxed"
                      />
                    ) : (
                      <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 text-sm text-gray-700 dark:text-gray-300 leading-relaxed max-h-52 overflow-y-auto whitespace-pre-wrap">
                        {generated.coverLetter}
                      </div>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-3">
                    <button
                      onClick={generate}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Regenerate
                    </button>
                    <button
                      onClick={handleCopy}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      {copied ? <CheckCheck className="w-4 h-4 text-brand-500" /> : <Copy className="w-4 h-4" />}
                      {copied ? 'Copied!' : 'Copy'}
                    </button>
                    <button
                      onClick={handleUse}
                      className="ml-auto btn-primary flex items-center gap-2"
                    >
                      <Sparkles className="w-4 h-4" />
                      Use This Proposal
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

export default AIProposalModal

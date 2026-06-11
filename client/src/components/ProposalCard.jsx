import { useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
  Clock, DollarSign, Calendar, ExternalLink, ChevronDown, ChevronUp,
  Check, X, Star as StarIcon, Bookmark, Trash2, User
} from 'lucide-react'
import { proposalsAPI } from '../services/api'
import toast from 'react-hot-toast'

function formatTimeAgo(date) {
  const now = new Date()
  const d = new Date(date)
  const diff = Math.floor((now - d) / 1000)
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

const statusConfig = {
  pending: { label: 'Pending', className: 'status-pending', dot: 'bg-amber-400' },
  shortlisted: { label: 'Shortlisted', className: 'status-shortlisted', dot: 'bg-blue-400' },
  accepted: { label: 'Accepted', className: 'status-accepted', dot: 'bg-green-400' },
  rejected: { label: 'Rejected', className: 'status-rejected', dot: 'bg-red-400' },
}

function ProposalCard({ proposal, viewAs = 'client', onStatusChange, index = 0 }) {
  const [expanded, setExpanded] = useState(false)
  const [loading, setLoading] = useState(null)
  const [localStatus, setLocalStatus] = useState(proposal.status)

  const status = statusConfig[localStatus] || statusConfig.pending
  const freelancer = proposal.freelancer || {}

  const handleStatusChange = async (newStatus) => {
    setLoading(newStatus)
    try {
      await proposalsAPI.updateProposalStatus(proposal._id, newStatus)
      setLocalStatus(newStatus)
      toast.success(`Proposal ${newStatus}`)
      onStatusChange?.(proposal._id, newStatus)
    } catch (err) {
      toast.error(err.message || 'Failed to update status')
    } finally {
      setLoading(null)
    }
  }

  const handleWithdraw = async () => {
    if (!confirm('Are you sure you want to withdraw this proposal?')) return
    setLoading('withdraw')
    try {
      await proposalsAPI.withdrawProposal(proposal._id)
      toast.success('Proposal withdrawn')
      onStatusChange?.(proposal._id, 'withdrawn')
    } catch (err) {
      toast.error(err.message || 'Failed to withdraw')
    } finally {
      setLoading(null)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.06 }}
      className="card p-5 space-y-4"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          {viewAs === 'client' && (
            <Link to={`/profile/${freelancer._id}`}>
              {freelancer.avatar ? (
                <img src={freelancer.avatar} alt={freelancer.name} className="w-12 h-12 rounded-full object-cover ring-2 ring-brand-500/20 hover:ring-brand-500/60 transition-all" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white font-bold text-base">
                  {freelancer.name?.charAt(0) || '?'}
                </div>
              )}
            </Link>
          )}

          <div>
            {viewAs === 'client' ? (
              <>
                <Link to={`/profile/${freelancer._id}`} className="font-semibold text-gray-900 dark:text-white hover:text-brand-500 transition-colors">
                  {freelancer.name || 'Freelancer'}
                </Link>
                <p className="text-sm text-gray-500 dark:text-gray-400">{freelancer.title || 'Freelancer'}</p>
                {freelancer.rating && (
                  <div className="flex items-center gap-1 mt-0.5">
                    {[...Array(5)].map((_, i) => (
                      <StarIcon key={i} className={`w-3 h-3 ${i < Math.round(freelancer.rating) ? 'text-yellow-400 fill-current' : 'text-gray-300 dark:text-gray-600'}`} />
                    ))}
                    <span className="text-xs text-gray-500">({freelancer.reviewCount || 0})</span>
                  </div>
                )}
              </>
            ) : (
              <>
                <p className="font-semibold text-gray-900 dark:text-white">{proposal.job?.title || 'Job Proposal'}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">{proposal.job?.client?.name || 'Client'}</p>
              </>
            )}
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          {/* Status badge */}
          <span className={`flex items-center gap-1.5 ${status.className}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
            {status.label}
          </span>
          {/* Time */}
          <span className="text-xs text-gray-400 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatTimeAgo(proposal.createdAt)}
          </span>
        </div>
      </div>

      {/* Bid info */}
      <div className="flex items-center gap-6 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center">
            <DollarSign className="w-4 h-4 text-brand-600 dark:text-brand-400" />
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Bid Amount</p>
            <p className="font-bold text-gray-900 dark:text-white">${proposal.bidAmount?.toLocaleString()}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
            <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Delivery</p>
            <p className="font-bold text-gray-900 dark:text-white">{proposal.estimatedDays} days</p>
          </div>
        </div>
      </div>

      {/* Cover letter */}
      <div>
        <p className={`text-sm text-gray-600 dark:text-gray-400 leading-relaxed ${!expanded ? 'line-clamp-3' : ''}`}>
          {proposal.coverLetter}
        </p>
        {proposal.coverLetter?.length > 200 && (
          <button
            onClick={() => setExpanded(p => !p)}
            className="mt-1 text-xs font-medium text-brand-500 hover:text-brand-600 flex items-center gap-0.5"
          >
            {expanded ? (<><ChevronUp className="w-3 h-3" /> Show less</>) : (<><ChevronDown className="w-3 h-3" /> Read more</>)}
          </button>
        )}
      </div>

      {/* Portfolio links */}
      {proposal.portfolioLinks?.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {proposal.portfolioLinks.map((link, i) => (
            <a
              key={i}
              href={link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline"
            >
              <ExternalLink className="w-3 h-3" />
              Portfolio {i + 1}
            </a>
          ))}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex items-center gap-2 pt-1 border-t border-gray-100 dark:border-gray-700">
        {viewAs === 'client' && localStatus === 'pending' && (
          <>
            <button
              onClick={() => handleStatusChange('accepted')}
              disabled={!!loading}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-500 text-white text-xs font-semibold rounded-lg hover:bg-brand-600 transition-colors disabled:opacity-50"
            >
              <Check className="w-3.5 h-3.5" />
              {loading === 'accepted' ? 'Accepting...' : 'Accept'}
            </button>
            <button
              onClick={() => handleStatusChange('shortlisted')}
              disabled={!!loading}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500 text-white text-xs font-semibold rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
            >
              <Bookmark className="w-3.5 h-3.5" />
              {loading === 'shortlisted' ? 'Saving...' : 'Shortlist'}
            </button>
            <button
              onClick={() => handleStatusChange('rejected')}
              disabled={!!loading}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400 text-xs font-semibold rounded-lg hover:bg-red-200 dark:hover:bg-red-900/40 transition-colors disabled:opacity-50"
            >
              <X className="w-3.5 h-3.5" />
              {loading === 'rejected' ? 'Rejecting...' : 'Reject'}
            </button>
          </>
        )}
        {viewAs === 'client' && localStatus === 'shortlisted' && (
          <>
            <button
              onClick={() => handleStatusChange('accepted')}
              disabled={!!loading}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-500 text-white text-xs font-semibold rounded-lg hover:bg-brand-600 transition-colors disabled:opacity-50"
            >
              <Check className="w-3.5 h-3.5" />
              {loading === 'accepted' ? 'Accepting...' : 'Accept'}
            </button>
            <button
              onClick={() => handleStatusChange('rejected')}
              disabled={!!loading}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400 text-xs font-semibold rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50"
            >
              <X className="w-3.5 h-3.5" />
              Reject
            </button>
          </>
        )}
        {viewAs === 'freelancer' && localStatus === 'pending' && (
          <button
            onClick={handleWithdraw}
            disabled={!!loading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs font-semibold rounded-lg hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400 transition-colors disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
            {loading === 'withdraw' ? 'Withdrawing...' : 'Withdraw'}
          </button>
        )}
        {viewAs === 'client' && (
          <Link
            to={`/profile/${freelancer._id}`}
            className="ml-auto flex items-center gap-1.5 text-xs text-gray-500 hover:text-brand-500 transition-colors"
          >
            <User className="w-3.5 h-3.5" />
            View Profile
          </Link>
        )}
      </div>
    </motion.div>
  )
}

export default ProposalCard

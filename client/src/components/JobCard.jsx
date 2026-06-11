import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Clock, DollarSign, Users, Tag, Calendar, Star, ChevronRight } from 'lucide-react'

function formatTimeAgo(date) {
  const now = new Date()
  const d = new Date(date)
  const diff = Math.floor((now - d) / 1000)
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`
  return d.toLocaleDateString()
}

const experienceColors = {
  entry: 'badge-green',
  intermediate: 'badge-blue',
  expert: 'badge-amber',
}

const categoryColors = {
  'Web Development': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  'Mobile Development': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  'Design': 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
  'Writing': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  'Marketing': 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  'Data Science': 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
}

function JobCard({ job, index = 0 }) {
  const skills = job.skills || []
  const visibleSkills = skills.slice(0, 4)
  const extraSkills = skills.length - 4

  const budgetDisplay = job.budgetType === 'hourly'
    ? `$${job.budget?.min || 0}–$${job.budget?.max || 0}/hr`
    : `$${job.budget?.min || job.budget || 0}${job.budget?.max ? `–$${job.budget.max}` : ''}`

  const categoryColor = categoryColors[job.category] || 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      whileHover={{ y: -2 }}
      className="card-hover group cursor-pointer"
    >
      <Link to={`/jobs/${job._id}`} className="block p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <span className={`badge text-xs px-2 py-0.5 ${categoryColor}`}>
                {job.category}
              </span>
              {job.experienceLevel && (
                <span className={`badge text-xs px-2 py-0.5 ${experienceColors[job.experienceLevel] || 'badge-gray'} capitalize`}>
                  {job.experienceLevel}
                </span>
              )}
            </div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-white group-hover:text-brand-500 dark:group-hover:text-brand-400 transition-colors line-clamp-2 leading-snug">
              {job.title}
            </h3>
          </div>
          {/* Budget */}
          <div className="text-right shrink-0">
            <div className="flex items-center gap-1 text-brand-600 dark:text-brand-400 font-bold text-base whitespace-nowrap">
              <DollarSign className="w-4 h-4" />
              <span>{job.budgetType === 'hourly' ? `${job.budget?.min}–${job.budget?.max}/hr` : (job.budget?.max || job.budget?.min || job.budget)}</span>
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500 capitalize">{job.budgetType || 'fixed'}</p>
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">
          {job.description}
        </p>

        {/* Skills */}
        {visibleSkills.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {visibleSkills.map((skill) => (
              <span
                key={skill}
                className="px-2.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded-full font-medium hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-brand-900/20 dark:hover:text-brand-400 transition-colors"
              >
                {skill}
              </span>
            ))}
            {extraSkills > 0 && (
              <span className="px-2.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-xs rounded-full font-medium">
                +{extraSkills} more
              </span>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
            {/* Client */}
            <div className="flex items-center gap-1.5">
              {job.client?.avatar ? (
                <img src={job.client.avatar} alt={job.client.name} className="w-5 h-5 rounded-full object-cover" />
              ) : (
                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-[10px] font-bold">
                  {job.client?.name?.charAt(0)}
                </div>
              )}
              <span className="font-medium text-gray-700 dark:text-gray-300 truncate max-w-[80px]">
                {job.client?.name || 'Client'}
              </span>
              {job.client?.rating && (
                <span className="flex items-center gap-0.5 text-yellow-500">
                  <Star className="w-3 h-3 fill-current" />
                  <span>{job.client.rating.toFixed(1)}</span>
                </span>
              )}
            </div>

            {/* Separator */}
            <span className="text-gray-300 dark:text-gray-600">•</span>

            {/* Proposals */}
            <div className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              <span>{job.proposalCount || 0} proposals</span>
            </div>

            {/* Deadline */}
            {job.deadline && (
              <>
                <span className="text-gray-300 dark:text-gray-600">•</span>
                <div className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{new Date(job.deadline).toLocaleDateString()}</span>
                </div>
              </>
            )}
          </div>

          <div className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
            <Clock className="w-3.5 h-3.5" />
            <span>{formatTimeAgo(job.createdAt)}</span>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}

export default JobCard

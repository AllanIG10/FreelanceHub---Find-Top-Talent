import { Star } from 'lucide-react'
import { Link } from 'react-router-dom'

function StarRating({ rating, size = 14 }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={size}
          className={star <= Math.round(rating)
            ? 'text-yellow-400 fill-current'
            : 'text-gray-300 dark:text-gray-600'
          }
        />
      ))}
    </div>
  )
}

function ReviewCard({ review }) {
  const reviewer = review.reviewer || {}

  return (
    <div className="p-5 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link to={`/profile/${reviewer._id}`}>
            {reviewer.avatar ? (
              <img
                src={reviewer.avatar}
                alt={reviewer.name}
                className="w-10 h-10 rounded-full object-cover ring-2 ring-brand-500/20"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white font-bold">
                {reviewer.name?.charAt(0) || '?'}
              </div>
            )}
          </Link>
          <div>
            <Link
              to={`/profile/${reviewer._id}`}
              className="font-semibold text-gray-900 dark:text-white hover:text-brand-500 transition-colors text-sm"
            >
              {reviewer.name || 'Anonymous'}
            </Link>
            <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{reviewer.role || 'Client'}</p>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1">
          <StarRating rating={review.rating} />
          <span className="text-xs text-gray-400 dark:text-gray-500">
            {new Date(review.createdAt).toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' })}
          </span>
        </div>
      </div>

      {/* Comment */}
      <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{review.comment}</p>

      {/* Job reference */}
      {review.job && (
        <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
          <p className="text-xs text-gray-400 dark:text-gray-500">
            For: <Link to={`/jobs/${review.job._id}`} className="text-brand-500 hover:underline">{review.job.title}</Link>
          </p>
        </div>
      )}
    </div>
  )
}

export default ReviewCard

import { X } from 'lucide-react'

const variantClasses = {
  default: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600',
  green: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
  blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
  amber: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
  red: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
  purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400',
  brand: 'bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-400',
}

function SkillBadge({ skill, onRemove, variant = 'default', size = 'sm', clickable = false, onClick }) {
  const sizeClasses = size === 'sm' ? 'px-2.5 py-0.5 text-xs' : size === 'md' ? 'px-3 py-1 text-sm' : 'px-4 py-1.5 text-sm'

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium transition-colors ${variantClasses[variant] || variantClasses.default} ${sizeClasses} ${clickable ? 'cursor-pointer' : ''}`}
      onClick={clickable ? onClick : undefined}
    >
      {skill}
      {onRemove && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onRemove(skill) }}
          className="w-3.5 h-3.5 rounded-full flex items-center justify-center hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
        >
          <X className="w-2.5 h-2.5" />
        </button>
      )}
    </span>
  )
}

export default SkillBadge

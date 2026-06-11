import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

const colorVariants = {
  green: {
    bg: 'bg-green-50 dark:bg-green-900/20',
    icon: 'bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400',
    value: 'text-green-600 dark:text-green-400',
    gradient: 'from-green-50 to-white dark:from-green-900/20 dark:to-gray-800',
  },
  blue: {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    icon: 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400',
    value: 'text-blue-600 dark:text-blue-400',
    gradient: 'from-blue-50 to-white dark:from-blue-900/20 dark:to-gray-800',
  },
  amber: {
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    icon: 'bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400',
    value: 'text-amber-600 dark:text-amber-400',
    gradient: 'from-amber-50 to-white dark:from-amber-900/20 dark:to-gray-800',
  },
  red: {
    bg: 'bg-red-50 dark:bg-red-900/20',
    icon: 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400',
    value: 'text-red-600 dark:text-red-400',
    gradient: 'from-red-50 to-white dark:from-red-900/20 dark:to-gray-800',
  },
  purple: {
    bg: 'bg-purple-50 dark:bg-purple-900/20',
    icon: 'bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400',
    value: 'text-purple-600 dark:text-purple-400',
    gradient: 'from-purple-50 to-white dark:from-purple-900/20 dark:to-gray-800',
  },
}

function StatCard({ icon: Icon, label, value, trend, trendValue, color = 'green', prefix = '', suffix = '', index = 0 }) {
  const colors = colorVariants[color] || colorVariants.green

  const trendIcon = trend === 'up'
    ? <TrendingUp className="w-3.5 h-3.5" />
    : trend === 'down'
    ? <TrendingDown className="w-3.5 h-3.5" />
    : <Minus className="w-3.5 h-3.5" />

  const trendColor = trend === 'up'
    ? 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20'
    : trend === 'down'
    ? 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20'
    : 'text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/30'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
      className={`relative overflow-hidden rounded-2xl border border-gray-100 dark:border-gray-700 bg-gradient-to-br ${colors.gradient} p-5 shadow-card hover:shadow-card-hover transition-all duration-200`}
    >
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-24 h-24 opacity-5">
        <div className={`w-full h-full rounded-full ${colors.icon} blur-2xl`} />
      </div>

      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">{label}</p>
          <div className="flex items-baseline gap-1">
            {prefix && <span className="text-2xl font-bold text-gray-700 dark:text-gray-200">{prefix}</span>}
            <span className="text-3xl font-bold text-gray-900 dark:text-white">
              {typeof value === 'number' ? value.toLocaleString() : value}
            </span>
            {suffix && <span className="text-lg font-semibold text-gray-500 dark:text-gray-400">{suffix}</span>}
          </div>

          {/* Trend indicator */}
          {trendValue !== undefined && (
            <div className={`inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-full text-xs font-semibold ${trendColor}`}>
              {trendIcon}
              <span>{Math.abs(trendValue)}% vs last month</span>
            </div>
          )}
        </div>

        {/* Icon */}
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${colors.icon} shadow-inner-brand`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </motion.div>
  )
}

export default StatCard

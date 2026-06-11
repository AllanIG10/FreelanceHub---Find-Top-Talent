import {
  ResponsiveContainer, BarChart, Bar, LineChart, Line, PieChart, Pie,
  Cell, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from 'recharts'
import { useTheme } from '../context/ThemeContext'

const BRAND_COLORS = ['#14a800', '#1f57c3', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316']

const CustomTooltip = ({ active, payload, label, isDark }) => {
  if (active && payload && payload.length) {
    return (
      <div className={`px-3 py-2 rounded-xl shadow-xl border text-sm ${
        isDark
          ? 'bg-gray-800 border-gray-700 text-gray-100'
          : 'bg-white border-gray-200 text-gray-800'
      }`}>
        {label && <p className="font-semibold mb-1 text-xs text-gray-500">{label}</p>}
        {payload.map((entry, i) => (
          <p key={i} className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full inline-block" style={{ background: entry.color }} />
            <span className="font-medium">{entry.name}:</span>
            <span className="font-bold">{typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}</span>
          </p>
        ))}
      </div>
    )
  }
  return null
}

const CustomPieLegend = ({ payload }) => (
  <div className="flex flex-wrap justify-center gap-3 mt-2">
    {payload?.map((entry, i) => (
      <div key={i} className="flex items-center gap-1.5 text-xs">
        <span className="w-2.5 h-2.5 rounded-full" style={{ background: entry.color }} />
        <span className="text-gray-600 dark:text-gray-400">{entry.value}</span>
      </div>
    ))}
  </div>
)

function AnalyticsChart({ type = 'bar', data = [], title, dataKeys = [], height = 280, colors }) {
  const { isDark } = useTheme()
  const chartColors = colors || BRAND_COLORS
  const axisColor = isDark ? '#6b7280' : '#9ca3af'
  const gridColor = isDark ? '#374151' : '#f3f4f6'

  const commonAxisProps = {
    tick: { fill: axisColor, fontSize: 12, fontFamily: 'Inter' },
    axisLine: { stroke: gridColor },
    tickLine: false,
  }

  const commonGridProps = {
    strokeDasharray: '3 3',
    stroke: gridColor,
    vertical: false,
  }

  return (
    <div className="w-full">
      {title && (
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">{title}</h3>
      )}
      <ResponsiveContainer width="100%" height={height}>
        {type === 'bar' ? (
          <BarChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
            <CartesianGrid {...commonGridProps} />
            <XAxis dataKey="name" {...commonAxisProps} />
            <YAxis {...commonAxisProps} />
            <Tooltip content={<CustomTooltip isDark={isDark} />} />
            <Legend formatter={(v) => <span className="text-xs text-gray-600 dark:text-gray-400">{v}</span>} />
            {dataKeys.map((key, i) => (
              <Bar
                key={key.key}
                dataKey={key.key}
                name={key.label || key.key}
                fill={chartColors[i % chartColors.length]}
                radius={[4, 4, 0, 0]}
                maxBarSize={48}
              />
            ))}
          </BarChart>
        ) : type === 'line' ? (
          <LineChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
            <CartesianGrid {...commonGridProps} />
            <XAxis dataKey="name" {...commonAxisProps} />
            <YAxis {...commonAxisProps} />
            <Tooltip content={<CustomTooltip isDark={isDark} />} />
            <Legend formatter={(v) => <span className="text-xs text-gray-600 dark:text-gray-400">{v}</span>} />
            {dataKeys.map((key, i) => (
              <Line
                key={key.key}
                type="monotone"
                dataKey={key.key}
                name={key.label || key.key}
                stroke={chartColors[i % chartColors.length]}
                strokeWidth={2.5}
                dot={{ fill: chartColors[i % chartColors.length], r: 3, strokeWidth: 0 }}
                activeDot={{ r: 5, strokeWidth: 0 }}
              />
            ))}
          </LineChart>
        ) : type === 'area' ? (
          <AreaChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
            <defs>
              {dataKeys.map((key, i) => (
                <linearGradient key={key.key} id={`gradient-${key.key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={chartColors[i % chartColors.length]} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={chartColors[i % chartColors.length]} stopOpacity={0.02} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid {...commonGridProps} />
            <XAxis dataKey="name" {...commonAxisProps} />
            <YAxis {...commonAxisProps} />
            <Tooltip content={<CustomTooltip isDark={isDark} />} />
            <Legend formatter={(v) => <span className="text-xs text-gray-600 dark:text-gray-400">{v}</span>} />
            {dataKeys.map((key, i) => (
              <Area
                key={key.key}
                type="monotone"
                dataKey={key.key}
                name={key.label || key.key}
                stroke={chartColors[i % chartColors.length]}
                strokeWidth={2.5}
                fill={`url(#gradient-${key.key})`}
                dot={false}
                activeDot={{ r: 5, strokeWidth: 0 }}
              />
            ))}
          </AreaChart>
        ) : type === 'pie' ? (
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={height * 0.22}
              outerRadius={height * 0.38}
              paddingAngle={3}
              dataKey="value"
              label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
              labelLine={false}
            >
              {data.map((entry, i) => (
                <Cell key={`cell-${i}`} fill={chartColors[i % chartColors.length]} stroke="none" />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip isDark={isDark} />} />
            <Legend content={<CustomPieLegend />} />
          </PieChart>
        ) : (
          <BarChart data={data}>
            <Bar dataKey="value" fill={chartColors[0]} />
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  )
}

export default AnalyticsChart

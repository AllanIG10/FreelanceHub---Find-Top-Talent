import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, ChevronDown, X, SlidersHorizontal, RotateCcw, Check } from 'lucide-react'

const CATEGORIES = [
  'Web Development', 'Mobile Development', 'Design', 'Writing & Content',
  'Marketing', 'Data Science', 'Video & Animation', 'Music & Audio',
  'Business', 'Accounting', 'Legal', 'Engineering'
]

const SKILLS_SUGGESTIONS = [
  'React', 'Node.js', 'Python', 'TypeScript', 'Vue.js', 'Angular', 'Next.js',
  'Django', 'Laravel', 'Flutter', 'Swift', 'Kotlin', 'AWS', 'Docker',
  'Figma', 'Photoshop', 'MongoDB', 'PostgreSQL', 'GraphQL', 'REST API',
]

const EXPERIENCE_LEVELS = ['entry', 'intermediate', 'expert']
const JOB_TYPES = ['fixed', 'hourly']
const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'budget-high', label: 'Highest Budget' },
  { value: 'budget-low', label: 'Lowest Budget' },
  { value: 'most-proposals', label: 'Most Proposals' },
]

function FilterPanel({ filters, onChange, onReset, mobileOpen, onMobileToggle }) {
  const [skillInput, setSkillInput] = useState('')
  const [skillSuggestions, setSkillSuggestions] = useState([])

  const handleSkillInput = (val) => {
    setSkillInput(val)
    if (val.length > 0) {
      const matches = SKILLS_SUGGESTIONS.filter(s =>
        s.toLowerCase().includes(val.toLowerCase()) &&
        !filters.skills?.includes(s)
      )
      setSkillSuggestions(matches.slice(0, 5))
    } else {
      setSkillSuggestions([])
    }
  }

  const addSkill = (skill) => {
    if (!filters.skills?.includes(skill)) {
      onChange({ skills: [...(filters.skills || []), skill] })
    }
    setSkillInput('')
    setSkillSuggestions([])
  }

  const removeSkill = (skill) => {
    onChange({ skills: filters.skills?.filter(s => s !== skill) })
  }

  const toggleCategory = (cat) => {
    const cats = filters.categories || []
    onChange({
      categories: cats.includes(cat) ? cats.filter(c => c !== cat) : [...cats, cat]
    })
  }

  const toggleExperience = (level) => {
    const levels = filters.experienceLevels || []
    onChange({
      experienceLevels: levels.includes(level) ? levels.filter(l => l !== level) : [...levels, level]
    })
  }

  const content = (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-brand-500" />
          <h3 className="font-semibold text-gray-900 dark:text-white">Filters</h3>
        </div>
        <button
          onClick={onReset}
          className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-500 transition-colors"
        >
          <RotateCcw className="w-3 h-3" />
          Reset
        </button>
      </div>

      {/* Search */}
      <div>
        <label className="label-base">Search</label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Keywords..."
            value={filters.search || ''}
            onChange={(e) => onChange({ search: e.target.value })}
            className="input-base pl-10"
          />
        </div>
      </div>

      {/* Categories */}
      <div>
        <label className="label-base">Categories</label>
        <div className="space-y-1.5 max-h-48 overflow-y-auto">
          {CATEGORIES.map((cat) => {
            const selected = (filters.categories || []).includes(cat)
            return (
              <label key={cat} className="flex items-center gap-2.5 cursor-pointer group">
                <div
                  onClick={() => toggleCategory(cat)}
                  className={`w-4 h-4 rounded flex items-center justify-center border-2 transition-colors ${
                    selected
                      ? 'bg-brand-500 border-brand-500'
                      : 'border-gray-300 dark:border-gray-600 group-hover:border-brand-400'
                  }`}
                >
                  {selected && <Check className="w-3 h-3 text-white" />}
                </div>
                <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-brand-500 transition-colors">{cat}</span>
              </label>
            )
          })}
        </div>
      </div>

      {/* Budget Range */}
      <div>
        <label className="label-base">Budget Range</label>
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
            <input
              type="number"
              placeholder="Min"
              value={filters.budgetMin || ''}
              onChange={(e) => onChange({ budgetMin: e.target.value })}
              className="input-base pl-7 text-sm"
              min={0}
            />
          </div>
          <span className="text-gray-400 text-sm">–</span>
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
            <input
              type="number"
              placeholder="Max"
              value={filters.budgetMax || ''}
              onChange={(e) => onChange({ budgetMax: e.target.value })}
              className="input-base pl-7 text-sm"
              min={0}
            />
          </div>
        </div>
      </div>

      {/* Skills */}
      <div>
        <label className="label-base">Required Skills</label>
        {/* Selected skills */}
        {filters.skills?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {filters.skills.map((skill) => (
              <span
                key={skill}
                className="flex items-center gap-1 px-2 py-0.5 bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 text-xs rounded-full"
              >
                {skill}
                <button onClick={() => removeSkill(skill)} className="hover:text-red-500 transition-colors">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}
        {/* Skill input */}
        <div className="relative">
          <input
            type="text"
            placeholder="Add skills..."
            value={skillInput}
            onChange={(e) => handleSkillInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && skillInput.trim()) {
                addSkill(skillInput.trim())
              }
            }}
            className="input-base text-sm"
          />
          {/* Suggestions */}
          <AnimatePresence>
            {skillSuggestions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="absolute z-10 left-0 right-0 top-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl overflow-hidden"
              >
                {skillSuggestions.map((s) => (
                  <button
                    key={s}
                    onClick={() => addSkill(s)}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-brand-50 dark:hover:bg-brand-900/20 hover:text-brand-500 transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Experience Level */}
      <div>
        <label className="label-base">Experience Level</label>
        <div className="space-y-2">
          {EXPERIENCE_LEVELS.map((level) => {
            const selected = (filters.experienceLevels || []).includes(level)
            return (
              <label key={level} className="flex items-center gap-2.5 cursor-pointer group">
                <div
                  onClick={() => toggleExperience(level)}
                  className={`w-4 h-4 rounded flex items-center justify-center border-2 transition-colors ${
                    selected
                      ? 'bg-brand-500 border-brand-500'
                      : 'border-gray-300 dark:border-gray-600 group-hover:border-brand-400'
                  }`}
                >
                  {selected && <Check className="w-3 h-3 text-white" />}
                </div>
                <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">{level}</span>
              </label>
            )
          })}
        </div>
      </div>

      {/* Job Type */}
      <div>
        <label className="label-base">Job Type</label>
        <div className="flex gap-2">
          {JOB_TYPES.map((type) => {
            const selected = filters.jobType === type
            return (
              <button
                key={type}
                onClick={() => onChange({ jobType: selected ? '' : type })}
                className={`flex-1 py-2 text-sm font-medium rounded-lg border transition-colors capitalize ${
                  selected
                    ? 'bg-brand-500 text-white border-brand-500'
                    : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-brand-400 hover:text-brand-500'
                }`}
              >
                {type}
              </button>
            )
          })}
        </div>
      </div>

      {/* Sort By */}
      <div>
        <label className="label-base">Sort By</label>
        <div className="relative">
          <select
            value={filters.sort || 'newest'}
            onChange={(e) => onChange({ sort: e.target.value })}
            className="input-base pr-8 appearance-none cursor-pointer"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop */}
      <div className="hidden lg:block w-72 shrink-0">
        <div className="card p-5 sticky top-20">
          {content}
        </div>
      </div>

      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 bg-black/50 z-40"
              onClick={onMobileToggle}
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="lg:hidden fixed left-0 top-0 bottom-0 w-80 bg-white dark:bg-gray-900 z-50 overflow-y-auto p-5 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-gray-900 dark:text-white">Filter Jobs</h3>
                <button onClick={onMobileToggle} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              {content}
              <button
                onClick={onMobileToggle}
                className="w-full mt-6 btn-primary"
              >
                Apply Filters
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

export default FilterPanel

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, SlidersHorizontal, Grid, List, ChevronLeft, ChevronRight, Briefcase } from 'lucide-react'
import { jobsAPI } from '../services/api'
import JobCard from '../components/JobCard'
import FilterPanel from '../components/FilterPanel'

function JobCardSkeleton() {
  return (
    <div className="card p-5 space-y-3 animate-pulse">
      <div className="flex justify-between">
        <div className="space-y-2 flex-1">
          <div className="skeleton h-4 w-20 rounded-full" />
          <div className="skeleton h-5 w-3/4 rounded" />
        </div>
        <div className="skeleton h-8 w-24 rounded" />
      </div>
      <div className="skeleton h-4 w-full rounded" />
      <div className="skeleton h-4 w-2/3 rounded" />
      <div className="flex gap-2">
        {[1, 2, 3].map((i) => <div key={i} className="skeleton h-6 w-16 rounded-full" />)}
      </div>
      <div className="flex justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
        <div className="skeleton h-4 w-32 rounded" />
        <div className="skeleton h-4 w-20 rounded" />
      </div>
    </div>
  )
}

function JobList() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [totalJobs, setTotalJobs] = useState(0)
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false)
  const [viewMode, setViewMode] = useState('grid')

  const page = parseInt(searchParams.get('page') || '1')
  const LIMIT = 9

  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    categories: searchParams.get('category') ? [searchParams.get('category')] : [],
    skills: [],
    experienceLevels: [],
    jobType: '',
    budgetMin: '',
    budgetMax: '',
    sort: 'newest',
  })

  const fetchJobs = useCallback(async () => {
    setLoading(true)
    try {
      const params = {
        page,
        limit: LIMIT,
        sort: filters.sort,
        ...(filters.search && { search: filters.search }),
        ...(filters.categories?.length && { category: filters.categories.join(',') }),
        ...(filters.skills?.length && { skills: filters.skills.join(',') }),
        ...(filters.experienceLevels?.length && { experience: filters.experienceLevels.join(',') }),
        ...(filters.jobType && { type: filters.jobType }),
        ...(filters.budgetMin && { budgetMin: filters.budgetMin }),
        ...(filters.budgetMax && { budgetMax: filters.budgetMax }),
      }
      const res = await jobsAPI.getJobs(params)
      setJobs(Array.isArray(res) ? res : res.jobs || [])
      setTotalJobs(res.total || (Array.isArray(res) ? res.length : 0))
    } catch (err) {
      console.error('Failed to fetch jobs', err)
      setJobs([])
    } finally {
      setLoading(false)
    }
  }, [filters, page])

  useEffect(() => {
    fetchJobs()
  }, [fetchJobs])

  const handleFilterChange = (updates) => {
    setFilters(prev => ({ ...prev, ...updates }))
    setSearchParams(prev => { prev.set('page', '1'); return prev })
  }

  const handleReset = () => {
    setFilters({
      search: '', categories: [], skills: [], experienceLevels: [],
      jobType: '', budgetMin: '', budgetMax: '', sort: 'newest',
    })
    setSearchParams({})
  }

  const handleSearch = (e) => {
    e.preventDefault()
    fetchJobs()
  }

  const totalPages = Math.ceil(totalJobs / LIMIT)

  const handlePageChange = (newPage) => {
    setSearchParams(prev => { prev.set('page', newPage.toString()); return prev })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pt-20">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
        <div className="section-container py-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Browse Jobs</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                {loading ? 'Loading...' : `${totalJobs.toLocaleString()} jobs found`}
              </p>
            </div>
            <div className="sm:ml-auto flex items-center gap-3">
              {/* Mobile filter toggle */}
              <button
                onClick={() => setMobileFilterOpen(true)}
                className="lg:hidden flex items-center gap-2 px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:border-brand-400"
              >
                <SlidersHorizontal className="w-4 h-4" />
                Filters
              </button>
              {/* View mode */}
              <div className="flex items-center border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 transition-colors ${viewMode === 'grid' ? 'bg-brand-500 text-white' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 transition-colors ${viewMode === 'list' ? 'bg-brand-500 text-white' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Search bar */}
          <form onSubmit={handleSearch} className="flex gap-2 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search jobs, skills, keywords..."
                value={filters.search}
                onChange={(e) => handleFilterChange({ search: e.target.value })}
                className="input-base pl-10"
              />
            </div>
            <button type="submit" className="btn-primary px-6">Search</button>
          </form>
        </div>
      </div>

      {/* Body */}
      <div className="section-container py-8">
        <div className="flex gap-7">
          {/* Filters sidebar */}
          <FilterPanel
            filters={filters}
            onChange={handleFilterChange}
            onReset={handleReset}
            mobileOpen={mobileFilterOpen}
            onMobileToggle={() => setMobileFilterOpen(p => !p)}
          />

          {/* Jobs grid */}
          <div className="flex-1 min-w-0">
            {loading ? (
              <div className={`grid gap-5 ${viewMode === 'grid' ? 'sm:grid-cols-2' : 'grid-cols-1'}`}>
                {Array.from({ length: 6 }, (_, i) => <JobCardSkeleton key={i} />)}
              </div>
            ) : jobs.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-20 text-center"
              >
                <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                  <Briefcase className="w-10 h-10 text-gray-300 dark:text-gray-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">No jobs found</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4">Try adjusting your filters or search terms</p>
                <button onClick={handleReset} className="btn-outline">Clear All Filters</button>
              </motion.div>
            ) : (
              <>
                <div className={`grid gap-5 ${viewMode === 'grid' ? 'sm:grid-cols-2' : 'grid-cols-1'}`}>
                  <AnimatePresence>
                    {jobs.map((job, i) => <JobCard key={job._id} job={job} index={i} />)}
                  </AnimatePresence>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-10">
                    <button
                      onClick={() => handlePageChange(page - 1)}
                      disabled={page === 1}
                      className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-brand-400 hover:text-brand-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                      const p = i + 1
                      return (
                        <button
                          key={p}
                          onClick={() => handlePageChange(p)}
                          className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                            p === page
                              ? 'bg-brand-500 text-white shadow-brand'
                              : 'border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-brand-400 hover:text-brand-500'
                          }`}
                        >
                          {p}
                        </button>
                      )
                    })}
                    <button
                      onClick={() => handlePageChange(page + 1)}
                      disabled={page === totalPages}
                      className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-brand-400 hover:text-brand-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default JobList

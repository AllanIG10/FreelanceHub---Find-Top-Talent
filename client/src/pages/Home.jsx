import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Search, ArrowRight, Star, Users, Briefcase, DollarSign,
  CheckCircle, Zap, Shield, Globe, Code, Palette, PenTool,
  BarChart, Smartphone, Camera, Music, TrendingUp, ChevronRight
} from 'lucide-react'
import { jobsAPI } from '../services/api'
import JobCard from '../components/JobCard'
import { useAuth } from '../context/AuthContext'

const CATEGORIES = [
  { name: 'Web Development', icon: Code, color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400', count: '12.4K' },
  { name: 'Design & Creative', icon: Palette, color: 'bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400', count: '8.2K' },
  { name: 'Writing & Content', icon: PenTool, color: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400', count: '6.1K' },
  { name: 'Marketing', icon: BarChart, color: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400', count: '4.7K' },
  { name: 'Mobile Apps', icon: Smartphone, color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400', count: '3.9K' },
  { name: 'Video & Photo', icon: Camera, color: 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400', count: '2.8K' },
  { name: 'Music & Audio', icon: Music, color: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400', count: '1.5K' },
  { name: 'Data & Analytics', icon: TrendingUp, color: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400', count: '5.3K' },
]

const TESTIMONIALS = [
  {
    name: 'Sarah Johnson',
    role: 'Product Manager at TechCorp',
    avatar: 'https://i.pravatar.cc/150?img=1',
    rating: 5,
    text: 'FreelanceHub helped us find the perfect developer in just 2 days. The proposal system is incredible — we could compare candidates side by side.',
  },
  {
    name: 'Marcus Lee',
    role: 'Full-Stack Developer',
    avatar: 'https://i.pravatar.cc/150?img=2',
    rating: 5,
    text: 'As a freelancer, the AI proposal generator saved me hours. My acceptance rate went from 15% to 42% after I started using it!',
  },
  {
    name: 'Priya Sharma',
    role: 'Digital Marketing Director',
    avatar: 'https://i.pravatar.cc/150?img=5',
    rating: 5,
    text: 'We\'ve hired over 30 freelancers through FreelanceHub. The quality of talent and the ease of the platform is unmatched.',
  },
]

const HOW_IT_WORKS = [
  { step: '01', title: 'Post Your Job', desc: 'Create a detailed job post with your requirements, budget, and timeline. Our AI helps you write the perfect description.', icon: Briefcase, color: 'text-brand-500' },
  { step: '02', title: 'Review Proposals', desc: 'Receive and compare proposals from skilled freelancers. Filter by budget, rating, and experience to find the best match.', icon: Users, color: 'text-blue-500' },
  { step: '03', title: 'Hire & Collaborate', desc: 'Accept the best proposal, communicate via our built-in chat, and pay securely through our escrow system.', icon: CheckCircle, color: 'text-purple-500' },
]

function StarRating({ rating }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star key={s} className={`w-4 h-4 ${s <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />
      ))}
    </div>
  )
}

function Home() {
  const [searchQuery, setSearchQuery] = useState('')
  const [featuredJobs, setFeaturedJobs] = useState([])
  const [loadingJobs, setLoadingJobs] = useState(true)
  const { user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    jobsAPI.getJobs({ limit: 4, sort: 'newest' })
      .then((res) => {
        setFeaturedJobs(Array.isArray(res) ? res : res.jobs || [])
      })
      .catch(() => setFeaturedJobs([]))
      .finally(() => setLoadingJobs(false))
  }, [])

  const handleSearch = (e) => {
    e.preventDefault()
    navigate(`/jobs?search=${encodeURIComponent(searchQuery)}`)
  }

  return (
    <div className="min-h-screen">
      {/* ===== HERO SECTION ===== */}
      <section className="relative overflow-hidden hero-gradient pt-28 pb-24">
        {/* Background blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-brand-500/20 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full bg-blue-500/20 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-brand-400/5 blur-3xl" />
          {/* Grid pattern overlay */}
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
              backgroundSize: '60px 60px',
            }}
          />
        </div>

        <div className="section-container relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="text-center max-w-4xl mx-auto"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1, duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-white/90 text-sm font-medium mb-6"
            >
              <Zap className="w-4 h-4 text-yellow-400" />
              <span>AI-Powered Freelance Platform</span>
            </motion.div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white leading-tight mb-6">
              Find the Perfect
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-brand-300 to-yellow-300">
                Freelance Talent
              </span>
            </h1>

            <p className="text-xl text-white/70 max-w-2xl mx-auto mb-10 leading-relaxed">
              Connect with 500,000+ skilled freelancers worldwide. Post jobs, review AI-powered proposals, and hire the best talent — all in one platform.
            </p>

            {/* Search bar */}
            <motion.form
              onSubmit={handleSearch}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="flex items-center gap-2 max-w-xl mx-auto bg-white dark:bg-gray-800 rounded-2xl p-2 shadow-2xl mb-6"
            >
              <Search className="w-5 h-5 text-gray-400 ml-2 flex-shrink-0" />
              <input
                type="text"
                placeholder="Search for skills, jobs, or freelancers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none text-sm px-2 py-1"
              />
              <button type="submit" className="btn-primary rounded-xl whitespace-nowrap">
                Search Jobs
              </button>
            </motion.form>

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-3">
              {user?.role !== 'client' && (
                <Link to="/jobs/create" className="flex items-center gap-2 bg-white text-gray-900 font-semibold px-6 py-3 rounded-xl hover:bg-gray-100 transition-colors shadow-lg">
                  <Briefcase className="w-4 h-4" />
                  Post a Job
                </Link>
              )}
              <Link to="/jobs" className="flex items-center gap-2 bg-white/10 border border-white/20 text-white font-semibold px-6 py-3 rounded-xl hover:bg-white/20 transition-colors">
                Find Work
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Trust signals */}
            <div className="flex flex-wrap items-center justify-center gap-4 mt-8 text-white/60 text-sm">
              {['No hidden fees', 'Secure payments', '24/7 support', 'AI-powered matching'].map((t, i) => (
                <span key={i} className="flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-brand-400" />
                  {t}
                </span>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ===== STATS BAR ===== */}
      <section className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
        <div className="section-container py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-0 md:divide-x divide-gray-100 dark:divide-gray-800">
            {[
              { label: 'Active Freelancers', value: '500K+', icon: Users, color: 'text-brand-500' },
              { label: 'Happy Clients', value: '50K+', icon: Shield, color: 'text-blue-500' },
              { label: 'Total Paid Out', value: '$10M+', icon: DollarSign, color: 'text-green-500' },
              { label: 'Countries Served', value: '150+', icon: Globe, color: 'text-purple-500' },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex flex-col items-center text-center py-2"
              >
                <stat.icon className={`w-6 h-6 ${stat.color} mb-2`} />
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CATEGORIES ===== */}
      <section className="py-20 bg-gray-50 dark:bg-gray-950">
        <div className="section-container">
          <div className="text-center mb-12">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-4xl font-bold text-gray-900 dark:text-white mb-4"
            >
              Browse Top Categories
            </motion.h2>
            <p className="text-gray-500 dark:text-gray-400 text-lg">Find talent for any project in any industry</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {CATEGORIES.map((cat, i) => (
              <motion.div
                key={cat.name}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07 }}
                whileHover={{ y: -4 }}
              >
                <Link
                  to={`/jobs?category=${encodeURIComponent(cat.name)}`}
                  className="block p-5 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 hover:border-brand-300 dark:hover:border-brand-700 hover:shadow-lg transition-all duration-200 group"
                >
                  <div className={`w-12 h-12 rounded-xl ${cat.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                    <cat.icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-1">{cat.name}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{cat.count} jobs</p>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="section-container">
          <div className="text-center mb-14">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-4xl font-bold text-gray-900 dark:text-white mb-4"
            >
              How It Works
            </motion.h2>
            <p className="text-gray-500 dark:text-gray-400 text-lg">Get started in three simple steps</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connecting line */}
            <div className="hidden md:block absolute top-10 left-1/4 right-1/4 h-0.5 bg-gradient-to-r from-brand-200 via-blue-200 to-purple-200 dark:from-brand-900 dark:via-blue-900 dark:to-purple-900" />

            {HOW_IT_WORKS.map((step, i) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="relative text-center"
              >
                <div className="relative inline-block mb-5">
                  <div className="w-20 h-20 rounded-3xl bg-gray-50 dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 flex items-center justify-center mx-auto">
                    <step.icon className={`w-9 h-9 ${step.color}`} />
                  </div>
                  <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-brand-500 text-white text-xs font-bold flex items-center justify-center shadow-brand">
                    {i + 1}
                  </div>
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{step.title}</h3>
                <p className="text-gray-500 dark:text-gray-400 leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FEATURED JOBS ===== */}
      <section className="py-20 bg-gray-50 dark:bg-gray-950">
        <div className="section-container">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Featured Jobs</h2>
              <p className="text-gray-500 dark:text-gray-400">Latest opportunities from top clients</p>
            </div>
            <Link to="/jobs" className="flex items-center gap-1.5 text-brand-500 font-semibold hover:text-brand-600 transition-colors">
              View all <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {loadingJobs ? (
            <div className="grid sm:grid-cols-2 gap-5">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="card p-5 space-y-3">
                  <div className="skeleton h-4 w-3/4 rounded" />
                  <div className="skeleton h-3 w-full rounded" />
                  <div className="skeleton h-3 w-2/3 rounded" />
                  <div className="flex gap-2">
                    {[1, 2, 3].map((j) => <div key={j} className="skeleton h-6 w-16 rounded-full" />)}
                  </div>
                </div>
              ))}
            </div>
          ) : featuredJobs.length > 0 ? (
            <div className="grid sm:grid-cols-2 gap-5">
              {featuredJobs.map((job, i) => <JobCard key={job._id} job={job} index={i} />)}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-400 dark:text-gray-500">
              <Briefcase className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No featured jobs at the moment. Check back soon!</p>
            </div>
          )}
        </div>
      </section>

      {/* ===== TESTIMONIALS ===== */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="section-container">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">What People Say</h2>
            <p className="text-gray-500 dark:text-gray-400">Join thousands of satisfied clients and freelancers</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12 }}
                className="card p-6 space-y-4"
              >
                <StarRating rating={t.rating} />
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed italic">"{t.text}"</p>
                <div className="flex items-center gap-3 pt-2 border-t border-gray-100 dark:border-gray-700">
                  <img src={t.avatar} alt={t.name} className="w-11 h-11 rounded-full object-cover" />
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white text-sm">{t.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA SECTION ===== */}
      <section className="py-20 gradient-brand">
        <div className="section-container text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-brand-100 text-xl mb-8 max-w-xl mx-auto">
              Join over 500,000 freelancers and 50,000 clients on FreelanceHub today.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link to="/register" className="flex items-center gap-2 bg-white text-brand-600 font-bold px-8 py-4 rounded-xl hover:bg-brand-50 transition-colors shadow-lg text-lg">
                Get Started Free
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link to="/jobs" className="flex items-center gap-2 border-2 border-white/40 text-white font-semibold px-8 py-4 rounded-xl hover:bg-white/10 transition-colors text-lg">
                Browse Jobs
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="bg-gray-900 dark:bg-gray-950 text-gray-400 py-14">
        <div className="section-container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center">
                  <Briefcase className="w-4 h-4 text-white" />
                </div>
                <span className="font-bold text-white">FreelanceHub</span>
              </div>
              <p className="text-sm leading-relaxed">The #1 platform for connecting top freelancers with ambitious clients worldwide.</p>
            </div>

            {[
              { title: 'For Clients', links: ['Post a Job', 'Browse Talent', 'How it Works', 'Enterprise'] },
              { title: 'For Freelancers', links: ['Find Jobs', 'Create Profile', 'Proposal Tips', 'AI Tools'] },
              { title: 'Company', links: ['About Us', 'Blog', 'Press', 'Contact'] },
            ].map((col) => (
              <div key={col.title}>
                <h4 className="font-semibold text-white mb-4 text-sm">{col.title}</h4>
                <ul className="space-y-2">
                  {col.links.map((link) => (
                    <li key={link}>
                      <a href="#" className="text-sm hover:text-white transition-colors">{link}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="border-t border-gray-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm">
            <p>© {new Date().getFullYear()} AllanIG10--Allan Ignatius A. All rights reserved.</p>
            <div className="flex gap-4">
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-white transition-colors">Cookie Policy</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Home

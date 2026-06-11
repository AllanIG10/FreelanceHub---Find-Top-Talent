import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, DollarSign, Users, Clock, MapPin, Star, Share2, Bookmark, ChevronLeft, Briefcase, AlertCircle } from 'lucide-react';
import { jobsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import SkillBadge from '../components/SkillBadge';
import toast from 'react-hot-toast';

function formatBudget(budget) {
  if (!budget) return 'Negotiable';
  if (budget.type === 'hourly') return `$${budget.min} - $${budget.max}/hr`;
  return `$${budget.min?.toLocaleString()} - $${budget.max?.toLocaleString()}`;
}

function timeAgo(date) {
  const diff = Date.now() - new Date(date).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  return `${days} days ago`;
}

export default function JobDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const fetchJob = async () => {
      try {
        setLoading(true);
        const response = await jobsAPI.getJob(id);
        setJob(response.data.job);
      } catch (err) {
        if (err.response?.status === 404) setNotFound(true);
        else toast.error('Failed to load job details');
      } finally {
        setLoading(false);
      }
    };
    fetchJob();
  }, [id]);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Link copied to clipboard!');
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pt-24 animate-pulse">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8">
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4" />
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-6" />
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => <div key={i} className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full" />)}
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 h-56" />
          </div>
        </div>
      </div>
    </div>
  );

  if (notFound) return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pt-24 flex items-center justify-center">
      <div className="text-center">
        <AlertCircle size={48} className="text-gray-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Job Not Found</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-6">This job posting may have been removed or doesn't exist.</p>
        <Link to="/jobs" className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-xl font-medium transition-colors">
          Browse Jobs
        </Link>
      </div>
    </div>
  );

  const isOwner = user && job?.clientId?._id === user._id;
  const isFreelancer = user?.role === 'freelancer';
  const isClosed = job?.status === 'closed' || job?.status === 'completed';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pt-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back */}
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 mb-6 transition-colors text-sm">
          <ChevronLeft size={18} /> Back to Jobs
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-gray-800 rounded-2xl p-8 border border-gray-100 dark:border-gray-700">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${isClosed ? 'bg-gray-100 dark:bg-gray-700 text-gray-500' : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'}`}>
                      {job?.status?.charAt(0).toUpperCase() + job?.status?.slice(1)}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{job?.category}</span>
                  </div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white leading-tight">{job?.title}</h1>
                </div>
                <div className="flex gap-2 ml-4">
                  <button onClick={handleShare} className="p-2 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-500 hover:text-green-500 hover:border-green-300 transition-colors">
                    <Share2 size={18} />
                  </button>
                  <button className="p-2 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-500 hover:text-amber-500 hover:border-amber-300 transition-colors">
                    <Bookmark size={18} />
                  </button>
                </div>
              </div>

              {/* Meta */}
              <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400 mb-6 pb-6 border-b border-gray-100 dark:border-gray-700">
                <span className="flex items-center gap-1.5">
                  <Clock size={14} className="text-gray-400" />
                  Posted {timeAgo(job?.createdAt)}
                </span>
                <span className="flex items-center gap-1.5">
                  <Users size={14} className="text-gray-400" />
                  {job?.proposals || 0} proposals
                </span>
                <span className="flex items-center gap-1.5">
                  <Users size={14} className="text-gray-400" />
                  {job?.views || 0} views
                </span>
                {job?.experienceLevel && (
                  <span className="flex items-center gap-1.5">
                    <Star size={14} className="text-gray-400" />
                    {job.experienceLevel.charAt(0).toUpperCase() + job.experienceLevel.slice(1)} level
                  </span>
                )}
              </div>

              {/* Description */}
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Project Description</h2>
                <div className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line text-sm">
                  {job?.description}
                </div>
              </div>

              {/* Skills Required */}
              {job?.skills?.length > 0 && (
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Required Skills</h2>
                  <div className="flex flex-wrap gap-2">
                    {job.skills.map((skill) => <SkillBadge key={skill} skill={skill} />)}
                  </div>
                </div>
              )}

              {/* Attachments */}
              {job?.attachments?.length > 0 && (
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Attachments</h2>
                  <div className="flex flex-col gap-2">
                    {job.attachments.map((att, i) => (
                      <a key={i} href={att.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-green-500 hover:text-green-600 underline">
                        📎 {att.name || `Attachment ${i + 1}`}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>

            {/* Client Info */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">About the Client</h2>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  {job?.clientId?.name?.charAt(0)?.toUpperCase()}
                </div>
                <div className="flex-1">
                  <Link to={`/profile/${job?.clientId?._id}`} className="font-bold text-gray-900 dark:text-white hover:text-green-500 transition-colors">
                    {job?.clientId?.name}
                  </Link>
                  <div className="flex items-center gap-1 mt-1">
                    <Star size={14} className="fill-amber-400 text-amber-400" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {job?.clientId?.rating?.toFixed(1) || '5.0'} · {job?.clientId?.reviewCount || 0} reviews
                    </span>
                  </div>
                  {job?.clientId?.location && (
                    <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 mt-1">
                      <MapPin size={12} />
                      {job.clientId.location}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            {/* Budget & Apply Card */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 sticky top-24">
              <div className="mb-5">
                <div className="flex items-center gap-2 mb-1">
                  <DollarSign size={18} className="text-green-500" />
                  <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">Budget</span>
                </div>
                <p className="text-2xl font-bold text-green-500">{formatBudget(job?.budget)}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">{job?.budget?.type || 'Fixed'} price</p>
              </div>

              <div className="mb-5">
                <div className="flex items-center gap-2 mb-1">
                  <Calendar size={18} className="text-blue-500" />
                  <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">Deadline</span>
                </div>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {job?.deadline ? new Date(job.deadline).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'Open'}
                </p>
              </div>

              <div className="mb-6">
                <div className="flex items-center gap-2 mb-1">
                  <Briefcase size={18} className="text-purple-500" />
                  <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">Experience Level</span>
                </div>
                <p className="font-semibold text-gray-900 dark:text-white capitalize">{job?.experienceLevel || 'All levels'}</p>
              </div>

              {isFreelancer && !isClosed && (
                <Link
                  to={`/jobs/${id}/proposal`}
                  className="w-full block text-center bg-green-500 hover:bg-green-600 text-white py-3 rounded-xl font-bold transition-colors"
                >
                  Submit Proposal
                </Link>
              )}

              {isOwner && (
                <div className="space-y-2">
                  <Link to={`/jobs/${id}/proposals`} className="w-full block text-center bg-green-500 hover:bg-green-600 text-white py-3 rounded-xl font-bold transition-colors">
                    View {job?.proposals || 0} Proposals
                  </Link>
                  <Link to={`/jobs/${id}/edit`} className="w-full block text-center border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 py-3 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm">
                    Edit Job
                  </Link>
                </div>
              )}

              {!user && (
                <div className="text-center">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Sign in to submit a proposal</p>
                  <Link to="/login" className="w-full block text-center bg-green-500 hover:bg-green-600 text-white py-3 rounded-xl font-bold transition-colors">
                    Sign In to Apply
                  </Link>
                </div>
              )}

              {isClosed && (
                <div className="text-center py-3 bg-gray-100 dark:bg-gray-700 rounded-xl">
                  <p className="text-gray-500 dark:text-gray-400 font-medium text-sm">This job is no longer accepting proposals</p>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

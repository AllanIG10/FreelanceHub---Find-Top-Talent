import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Send, CheckCircle, Clock, DollarSign, Briefcase, Star, Zap, ChevronRight } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import StatCard from '../components/StatCard';
import AnalyticsChart from '../components/AnalyticsChart';
import ProposalCard from '../components/ProposalCard';
import AIProposalModal from '../components/AIProposalModal';
import { usersAPI, aiAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function FreelancerDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [showAIModal, setShowAIModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [statsRes, recRes] = await Promise.all([
          usersAPI.getDashboardStats(),
          aiAPI.recommendJobs({}).catch(() => ({ data: { data: [] } })),
        ]);
        setStats(statsRes.data?.stats || statsRes.stats || {});
        setRecommendations((recRes.data?.data || recRes.data || []).slice(0, 3));
      } catch {
        toast.error('Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Profile completeness calculation
  const profileFields = ['name', 'title', 'bio', 'skills', 'location', 'hourlyRate', 'portfolio', 'experience'];
  const completedFields = profileFields.filter((f) => {
    const v = user?.[f];
    return v && (Array.isArray(v) ? v.length > 0 : true);
  });
  const profileCompleteness = Math.round((completedFields.length / profileFields.length) * 100);

  const skeletonClass = 'bg-gray-200 dark:bg-gray-700 rounded animate-pulse';

  const proposalStatusData = [
    { name: 'Pending', value: stats?.pendingProposals || 0, fill: '#f59e0b' },
    { name: 'Shortlisted', value: stats?.shortlistedProposals || 0, fill: '#3b82f6' },
    { name: 'Accepted', value: stats?.acceptedProposals || 0, fill: '#10b981' },
    { name: 'Rejected', value: (stats?.totalProposals || 0) - (stats?.acceptedProposals || 0) - (stats?.pendingProposals || 0) - (stats?.shortlistedProposals || 0), fill: '#ef4444' },
  ].filter((d) => d.value > 0);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex">
      <Sidebar />
      <main className="flex-1 lg:ml-64 p-6 lg:p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Welcome back, {user?.name?.split(' ')[0]} 👋
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Here's what's happening with your proposals</p>
          </div>
          <button
            onClick={() => setShowAIModal(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white px-4 py-2.5 rounded-xl font-medium transition-all text-sm"
          >
            <Zap size={16} /> AI Tools
          </button>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          {loading ? (
            [...Array(4)].map((_, i) => <div key={i} className={`${skeletonClass} h-32`} />)
          ) : (
            <>
              <StatCard icon={Send} label="Total Proposals" value={stats?.totalProposals ?? 0} color="blue" trend="+3" />
              <StatCard icon={CheckCircle} label="Accepted" value={stats?.acceptedProposals ?? 0} color="green" trend="+1" />
              <StatCard icon={Clock} label="Pending" value={stats?.pendingProposals ?? 0} color="amber" />
              <StatCard icon={DollarSign} label="Total Earned" value={`$${(stats?.totalEarnings || 0).toLocaleString()}`} color="purple" trend="+12%" />
            </>
          )}
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          {/* Proposal Status Pie */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Proposal Breakdown</h2>
            {loading ? <div className={`${skeletonClass} h-48`} /> : proposalStatusData.length > 0 ? (
              <AnalyticsChart type="pie" data={proposalStatusData} />
            ) : (
              <div className="flex items-center justify-center h-48 text-gray-400 text-sm">No proposals yet</div>
            )}
          </div>

          {/* Profile Completeness */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Profile Completeness</h2>
            <div className="flex flex-col items-center justify-center h-40">
              <div className="relative w-28 h-28 mb-3">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="50" fill="none" stroke="#e5e7eb" className="dark:stroke-gray-700" strokeWidth="10" />
                  <circle cx="60" cy="60" r="50" fill="none" stroke="#14a800" strokeWidth="10"
                    strokeDasharray={`${2 * Math.PI * 50}`}
                    strokeDashoffset={`${2 * Math.PI * 50 * (1 - profileCompleteness / 100)}`}
                    strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold text-gray-900 dark:text-white">{profileCompleteness}%</span>
                </div>
              </div>
              <p className="text-gray-500 dark:text-gray-400 text-xs text-center">
                {profileCompleteness < 100 ? 'Complete your profile to attract more clients' : 'Profile is complete! 🎉'}
              </p>
              {profileCompleteness < 100 && (
                <Link to="/profile/edit" className="mt-2 text-xs text-green-500 hover:text-green-600 font-medium">Complete Profile →</Link>
              )}
            </div>
          </div>

          {/* Rating */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Your Rating</h2>
            <div className="flex flex-col items-center justify-center h-40">
              <div className="text-5xl font-bold text-amber-400 mb-2">
                {stats?.rating?.toFixed(1) || (user?.rating?.toFixed(1)) || '—'}
              </div>
              <div className="flex gap-1 mb-2">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} size={18} className={s <= Math.round(stats?.rating || user?.rating || 0) ? 'fill-amber-400 text-amber-400' : 'text-gray-200 dark:text-gray-700'} />
                ))}
              </div>
              <p className="text-gray-500 dark:text-gray-400 text-sm">{stats?.reviewCount || user?.reviewCount || 0} reviews</p>
            </div>
          </div>
        </div>

        {/* AI Job Recommendations */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 mb-6 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/10 dark:to-indigo-900/10">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center">
                <Zap size={14} className="text-white" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-gray-900 dark:text-white">AI Job Recommendations</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">Based on your skills</p>
              </div>
            </div>
            <Link to="/jobs" className="text-sm text-green-500 hover:text-green-600 font-medium flex items-center gap-1">
              Browse All <ChevronRight size={14} />
            </Link>
          </div>
          <div className="p-6">
            {loading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => <div key={i} className={`${skeletonClass} h-20`} />)}
              </div>
            ) : recommendations.length === 0 ? (
              <div className="text-center py-8">
                <Briefcase size={32} className="text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400 text-sm">Update your skills to get AI recommendations</p>
                <Link to="/profile/edit" className="mt-2 inline-block text-sm text-green-500 font-medium">Update Skills →</Link>
              </div>
            ) : (
              <div className="space-y-3">
                {recommendations.map((job) => (
                  <motion.div key={job._id} whileHover={{ x: 2 }} className="flex items-center justify-between p-4 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-green-200 dark:hover:border-green-800 transition-all">
                    <div className="flex-1">
                      <Link to={`/jobs/${job._id}`} className="font-medium text-gray-900 dark:text-white hover:text-green-500 transition-colors text-sm">
                        {job.title}
                      </Link>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 dark:text-gray-400">
                        <span className="text-green-500 font-medium">
                          ${job.budget?.min?.toLocaleString()} - ${job.budget?.max?.toLocaleString()}
                        </span>
                        <span>{job.proposals || 0} proposals</span>
                        {job.matchScore && (
                          <span className="bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 px-2 py-0.5 rounded-full">
                            {job.matchScore}% match
                          </span>
                        )}
                      </div>
                    </div>
                    <Link to={`/jobs/${job._id}/proposal`} className="ml-4 text-xs bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap">
                      Apply
                    </Link>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Proposals */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">Recent Proposals</h2>
            <Link to="/proposals" className="text-sm text-green-500 hover:text-green-600 font-medium flex items-center gap-1">
              View All <ChevronRight size={14} />
            </Link>
          </div>
          <div className="p-6">
            {loading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => <div key={i} className={`${skeletonClass} h-24`} />)}
              </div>
            ) : (stats?.recentProposals || []).length === 0 ? (
              <div className="text-center py-8">
                <Send size={32} className="text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400 text-sm">No proposals submitted yet</p>
                <Link to="/jobs" className="mt-2 inline-block text-sm text-green-500 font-medium">Browse Jobs →</Link>
              </div>
            ) : (
              <div className="space-y-4">
                {(stats?.recentProposals || []).map((proposal) => (
                  <ProposalCard key={proposal._id} proposal={proposal} isClientView={false} />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {showAIModal && (
        <AIProposalModal
          jobData={{ title: 'General Proposal', description: 'Practice writing a proposal' }}
          onClose={() => setShowAIModal(false)}
          onUse={() => setShowAIModal(false)}
        />
      )}
    </div>
  );
}

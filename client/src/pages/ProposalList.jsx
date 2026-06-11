import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, Users, CheckCircle, Star, DollarSign } from 'lucide-react';
import ProposalCard from '../components/ProposalCard';
import { jobsAPI, proposalsAPI } from '../services/api';
import toast from 'react-hot-toast';

const STATUS_TABS = ['all', 'pending', 'shortlisted', 'accepted', 'rejected'];

export default function ProposalList() {
  const { id: jobId } = useParams();
  const [job, setJob] = useState(null);
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeStatus, setActiveStatus] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [jobRes, propRes] = await Promise.all([
          jobsAPI.getJob(jobId),
          jobsAPI.getJobProposals(jobId),
        ]);
        setJob(jobRes.data?.job || jobRes.job);
        setProposals(propRes.data?.proposals || propRes.proposals || []);
      } catch {
        toast.error('Failed to load proposals');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [jobId]);

  const handleStatusChange = async (proposalId, status) => {
    setUpdatingId(proposalId);
    try {
      await proposalsAPI.updateProposalStatus(proposalId, status);
      setProposals((prev) => prev.map((p) => p._id === proposalId ? { ...p, status } : p));
      toast.success(`Proposal ${status}`);
    } catch {
      toast.error('Failed to update proposal status');
    } finally {
      setUpdatingId(null);
    }
  };

  const counts = STATUS_TABS.reduce((acc, s) => {
    acc[s] = s === 'all' ? proposals.length : proposals.filter((p) => p.status === s).length;
    return acc;
  }, {});

  const filtered = (activeStatus === 'all' ? proposals : proposals.filter((p) => p.status === activeStatus))
    .slice()
    .sort((a, b) => {
      if (sortBy === 'bid_low') return a.bidAmount - b.bidAmount;
      if (sortBy === 'bid_high') return b.bidAmount - a.bidAmount;
      if (sortBy === 'days') return a.estimatedDays - b.estimatedDays;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

  const statusTabColors = {
    all: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
    pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    shortlisted: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    accepted: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    rejected: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pt-20 pb-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back */}
        <Link to="/dashboard/client" className="flex items-center gap-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 mb-6 text-sm transition-colors">
          <ChevronLeft size={18} /> Back to Dashboard
        </Link>

        {/* Job Summary */}
        {job && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 mb-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium mb-1">Reviewing proposals for</p>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">{job.title}</h1>
              </div>
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${job.status === 'open' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-600'}`}>
                {job.status}
              </span>
            </div>
            <div className="flex flex-wrap gap-4 mt-3 text-sm">
              <span className="flex items-center gap-1.5 text-green-500 font-semibold">
                <DollarSign size={14} /> ${job.budget?.min?.toLocaleString()} - ${job.budget?.max?.toLocaleString()}
              </span>
              <span className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                <Users size={14} /> {proposals.length} total proposals
              </span>
              <span className="flex items-center gap-1.5 text-blue-500">
                <Star size={14} /> {counts.shortlisted} shortlisted
              </span>
              <span className="flex items-center gap-1.5 text-green-500">
                <CheckCircle size={14} /> {counts.accepted} accepted
              </span>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="flex gap-2 overflow-x-auto pb-1 flex-1">
            {STATUS_TABS.map((s) => (
              <button
                key={s}
                onClick={() => setActiveStatus(s)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${activeStatus === s ? statusTabColors[s] : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300'}`}
              >
                <span className="capitalize">{s}</span>
                <span className="bg-black/10 dark:bg-white/10 text-xs px-1.5 py-0.5 rounded-full">{counts[s]}</span>
              </button>
            ))}
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 self-start"
          >
            <option value="newest">Newest First</option>
            <option value="bid_low">Bid: Low to High</option>
            <option value="bid_high">Bid: High to Low</option>
            <option value="days">Fastest Delivery</option>
          </select>
        </div>

        {/* Proposals */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 animate-pulse">
                <div className="flex gap-4 mb-4">
                  <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
                  </div>
                </div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users size={28} className="text-gray-300 dark:text-gray-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {activeStatus === 'all' ? 'No proposals yet' : `No ${activeStatus} proposals`}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              {activeStatus === 'all' ? 'Proposals will appear here when freelancers apply' : `No proposals with "${activeStatus}" status`}
            </p>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {filtered.map((proposal, index) => (
              <motion.div key={proposal._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
                <ProposalCard
                  proposal={proposal}
                  isClientView={true}
                  onStatusChange={(status) => handleStatusChange(proposal._id, status)}
                  loading={updatingId === proposal._id}
                />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

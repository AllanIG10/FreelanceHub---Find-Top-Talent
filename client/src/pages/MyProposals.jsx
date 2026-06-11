import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, Clock, CheckCircle, XCircle, Star, Filter } from 'lucide-react';
import { Link } from 'react-router-dom';
import ProposalCard from '../components/ProposalCard';
import { proposalsAPI } from '../services/api';
import toast from 'react-hot-toast';

const STATUS_TABS = ['all', 'pending', 'shortlisted', 'accepted', 'rejected'];

const statusIcons = { pending: Clock, shortlisted: Star, accepted: CheckCircle, rejected: XCircle };
const statusColors = {
  all: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  shortlisted: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  accepted: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  rejected: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

export default function MyProposals() {
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeStatus, setActiveStatus] = useState('all');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await proposalsAPI.getMyProposals();
        setProposals(res.data?.proposals || res.proposals || []);
      } catch {
        toast.error('Failed to load proposals');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleWithdraw = async (proposalId) => {
    if (!window.confirm('Withdraw this proposal?')) return;
    try {
      await proposalsAPI.withdrawProposal(proposalId);
      setProposals((prev) => prev.filter((p) => p._id !== proposalId));
      toast.success('Proposal withdrawn');
    } catch {
      toast.error('Failed to withdraw proposal');
    }
  };

  const counts = STATUS_TABS.reduce((acc, status) => {
    acc[status] = status === 'all' ? proposals.length : proposals.filter((p) => p.status === status).length;
    return acc;
  }, {});

  const filtered = activeStatus === 'all' ? proposals : proposals.filter((p) => p.status === activeStatus);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pt-20 pb-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Proposals</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Track all your submitted proposals</p>
          </div>
          <Link to="/jobs" className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2.5 rounded-xl font-medium text-sm transition-colors">
            <Send size={15} /> Find Jobs
          </Link>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {['pending', 'shortlisted', 'accepted', 'rejected'].map((status) => {
            const Icon = statusIcons[status];
            return (
              <div key={status} className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700 text-center">
                <Icon size={20} className={`mx-auto mb-1 ${status === 'pending' ? 'text-amber-500' : status === 'shortlisted' ? 'text-blue-500' : status === 'accepted' ? 'text-green-500' : 'text-red-500'}`} />
                <p className="text-xl font-bold text-gray-900 dark:text-white">{counts[status]}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{status}</p>
              </div>
            );
          })}
        </div>

        {/* Status Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          {STATUS_TABS.map((status) => (
            <button
              key={status}
              onClick={() => setActiveStatus(status)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${activeStatus === status ? statusColors[status] : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300'}`}
            >
              <span className="capitalize">{status}</span>
              <span className="bg-black/10 dark:bg-white/10 text-xs px-1.5 py-0.5 rounded-full">{counts[status]}</span>
            </button>
          ))}
        </div>

        {/* Proposals */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 animate-pulse">
                <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-3" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Send size={28} className="text-gray-300 dark:text-gray-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {activeStatus === 'all' ? 'No proposals yet' : `No ${activeStatus} proposals`}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">
              {activeStatus === 'all' ? 'Browse jobs and submit your first proposal' : `You don't have any ${activeStatus} proposals`}
            </p>
            <Link to="/jobs" className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-5 py-2.5 rounded-xl font-medium text-sm transition-colors">
              Browse Jobs
            </Link>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {filtered.map((proposal, index) => (
              <motion.div key={proposal._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
                <ProposalCard
                  proposal={proposal}
                  isClientView={false}
                  onWithdraw={proposal.status === 'pending' ? () => handleWithdraw(proposal._id) : undefined}
                />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Briefcase, Users, CheckCircle, TrendingUp, Plus, Eye, Clock, MoreVertical, Trash2, Edit } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import StatCard from '../components/StatCard';
import AnalyticsChart from '../components/AnalyticsChart';
import { usersAPI, jobsAPI, proposalsAPI } from '../services/api';
import toast from 'react-hot-toast';

function JobRow({ job, onDelete }) {
  const statusColors = {
    open: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    closed: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
    'in-progress': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    completed: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  };
  return (
    <tr className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
      <td className="py-3 px-4">
        <Link to={`/jobs/${job._id}`} className="font-medium text-gray-900 dark:text-white hover:text-green-500 transition-colors text-sm line-clamp-1">
          {job.title}
        </Link>
      </td>
      <td className="py-3 px-4">
        <span className={`text-xs font-medium px-2 py-1 rounded-full ${statusColors[job.status] || statusColors.open}`}>
          {job.status}
        </span>
      </td>
      <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">{job.proposals || 0}</td>
      <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
        {new Date(job.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
      </td>
      <td className="py-3 px-4">
        <div className="flex items-center gap-2">
          <Link to={`/jobs/${job._id}/proposals`} className="text-xs text-blue-500 hover:text-blue-600 font-medium">Proposals</Link>
          <Link to={`/jobs/${job._id}/edit`} className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
            <Edit size={14} />
          </Link>
          <button onClick={() => onDelete(job._id)} className="p-1 text-gray-400 hover:text-red-500 transition-colors">
            <Trash2 size={14} />
          </button>
        </div>
      </td>
    </tr>
  );
}

export default function ClientDashboard() {
  const [stats, setStats] = useState(null);
  const [recentJobs, setRecentJobs] = useState([]);
  const [recentProposals, setRecentProposals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [statsRes, jobsRes] = await Promise.all([
          usersAPI.getDashboardStats(),
          jobsAPI.getClientJobs(),
        ]);
        setStats(statsRes.data?.stats || statsRes.stats || {});
        const jobs = jobsRes.data?.jobs || jobsRes.jobs || [];
        setRecentJobs(jobs.slice(0, 5));

        // Fetch proposals for first job if available
        if (jobs.length > 0) {
          try {
            const propRes = await jobsAPI.getJobProposals(jobs[0]._id);
            setRecentProposals((propRes.data?.proposals || propRes.proposals || []).slice(0, 5));
          } catch { /* ignore */ }
        }
      } catch (err) {
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleDeleteJob = async (jobId) => {
    if (!window.confirm('Delete this job posting?')) return;
    try {
      await jobsAPI.deleteJob(jobId);
      setRecentJobs((prev) => prev.filter((j) => j._id !== jobId));
      toast.success('Job deleted');
    } catch {
      toast.error('Failed to delete job');
    }
  };

  const proposalStatusData = [
    { name: 'Pending', value: stats?.totalProposalsReceived - stats?.acceptedProposals || 0, fill: '#f59e0b' },
    { name: 'Accepted', value: stats?.acceptedProposals || 0, fill: '#10b981' },
  ];

  const skeletonClass = 'bg-gray-200 dark:bg-gray-700 rounded animate-pulse';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex">
      <Sidebar />
      <main className="flex-1 lg:ml-64 p-6 lg:p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Client Dashboard</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Manage your jobs and proposals</p>
          </div>
          <Link to="/jobs/create" className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2.5 rounded-xl font-medium transition-colors text-sm">
            <Plus size={16} /> Post Job
          </Link>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          {loading ? (
            [...Array(4)].map((_, i) => <div key={i} className={`${skeletonClass} h-32`} />)
          ) : (
            <>
              <StatCard icon={Briefcase} label="Jobs Posted" value={stats?.totalJobs ?? 0} color="blue" trend="+12%" />
              <StatCard icon={Users} label="Proposals Received" value={stats?.totalProposalsReceived ?? 0} color="amber" trend="+8%" />
              <StatCard icon={CheckCircle} label="Hired" value={stats?.acceptedProposals ?? 0} color="green" trend="+5%" />
              <StatCard icon={TrendingUp} label="Active Jobs" value={stats?.activeJobs ?? 0} color="purple" />
            </>
          )}
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          {/* Proposal Status Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Proposal Status</h2>
            {loading ? <div className={`${skeletonClass} h-48`} /> : (
              <AnalyticsChart type="pie" data={proposalStatusData} />
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
            <div className="space-y-3">
              {[
                { label: 'Post a New Job', to: '/jobs/create', icon: Plus, color: 'green' },
                { label: 'Browse Freelancers', to: '/jobs', icon: Users, color: 'blue' },
                { label: 'View All Jobs', to: '/jobs', icon: Briefcase, color: 'purple' },
                { label: 'Messages', to: '/messages', icon: Clock, color: 'amber' },
              ].map((action) => (
                <Link key={action.label} to={action.to} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group">
                  <div className={`w-9 h-9 rounded-lg bg-${action.color}-100 dark:bg-${action.color}-900/30 flex items-center justify-center group-hover:scale-105 transition-transform`}>
                    <action.icon size={16} className={`text-${action.color}-500`} />
                  </div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{action.label}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Acceptance Rate */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Hiring Rate</h2>
            {loading ? <div className={`${skeletonClass} h-48`} /> : (
              <div className="flex flex-col items-center justify-center h-40">
                <div className="text-5xl font-bold text-green-500 mb-2">{stats?.acceptanceRate ?? 0}%</div>
                <p className="text-gray-500 dark:text-gray-400 text-sm text-center">of proposals result in a hire</p>
                <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2 mt-4">
                  <div className="bg-green-500 h-2 rounded-full transition-all" style={{ width: `${stats?.acceptanceRate ?? 0}%` }} />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Recent Jobs Table */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">Recent Jobs</h2>
            <Link to="/jobs" className="text-sm text-green-500 hover:text-green-600 font-medium flex items-center gap-1">
              <Eye size={14} /> View All
            </Link>
          </div>
          {loading ? (
            <div className="p-6 space-y-3">
              {[...Array(4)].map((_, i) => <div key={i} className={`${skeletonClass} h-10`} />)}
            </div>
          ) : recentJobs.length === 0 ? (
            <div className="text-center py-12">
              <Briefcase size={32} className="text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400 text-sm">No jobs posted yet</p>
              <Link to="/jobs/create" className="mt-3 inline-block text-sm text-green-500 hover:text-green-600 font-medium">Post your first job →</Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide border-b border-gray-100 dark:border-gray-700">
                    {['Title', 'Status', 'Proposals', 'Posted', 'Actions'].map((h) => (
                      <th key={h} className="py-3 px-4">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recentJobs.map((job) => <JobRow key={job._id} job={job} onDelete={handleDeleteJob} />)}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { ChevronLeft, Plus, X, Zap, DollarSign, Calendar, Clock } from 'lucide-react';
import { jobsAPI, proposalsAPI, aiAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import AIProposalModal from '../components/AIProposalModal';
import toast from 'react-hot-toast';

export default function SubmitProposal() {
  const { id: jobId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [portfolioLinks, setPortfolioLinks] = useState(['']);
  const [charCount, setCharCount] = useState(0);

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm();
  const coverLetter = watch('coverLetter', '');

  useEffect(() => { setCharCount(coverLetter?.length || 0); }, [coverLetter]);

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const res = await jobsAPI.getJob(jobId);
        setJob(res.data?.job || res.job);
      } catch {
        toast.error('Failed to load job details');
        navigate('/jobs');
      } finally {
        setLoading(false);
      }
    };
    fetchJob();
  }, [jobId, navigate]);

  const addPortfolioLink = () => setPortfolioLinks((prev) => [...prev, '']);
  const updatePortfolioLink = (index, value) => {
    setPortfolioLinks((prev) => { const updated = [...prev]; updated[index] = value; return updated; });
  };
  const removePortfolioLink = (index) => setPortfolioLinks((prev) => prev.filter((_, i) => i !== index));

  const handleUseAIProposal = (proposal) => {
    setValue('coverLetter', proposal.coverLetter);
    setValue('bidAmount', proposal.suggestedBid);
    setValue('estimatedDays', proposal.estimatedDays);
    setShowAI(false);
    toast.success('AI proposal applied!');
  };

  const onSubmit = async (data) => {
    const validLinks = portfolioLinks.filter((l) => l.trim());
    setSubmitting(true);
    try {
      await proposalsAPI.submitProposal({
        jobId,
        coverLetter: data.coverLetter,
        bidAmount: Number(data.bidAmount),
        estimatedDays: Number(data.estimatedDays),
        portfolioLinks: validLinks,
      });
      toast.success('Proposal submitted successfully! 🎉');
      navigate('/proposals');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit proposal');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pt-24 flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pt-20 pb-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 mb-6 text-sm transition-colors">
          <ChevronLeft size={18} /> Back to Job
        </button>

        {/* Job Summary Card */}
        {job && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 mb-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium mb-1">Applying to</p>
                <Link to={`/jobs/${jobId}`} className="text-lg font-bold text-gray-900 dark:text-white hover:text-green-500 transition-colors">
                  {job.title}
                </Link>
              </div>
            </div>
            <div className="flex flex-wrap gap-4 mt-3 text-sm">
              <span className="flex items-center gap-1.5 text-green-500 font-semibold">
                <DollarSign size={14} />
                ${job.budget?.min?.toLocaleString()} - ${job.budget?.max?.toLocaleString()}
              </span>
              {job.deadline && (
                <span className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                  <Calendar size={14} />
                  Due {new Date(job.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              )}
              <span className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                <Clock size={14} />
                {job.proposals || 0} proposals submitted
              </span>
            </div>
          </div>
        )}

        {/* Proposal Form */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="flex items-center justify-between px-8 py-5 border-b border-gray-100 dark:border-gray-700">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Write Your Proposal</h1>
            <button
              type="button"
              onClick={() => setShowAI(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white px-4 py-2 rounded-xl font-medium text-sm transition-all"
            >
              <Zap size={14} /> AI Generate
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-6">
            {/* Cover Letter */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Cover Letter <span className="text-red-500">*</span></label>
                <span className={`text-xs ${charCount < 100 ? 'text-red-400' : 'text-gray-400 dark:text-gray-500'}`}>
                  {charCount} / 2000
                </span>
              </div>
              <textarea
                {...register('coverLetter', {
                  required: 'Cover letter is required',
                  minLength: { value: 100, message: 'Write at least 100 characters' },
                  maxLength: { value: 2000, message: 'Maximum 2000 characters' },
                })}
                rows={10}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 transition-all resize-none text-sm leading-relaxed"
                placeholder="Introduce yourself and explain why you're the perfect fit for this project. Highlight relevant experience, your approach to the project, and why you're excited about this opportunity..."
              />
              {errors.coverLetter && <p className="text-red-500 text-xs mt-1">{errors.coverLetter.message}</p>}
            </div>

            {/* Bid & Timeline */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Your Bid ($) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <DollarSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="number"
                    {...register('bidAmount', { required: 'Bid amount is required', min: { value: 1, message: 'Must be at least $1' } })}
                    className="w-full pl-9 pr-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
                    placeholder={job?.budget?.min || '500'}
                  />
                </div>
                {errors.bidAmount && <p className="text-red-500 text-xs mt-1">{errors.bidAmount.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Delivery Time (days) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Clock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="number"
                    {...register('estimatedDays', { required: 'Estimated days is required', min: { value: 1, message: 'At least 1 day' } })}
                    className="w-full pl-9 pr-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
                    placeholder="14"
                  />
                </div>
                {errors.estimatedDays && <p className="text-red-500 text-xs mt-1">{errors.estimatedDays.message}</p>}
              </div>
            </div>

            {/* Portfolio Links */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Portfolio Links</label>
                <button type="button" onClick={addPortfolioLink} className="flex items-center gap-1 text-xs text-green-500 hover:text-green-600 font-medium">
                  <Plus size={13} /> Add Link
                </button>
              </div>
              <div className="space-y-2">
                {portfolioLinks.map((link, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="url"
                      value={link}
                      onChange={(e) => updatePortfolioLink(index, e.target.value)}
                      className="flex-1 px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 text-sm transition-all"
                      placeholder="https://github.com/yourusername/project"
                    />
                    {portfolioLinks.length > 1 && (
                      <button type="button" onClick={() => removePortfolioLink(index)} className="p-2.5 text-gray-400 hover:text-red-500 transition-colors">
                        <X size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Submit */}
            <div className="flex gap-3 pt-2 border-t border-gray-100 dark:border-gray-700">
              <button type="button" onClick={() => navigate(-1)} className="flex-1 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 py-3 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white py-3 rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
              >
                {submitting ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Submit Proposal 🚀'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>

      {showAI && job && (
        <AIProposalModal
          jobData={{ title: job.title, description: job.description, budget: job.budget }}
          onClose={() => setShowAI(false)}
          onUse={handleUseAIProposal}
        />
      )}
    </div>
  );
}

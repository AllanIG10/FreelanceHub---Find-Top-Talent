import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { ChevronLeft, Plus, X, Briefcase } from 'lucide-react';
import { jobsAPI } from '../services/api';
import toast from 'react-hot-toast';

const CATEGORIES = ['Web Development', 'Mobile Development', 'UI/UX Design', 'Content Writing', 'Digital Marketing', 'Data Science', 'DevOps & Cloud', 'Cybersecurity', 'Video & Animation', 'Other'];
const EXPERIENCE_LEVELS = ['entry', 'intermediate', 'expert'];

export default function JobCreate() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const [skills, setSkills] = useState([]);
  const [skillInput, setSkillInput] = useState('');
  const [budgetType, setBudgetType] = useState('fixed');
  const [loading, setLoading] = useState(false);
  const [fetchingJob, setFetchingJob] = useState(isEdit);

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm({
    defaultValues: { experienceLevel: 'intermediate' },
  });

  useEffect(() => {
    if (!isEdit) return;
    const load = async () => {
      try {
        const res = await jobsAPI.getJob(id);
        const job = res.data?.job || res.job;
        if (job) {
          setValue('title', job.title);
          setValue('description', job.description);
          setValue('category', job.category);
          setValue('budgetMin', job.budget?.min);
          setValue('budgetMax', job.budget?.max);
          setValue('deadline', job.deadline ? new Date(job.deadline).toISOString().split('T')[0] : '');
          setValue('experienceLevel', job.experienceLevel || 'intermediate');
          setBudgetType(job.budget?.type || 'fixed');
          setSkills(job.skills || []);
        }
      } catch {
        toast.error('Failed to load job');
      } finally {
        setFetchingJob(false);
      }
    };
    load();
  }, [id, isEdit, setValue]);

  const addSkill = () => {
    const trimmed = skillInput.trim();
    if (trimmed && !skills.includes(trimmed)) {
      setSkills((prev) => [...prev, trimmed]);
      setSkillInput('');
    }
  };

  const removeSkill = (skill) => setSkills((prev) => prev.filter((s) => s !== skill));

  const onSubmit = async (data) => {
    if (skills.length === 0) { toast.error('Add at least one required skill'); return; }
    setLoading(true);
    try {
      const payload = {
        title: data.title,
        description: data.description,
        category: data.category,
        budget: { type: budgetType, min: Number(data.budgetMin), max: Number(data.budgetMax) },
        deadline: data.deadline || undefined,
        experienceLevel: data.experienceLevel,
        skills,
      };
      if (isEdit) {
        await jobsAPI.updateJob(id, payload);
        toast.success('Job updated successfully!');
      } else {
        await jobsAPI.createJob(payload);
        toast.success('Job posted successfully!');
      }
      navigate('/dashboard/client');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save job');
    } finally {
      setLoading(false);
    }
  };

  if (fetchingJob) return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center pt-20">
      <div className="w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pt-20 pb-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 mb-6 text-sm transition-colors">
          <ChevronLeft size={18} /> Back
        </button>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-8 py-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <Briefcase size={20} className="text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">{isEdit ? 'Edit Job Posting' : 'Post a New Job'}</h1>
                <p className="text-green-100 text-sm">Find the perfect freelancer for your project</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Job Title <span className="text-red-500">*</span></label>
              <input
                type="text"
                {...register('title', { required: 'Title is required', minLength: { value: 10, message: 'At least 10 characters' } })}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
                placeholder="e.g. Full-Stack React Developer Needed for E-commerce Platform"
              />
              {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Category <span className="text-red-500">*</span></label>
              <select
                {...register('category', { required: 'Category is required' })}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
              >
                <option value="">Select a category</option>
                {CATEGORIES.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
              </select>
              {errors.category && <p className="text-red-500 text-xs mt-1">{errors.category.message}</p>}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Project Description <span className="text-red-500">*</span>
                <span className="text-gray-400 font-normal ml-1 text-xs">(min 100 characters)</span>
              </label>
              <textarea
                {...register('description', { required: 'Description is required', minLength: { value: 100, message: 'At least 100 characters required' } })}
                rows={6}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 transition-all resize-none"
                placeholder="Describe your project in detail. Include goals, deliverables, technologies, timeline expectations..."
              />
              {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>}
            </div>

            {/* Budget */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Budget <span className="text-red-500">*</span></label>
              <div className="flex gap-3 mb-4">
                {['fixed', 'hourly'].map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setBudgetType(type)}
                    className={`flex-1 py-2.5 rounded-xl border-2 text-sm font-medium transition-all capitalize ${budgetType === type ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400' : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-gray-300'}`}
                  >
                    {type === 'fixed' ? 'Fixed Price' : 'Hourly Rate'}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Min ($)</label>
                  <input
                    type="number"
                    {...register('budgetMin', { required: 'Min budget required', min: { value: 1, message: 'Must be > 0' } })}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
                    placeholder="500"
                  />
                  {errors.budgetMin && <p className="text-red-500 text-xs mt-1">{errors.budgetMin.message}</p>}
                </div>
                <div>
                  <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Max ($)</label>
                  <input
                    type="number"
                    {...register('budgetMax', { required: 'Max budget required', min: { value: 1, message: 'Must be > 0' } })}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
                    placeholder="2000"
                  />
                  {errors.budgetMax && <p className="text-red-500 text-xs mt-1">{errors.budgetMax.message}</p>}
                </div>
              </div>
            </div>

            {/* Deadline & Experience Level */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Deadline</label>
                <input
                  type="date"
                  {...register('deadline')}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Experience Level</label>
                <select
                  {...register('experienceLevel')}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
                >
                  {EXPERIENCE_LEVELS.map((l) => <option key={l} value={l}>{l.charAt(0).toUpperCase() + l.slice(1)}</option>)}
                </select>
              </div>
            </div>

            {/* Skills */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Required Skills <span className="text-red-500">*</span></label>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill(); } }}
                  className="flex-1 px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 text-sm transition-all"
                  placeholder="Type a skill and press Enter (e.g. React, Python, Figma)"
                />
                <button type="button" onClick={addSkill} className="px-4 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-xl transition-colors">
                  <Plus size={18} />
                </button>
              </div>
              {skills.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill) => (
                    <span key={skill} className="inline-flex items-center gap-1.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-sm px-3 py-1.5 rounded-full">
                      {skill}
                      <button type="button" onClick={() => removeSkill(skill)} className="hover:text-red-500 transition-colors">
                        <X size={13} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2 border-t border-gray-100 dark:border-gray-700">
              <button type="button" onClick={() => navigate(-1)} className="flex-1 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 py-3 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={loading} className="flex-1 bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white py-3 rounded-xl font-bold transition-colors flex items-center justify-center gap-2">
                {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : (isEdit ? 'Update Job' : 'Post Job')}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}

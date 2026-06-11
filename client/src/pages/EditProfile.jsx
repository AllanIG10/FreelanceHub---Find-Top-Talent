import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { Camera, Plus, X, ChevronLeft, Save } from 'lucide-react';
import { usersAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const COMMON_SKILLS = ['JavaScript', 'React', 'Node.js', 'Python', 'TypeScript', 'Vue.js', 'Angular', 'PHP', 'Flutter', 'Figma', 'UI/UX Design', 'MongoDB', 'PostgreSQL', 'AWS', 'Docker', 'Machine Learning', 'Content Writing', 'SEO', 'WordPress'];
const AVAILABILITY_OPTIONS = ['available', 'busy', 'not available'];

export default function EditProfile() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const fileRef = useRef();
  const [saving, setLoading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || '');
  const [skills, setSkills] = useState(user?.skills || []);
  const [skillInput, setSkillInput] = useState('');
  const [experience, setExperience] = useState(user?.experience || []);
  const [portfolio, setPortfolio] = useState(user?.portfolio || []);

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      name: user?.name || '',
      title: user?.title || '',
      bio: user?.bio || '',
      location: user?.location || '',
      hourlyRate: user?.hourlyRate || '',
      availability: user?.availability || 'available',
    },
  });

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarPreview(URL.createObjectURL(file));
    try {
      const res = await usersAPI.uploadAvatar(file);
      updateUser({ avatar: res.data?.avatarUrl || res.avatarUrl });
      toast.success('Avatar updated!');
    } catch {
      toast.error('Failed to upload avatar');
    }
  };

  const addSkill = () => {
    const t = skillInput.trim();
    if (t && !skills.includes(t)) { setSkills((p) => [...p, t]); setSkillInput(''); }
  };

  const addExperience = () => setExperience((p) => [...p, { title: '', company: '', years: '' }]);
  const updateExperience = (i, field, value) => setExperience((p) => p.map((e, idx) => idx === i ? { ...e, [field]: value } : e));
  const removeExperience = (i) => setExperience((p) => p.filter((_, idx) => idx !== i));

  const addPortfolio = () => setPortfolio((p) => [...p, { title: '', url: '', description: '' }]);
  const updatePortfolio = (i, field, value) => setPortfolio((p) => p.map((item, idx) => idx === i ? { ...item, [field]: value } : item));
  const removePortfolio = (i) => setPortfolio((p) => p.filter((_, idx) => idx !== i));

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const payload = { ...data, skills, experience, portfolio, hourlyRate: Number(data.hourlyRate) || 0 };
      const res = await usersAPI.updateProfile(payload);
      updateUser(res.data?.user || res.user);
      toast.success('Profile updated successfully!');
      navigate(`/profile/${user?._id}`);
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = 'w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 transition-all text-sm';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pt-20 pb-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 mb-6 text-sm transition-colors">
          <ChevronLeft size={18} /> Back
        </button>

        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Edit Profile</h1>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Avatar */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Profile Photo</h2>
            <div className="flex items-center gap-6">
              <div className="relative">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-2xl font-bold overflow-hidden">
                  {avatarPreview ? <img src={avatarPreview} alt="avatar" className="w-full h-full object-cover" /> : user?.name?.charAt(0)?.toUpperCase()}
                </div>
                <button type="button" onClick={() => fileRef.current?.click()} className="absolute -bottom-1 -right-1 w-7 h-7 bg-green-500 rounded-full flex items-center justify-center hover:bg-green-600 transition-colors">
                  <Camera size={13} className="text-white" />
                </button>
              </div>
              <div>
                <input ref={fileRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                <button type="button" onClick={() => fileRef.current?.click()} className="text-sm text-green-500 hover:text-green-600 font-medium">Upload new photo</button>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">JPG, PNG, GIF up to 5MB</p>
              </div>
            </div>
          </div>

          {/* Basic Info */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 space-y-4">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">Basic Information</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Full Name</label>
                <input type="text" {...register('name', { required: true })} className={inputClass} placeholder="Your full name" />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Professional Title</label>
                <input type="text" {...register('title')} className={inputClass} placeholder="e.g. Full-Stack Developer" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Location</label>
                <input type="text" {...register('location')} className={inputClass} placeholder="e.g. New York, USA" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Hourly Rate ($)</label>
                <input type="number" {...register('hourlyRate')} className={inputClass} placeholder="50" min="0" />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Availability</label>
                <div className="flex gap-3">
                  {AVAILABILITY_OPTIONS.map((opt) => (
                    <label key={opt} className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" {...register('availability')} value={opt} className="text-green-500" />
                      <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">{opt}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Bio</label>
                <textarea {...register('bio')} rows={4} className={`${inputClass} resize-none`} placeholder="Tell clients about yourself, your expertise, and what makes you stand out..." />
              </div>
            </div>
          </div>

          {/* Skills */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Skills</h2>
            <div className="flex gap-2 mb-3">
              <input type="text" value={skillInput} onChange={(e) => setSkillInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill(); } }} className={inputClass} placeholder="Add a skill..." />
              <button type="button" onClick={addSkill} className="px-4 py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl transition-colors"><Plus size={16} /></button>
            </div>
            <div className="flex flex-wrap gap-2 mb-3">
              {COMMON_SKILLS.filter((s) => !skills.includes(s)).slice(0, 8).map((skill) => (
                <button key={skill} type="button" onClick={() => setSkills((p) => [...p, skill])} className="text-xs border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 px-3 py-1.5 rounded-full hover:border-green-300 hover:text-green-500 transition-all">{skill}</button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {skills.map((s) => (
                <span key={s} className="inline-flex items-center gap-1.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-sm px-3 py-1.5 rounded-full">
                  {s}<button type="button" onClick={() => setSkills((p) => p.filter((sk) => sk !== s))}><X size={13} /></button>
                </span>
              ))}
            </div>
          </div>

          {/* Experience */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">Work Experience</h2>
              <button type="button" onClick={addExperience} className="flex items-center gap-1 text-sm text-green-500 hover:text-green-600 font-medium"><Plus size={15} /> Add</button>
            </div>
            <div className="space-y-4">
              {experience.map((exp, i) => (
                <div key={i} className="grid grid-cols-3 gap-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl relative">
                  <button type="button" onClick={() => removeExperience(i)} className="absolute top-2 right-2 text-gray-400 hover:text-red-500 transition-colors"><X size={14} /></button>
                  <input value={exp.title} onChange={(e) => updateExperience(i, 'title', e.target.value)} className={inputClass} placeholder="Job Title" />
                  <input value={exp.company} onChange={(e) => updateExperience(i, 'company', e.target.value)} className={inputClass} placeholder="Company" />
                  <input value={exp.years} onChange={(e) => updateExperience(i, 'years', e.target.value)} className={inputClass} placeholder="e.g. 2021-2023" />
                </div>
              ))}
              {experience.length === 0 && <p className="text-gray-400 dark:text-gray-500 text-sm text-center py-4">No experience added yet</p>}
            </div>
          </div>

          {/* Portfolio */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">Portfolio</h2>
              <button type="button" onClick={addPortfolio} className="flex items-center gap-1 text-sm text-green-500 hover:text-green-600 font-medium"><Plus size={15} /> Add</button>
            </div>
            <div className="space-y-4">
              {portfolio.map((item, i) => (
                <div key={i} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl relative space-y-3">
                  <button type="button" onClick={() => removePortfolio(i)} className="absolute top-2 right-2 text-gray-400 hover:text-red-500 transition-colors"><X size={14} /></button>
                  <input value={item.title} onChange={(e) => updatePortfolio(i, 'title', e.target.value)} className={inputClass} placeholder="Project Title" />
                  <input type="url" value={item.url} onChange={(e) => updatePortfolio(i, 'url', e.target.value)} className={inputClass} placeholder="https://github.com/..." />
                  <input value={item.description} onChange={(e) => updatePortfolio(i, 'description', e.target.value)} className={inputClass} placeholder="Brief description..." />
                </div>
              ))}
              {portfolio.length === 0 && <p className="text-gray-400 dark:text-gray-500 text-sm text-center py-4">No portfolio items added yet</p>}
            </div>
          </div>

          {/* Save Button */}
          <button type="submit" disabled={saving} className="w-full bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white py-4 rounded-xl font-bold transition-colors flex items-center justify-center gap-2 text-base">
            {saving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Save size={18} /> Save Changes</>}
          </button>
        </form>
      </div>
    </div>
  );
}

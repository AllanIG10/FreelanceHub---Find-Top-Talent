import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star, MapPin, DollarSign, Clock, Edit, MessageCircle, Briefcase, ExternalLink } from 'lucide-react';
import { usersAPI, messagesAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import SkillBadge from '../components/SkillBadge';
import ReviewCard from '../components/ReviewCard';
import toast from 'react-hot-toast';

function StarRating({ rating, size = 16 }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star key={s} size={size} className={s <= Math.round(rating || 0) ? 'fill-amber-400 text-amber-400' : 'text-gray-200 dark:text-gray-700'} />
      ))}
    </div>
  );
}

export default function Profile() {
  const { id } = useParams();
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  const isOwn = currentUser?._id === id || (!id && currentUser);
  const userId = id || currentUser?._id;

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [profileRes, reviewsRes] = await Promise.all([
          usersAPI.getProfile(userId),
          usersAPI.getUserReviews?.(userId).catch(() => ({ data: { reviews: [] } })) || Promise.resolve({ data: { reviews: [] } }),
        ]);
        setProfile(profileRes.data?.user || profileRes.user);
        setReviews(reviewsRes.data?.reviews || []);
      } catch {
        toast.error('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    if (userId) load();
  }, [userId]);

  const handleMessage = async () => {
    try {
      const res = await messagesAPI.getOrCreateConversation(userId);
      const convId = res.data?.conversation?._id || res.data?._id;
      navigate(`/messages/${convId}`);
    } catch {
      toast.error('Failed to open chat');
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pt-20 animate-pulse">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden">
          <div className="h-40 bg-gray-200 dark:bg-gray-700" />
          <div className="px-8 pb-8">
            <div className="w-24 h-24 bg-gray-300 dark:bg-gray-600 rounded-full -mt-12 mb-4 border-4 border-white dark:border-gray-800" />
            <div className="h-7 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-2" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32" />
          </div>
        </div>
      </div>
    </div>
  );

  if (!profile) return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pt-24 flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Profile not found</h2>
        <Link to="/" className="text-green-500 hover:text-green-600 font-medium">Go Home</Link>
      </div>
    </div>
  );

  const availabilityColors = {
    available: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    busy: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    'not available': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pt-20 pb-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Profile Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden mb-6">
          {/* Cover */}
          <div className="h-32 bg-gradient-to-r from-green-400 via-emerald-500 to-teal-600" />

          {/* Avatar & Info */}
          <div className="px-8 pb-8">
            <div className="flex items-end justify-between -mt-14 mb-4">
              <div className="w-24 h-24 rounded-2xl border-4 border-white dark:border-gray-800 bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg overflow-hidden flex-shrink-0">
                {profile.avatar ? (
                  <img src={profile.avatar} alt={profile.name} className="w-full h-full object-cover" />
                ) : (
                  profile.name?.charAt(0)?.toUpperCase()
                )}
              </div>
              <div className="flex gap-2 mb-1">
                {isOwn ? (
                  <Link to="/profile/edit" className="flex items-center gap-2 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <Edit size={14} /> Edit Profile
                  </Link>
                ) : currentUser ? (
                  <button onClick={handleMessage} className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors">
                    <MessageCircle size={14} /> Message
                  </button>
                ) : null}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{profile.name}</h1>
                {profile.title && <p className="text-gray-600 dark:text-gray-400 mt-1">{profile.title}</p>}
                <div className="flex flex-wrap items-center gap-4 mt-3">
                  <div className="flex items-center gap-1.5">
                    <StarRating rating={profile.rating} />
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {profile.rating?.toFixed(1) || '0'} ({profile.reviewCount || 0} reviews)
                    </span>
                  </div>
                  {profile.location && (
                    <span className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                      <MapPin size={13} /> {profile.location}
                    </span>
                  )}
                  {profile.hourlyRate > 0 && (
                    <span className="flex items-center gap-1 text-sm font-semibold text-green-500">
                      <DollarSign size={13} /> ${profile.hourlyRate}/hr
                    </span>
                  )}
                  {profile.availability && (
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${availabilityColors[profile.availability] || availabilityColors.available}`}>
                      {profile.availability?.charAt(0).toUpperCase() + profile.availability?.slice(1)}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Bio */}
            {profile.bio && (
              <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-700">
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wide mb-2">About</h2>
                <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">{profile.bio}</p>
              </div>
            )}
          </div>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            {/* Skills */}
            {profile.skills?.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
                <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Skills</h2>
                <div className="flex flex-wrap gap-2">
                  {profile.skills.map((skill) => <SkillBadge key={skill} skill={skill} />)}
                </div>
              </div>
            )}

            {/* Portfolio */}
            {profile.portfolio?.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
                <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Portfolio</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  {profile.portfolio.map((item, index) => (
                    <a key={index} href={item.url} target="_blank" rel="noreferrer" className="block p-4 border border-gray-100 dark:border-gray-700 rounded-xl hover:border-green-200 dark:hover:border-green-800 transition-all group">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-medium text-gray-900 dark:text-white group-hover:text-green-500 transition-colors text-sm">{item.title}</h3>
                        <ExternalLink size={14} className="text-gray-400 group-hover:text-green-500 transition-colors flex-shrink-0" />
                      </div>
                      {item.description && <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">{item.description}</p>}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Reviews */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Reviews ({reviews.length})</h2>
              {reviews.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-sm">No reviews yet</p>
              ) : (
                <div className="space-y-4">
                  {reviews.map((review) => <ReviewCard key={review._id} review={review} />)}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar: Experience */}
          <div className="space-y-6">
            {profile.experience?.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
                <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Experience</h2>
                <div className="space-y-4">
                  {profile.experience.map((exp, index) => (
                    <div key={index} className="relative pl-4 border-l-2 border-green-200 dark:border-green-800">
                      <div className="absolute -left-1.5 top-1 w-3 h-3 rounded-full bg-green-500" />
                      <h3 className="font-medium text-gray-900 dark:text-white text-sm">{exp.title}</h3>
                      <p className="text-gray-600 dark:text-gray-400 text-xs">{exp.company}</p>
                      {exp.years && <p className="text-gray-400 dark:text-gray-500 text-xs mt-0.5">{exp.years}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Stats */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Stats</h2>
              <div className="space-y-3">
                {[
                  { label: 'Member since', value: new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }), icon: Clock },
                  ...(profile.role === 'freelancer' ? [
                    { label: 'Total Earned', value: `$${(profile.totalEarnings || 0).toLocaleString()}`, icon: DollarSign },
                  ] : [
                    { label: 'Jobs Posted', value: profile.totalHired || 0, icon: Briefcase },
                  ]),
                ].map(({ label, value, icon: Icon }) => (
                  <div key={label} className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm">
                      <Icon size={14} />
                      <span>{label}</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

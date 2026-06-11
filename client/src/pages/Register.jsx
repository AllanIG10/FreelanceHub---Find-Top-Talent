import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useForm } from 'react-hook-form'
import {
  Eye, EyeOff, Mail, Lock, User, Briefcase, ArrowRight, Check,
  Building2, Code, ArrowLeft, Sparkles
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

const SKILLS_OPTIONS = [
  'React', 'Node.js', 'Python', 'TypeScript', 'Vue.js', 'Angular', 'Next.js',
  'Django', 'Laravel', 'Flutter', 'Swift', 'AWS', 'Docker', 'Figma', 'Photoshop'
]

function StepIndicator({ currentStep, totalSteps }) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => (
        <div key={step} className="flex items-center gap-2">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
              step < currentStep
                ? 'bg-brand-500 text-white'
                : step === currentStep
                ? 'bg-brand-500 text-white ring-4 ring-brand-100 dark:ring-brand-900/40'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-400'
            }`}
          >
            {step < currentStep ? <Check className="w-4 h-4" /> : step}
          </div>
          {step < totalSteps && (
            <div className={`w-8 h-0.5 rounded-full transition-colors duration-300 ${
              step < currentStep ? 'bg-brand-500' : 'bg-gray-200 dark:bg-gray-700'
            }`} />
          )}
        </div>
      ))}
    </div>
  )
}

function Register() {
  const { register: authRegister, loginWithGoogle } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [role, setRole] = useState('')
  const [selectedSkills, setSelectedSkills] = useState([])
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, formState: { errors }, watch, getValues } = useForm()

  const toggleSkill = (skill) => {
    setSelectedSkills(prev =>
      prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]
    )
  }

  const goNext = () => {
    if (step === 1 && !role) {
      toast.error('Please select a role to continue')
      return
    }
    setStep(p => p + 1)
  }

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      const payload = {
        name: data.name,
        email: data.email,
        password: data.password,
        role,
        ...(role === 'freelancer' && {
          title: data.title,
          skills: selectedSkills,
        }),
        ...(role === 'client' && {
          companyName: data.companyName,
        }),
      }
      const user = await authRegister(payload)
      toast.success(`Welcome to FreelanceHub, ${user.name}!`)
      if (user.role === 'client') navigate('/dashboard/client')
      else navigate('/dashboard/freelancer')
    } catch (err) {
      toast.error(err.message || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const stepVariants = {
    enter: { opacity: 0, x: 30 },
    center: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -30 },
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl bg-brand-500 flex items-center justify-center shadow-brand">
              <Briefcase className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              Freelance<span className="text-brand-500">Hub</span>
            </span>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Create your account</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">Join 500K+ professionals on FreelanceHub</p>

          {/* Step indicator */}
          <div className="flex justify-center mt-6">
            <StepIndicator currentStep={step} totalSteps={3} />
          </div>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 overflow-hidden">
          <AnimatePresence mode="wait">
            {/* STEP 1: Choose Role */}
            {step === 1 && (
              <motion.div
                key="step1"
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.25 }}
                className="p-8"
              >
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">I want to...</h2>
                <p className="text-gray-500 dark:text-gray-400 mb-6">Choose your primary role on FreelanceHub</p>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  {/* Client */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setRole('client')}
                    className={`relative p-6 rounded-xl border-2 text-left transition-all duration-200 ${
                      role === 'client'
                        ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-brand-300'
                    }`}
                  >
                    {role === 'client' && (
                      <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-brand-500 flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 ${role === 'client' ? 'bg-brand-100 dark:bg-brand-900/40' : 'bg-gray-100 dark:bg-gray-800'}`}>
                      <Building2 className={`w-6 h-6 ${role === 'client' ? 'text-brand-500' : 'text-gray-400'}`} />
                    </div>
                    <h3 className="font-bold text-gray-900 dark:text-white mb-1">Hire Talent</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Post jobs and find expert freelancers</p>
                  </motion.button>

                  {/* Freelancer */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setRole('freelancer')}
                    className={`relative p-6 rounded-xl border-2 text-left transition-all duration-200 ${
                      role === 'freelancer'
                        ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-brand-300'
                    }`}
                  >
                    {role === 'freelancer' && (
                      <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-brand-500 flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 ${role === 'freelancer' ? 'bg-brand-100 dark:bg-brand-900/40' : 'bg-gray-100 dark:bg-gray-800'}`}>
                      <Code className={`w-6 h-6 ${role === 'freelancer' ? 'text-brand-500' : 'text-gray-400'}`} />
                    </div>
                    <h3 className="font-bold text-gray-900 dark:text-white mb-1">Find Work</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Browse jobs and submit proposals</p>
                  </motion.button>
                </div>

                <button onClick={goNext} className="w-full btn-primary py-3 flex items-center justify-center gap-2">
                  Continue <ArrowRight className="w-4 h-4" />
                </button>

                {/* Google option */}
                <div className="mt-4">
                  <div className="relative mb-4">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-200 dark:border-gray-700" />
                    </div>
                    <div className="relative flex justify-center">
                      <span className="px-3 bg-white dark:bg-gray-900 text-xs text-gray-400">or</span>
                    </div>
                  </div>
                  <button
                    onClick={loginWithGoogle}
                    className="w-full flex items-center justify-center gap-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Continue with Google
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 2: Basic Info */}
            {step === 2 && (
              <motion.div
                key="step2"
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.25 }}
                className="p-8"
              >
                <button onClick={() => setStep(1)} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 mb-4 transition-colors">
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Basic Information</h2>
                <p className="text-gray-500 dark:text-gray-400 mb-6">Tell us a bit about yourself</p>

                <form className="space-y-4">
                  {/* Name */}
                  <div>
                    <label className="label-base">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="John Doe"
                        {...register('name', { required: 'Name is required', minLength: { value: 2, message: 'Min 2 chars' } })}
                        className={`input-base pl-10 ${errors.name ? 'border-red-400 focus:ring-red-400' : ''}`}
                      />
                    </div>
                    {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
                  </div>

                  {/* Email */}
                  <div>
                    <label className="label-base">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="email"
                        placeholder="john@example.com"
                        {...register('email', {
                          required: 'Email is required',
                          pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Invalid email' },
                        })}
                        className={`input-base pl-10 ${errors.email ? 'border-red-400 focus:ring-red-400' : ''}`}
                      />
                    </div>
                    {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
                  </div>

                  {/* Password */}
                  <div>
                    <label className="label-base">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Min 8 characters"
                        {...register('password', {
                          required: 'Password is required',
                          minLength: { value: 8, message: 'Min 8 characters' },
                        })}
                        className={`input-base pl-10 pr-10 ${errors.password ? 'border-red-400 focus:ring-red-400' : ''}`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(p => !p)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
                  </div>

                  <button type="button" onClick={goNext} className="w-full btn-primary py-3 flex items-center justify-center gap-2 mt-2">
                    Continue <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              </motion.div>
            )}

            {/* STEP 3: Profile Setup */}
            {step === 3 && (
              <motion.div
                key="step3"
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.25 }}
                className="p-8"
              >
                <button onClick={() => setStep(2)} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 mb-4 transition-colors">
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                  {role === 'client' ? 'Company Details' : 'Professional Profile'}
                </h2>
                <p className="text-gray-500 dark:text-gray-400 mb-6">Help others find you faster</p>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                  {role === 'client' ? (
                    <div>
                      <label className="label-base">Company Name (optional)</label>
                      <div className="relative">
                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Acme Inc."
                          {...register('companyName')}
                          className="input-base pl-10"
                        />
                      </div>
                    </div>
                  ) : (
                    <>
                      <div>
                        <label className="label-base">Professional Title</label>
                        <div className="relative">
                          <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            type="text"
                            placeholder="e.g. Senior React Developer"
                            {...register('title')}
                            className="input-base pl-10"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="label-base">Skills <span className="text-gray-400 font-normal">(select up to 5)</span></label>
                        <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
                          {SKILLS_OPTIONS.map((skill) => (
                            <button
                              key={skill}
                              type="button"
                              onClick={() => selectedSkills.length < 5 || selectedSkills.includes(skill) ? toggleSkill(skill) : null}
                              className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all duration-150 ${
                                selectedSkills.includes(skill)
                                  ? 'bg-brand-500 border-brand-500 text-white'
                                  : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-brand-400 hover:text-brand-500'
                              }`}
                            >
                              {selectedSkills.includes(skill) && <Check className="w-3 h-3 inline mr-1" />}
                              {skill}
                            </button>
                          ))}
                        </div>
                        {selectedSkills.length > 0 && (
                          <p className="text-xs text-brand-500 mt-1">{selectedSkills.length} selected</p>
                        )}
                      </div>
                    </>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full btn-primary py-3 flex items-center justify-center gap-2 text-base"
                  >
                    {loading ? (
                      <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Creating account...</>
                    ) : (
                      <>Create Account <ArrowRight className="w-4 h-4" /></>
                    )}
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Footer */}
          <div className="px-8 pb-6 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-brand-500 hover:text-brand-600">Sign in</Link>
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          By registering, you agree to our{' '}
          <a href="#" className="underline hover:text-brand-500">Terms of Service</a>{' '}
          and{' '}
          <a href="#" className="underline hover:text-brand-500">Privacy Policy</a>
        </p>
      </div>
    </div>
  )
}

export default Register

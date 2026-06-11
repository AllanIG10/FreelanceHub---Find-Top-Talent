const aiService = require('../services/aiService');
const Job = require('../models/Job');

/**
 * @desc    Generate a professional proposal cover letter using AI
 * @route   POST /api/ai/generate-proposal
 * @access  Private
 */
const generateProposal = async (req, res, next) => {
  try {
    const { jobTitle, jobDescription, freelancerSkills, freelancerBio, jobBudget } = req.body;

    if (!jobTitle || !jobDescription) {
      return res.status(400).json({
        success: false,
        message: 'jobTitle and jobDescription are required.',
      });
    }

    const jobData = {
      title: jobTitle,
      description: jobDescription,
      budget: jobBudget,
    };

    const freelancerData = {
      skills: freelancerSkills || req.user.skills || [],
      bio: freelancerBio || req.user.bio || '',
      name: req.user.name,
      title: req.user.title || '',
      hourlyRate: req.user.hourlyRate || 0,
    };

    const result = await aiService.generateProposal(jobData, freelancerData);

    res.status(200).json({
      success: true,
      message: 'Proposal generated successfully.',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Recommend jobs for the current freelancer
 * @route   POST /api/ai/recommend-jobs
 * @access  Private (freelancer)
 */
const recommendJobs = async (req, res, next) => {
  try {
    const { additionalSkills, limit = 10 } = req.body;

    const freelancerSkills = [
      ...(req.user.skills || []),
      ...(additionalSkills || []),
    ];

    if (freelancerSkills.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No skills found. Please update your profile with skills first.',
      });
    }

    // Get open jobs for scoring
    const openJobs = await Job.find({ status: 'open', isActive: true })
      .populate('clientId', 'name avatar rating')
      .limit(200)
      .lean();

    const recommendations = await aiService.recommendJobs(freelancerSkills, openJobs);

    res.status(200).json({
      success: true,
      message: 'Job recommendations generated.',
      data: recommendations.slice(0, Number(limit)),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Analyze resume text for skill extraction and gap analysis
 * @route   POST /api/ai/analyze-resume
 * @access  Private
 */
const analyzeResume = async (req, res, next) => {
  try {
    const { resumeText, targetRole } = req.body;

    if (!resumeText || resumeText.trim().length < 50) {
      return res.status(400).json({
        success: false,
        message: 'resumeText is required and must be at least 50 characters.',
      });
    }

    const result = await aiService.analyzeResume(resumeText, targetRole);

    res.status(200).json({
      success: true,
      message: 'Resume analyzed successfully.',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { generateProposal, recommendJobs, analyzeResume };

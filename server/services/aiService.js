/**
 * AI Service - Mock implementations with realistic responses
 * Easy to swap with OpenAI/Gemini API calls
 */

const proposalTemplates = [
  `Dear {clientName},

I am excited to apply for the "{jobTitle}" position. With my extensive experience in {skills}, I am confident I can deliver exceptional results for your project.

Having reviewed your project requirements carefully, I understand you need {jobSummary}. My approach would be to:

1. **Discovery & Planning** - Thoroughly analyze your requirements and create a detailed project roadmap
2. **Development** - Implement using best practices with clean, maintainable code
3. **Testing & Quality Assurance** - Rigorous testing to ensure everything works perfectly
4. **Delivery & Support** - On-time delivery with post-completion support

I have successfully completed similar projects and can provide portfolio samples upon request. My estimated timeline of {days} days accounts for thorough testing and revisions.

I am available to start immediately and am open to discussing the project further. Looking forward to the opportunity to work with you!

Best regards`,

  `Hello,

Thank you for posting this opportunity. Your project on "{jobTitle}" aligns perfectly with my expertise in {skills}.

I've analyzed your requirements and here's how I plan to approach this:

**My Proposed Solution:**
{jobSummary} - I'll tackle this systematically, ensuring each component is built to production standards.

**Why Choose Me:**
- Proven track record with similar projects
- Clear communication throughout the project
- Commitment to deadlines and quality
- Post-delivery support included

I can complete this project within {days} days while maintaining the highest quality standards. My bid of the suggested amount reflects the full scope including revisions.

Let's connect for a quick call to discuss your vision in detail.

Best,`,
];

const skillCategories = {
  webDev: ['JavaScript', 'React', 'Node.js', 'Vue.js', 'Angular', 'TypeScript', 'HTML', 'CSS', 'PHP', 'Laravel'],
  mobileDev: ['React Native', 'Flutter', 'iOS', 'Android', 'Swift', 'Kotlin', 'Dart'],
  backendDev: ['Python', 'Django', 'FastAPI', 'Java', 'Spring Boot', 'Go', 'Ruby on Rails', 'C#', '.NET'],
  database: ['MongoDB', 'PostgreSQL', 'MySQL', 'Redis', 'Firebase', 'Supabase'],
  devOps: ['Docker', 'Kubernetes', 'AWS', 'Azure', 'GCP', 'CI/CD', 'Terraform'],
  design: ['Figma', 'Adobe XD', 'Photoshop', 'Illustrator', 'UI/UX Design'],
  dataScience: ['Python', 'R', 'TensorFlow', 'PyTorch', 'Machine Learning', 'Data Analysis', 'SQL'],
  marketing: ['SEO', 'SEM', 'Social Media', 'Content Marketing', 'Google Analytics', 'Email Marketing'],
};

const allSkillsList = Object.values(skillCategories).flat();

/**
 * Generate a professional proposal based on job and freelancer data
 */
const generateProposal = async (jobData, freelancerData) => {
  const { jobTitle, jobDescription, budget } = jobData;
  const { skills = [], bio = '', name = 'Freelancer' } = freelancerData;

  // Simulate AI processing delay
  await new Promise((resolve) => setTimeout(resolve, 800));

  const relevantSkills = skills.length > 0 ? skills.slice(0, 3).join(', ') : 'relevant technologies';
  const template = proposalTemplates[Math.floor(Math.random() * proposalTemplates.length)];

  // Extract job summary from description
  const jobSummary = jobDescription.length > 100
    ? jobDescription.substring(0, 100) + '...'
    : jobDescription;

  const estimatedDays = Math.floor(Math.random() * 14) + 7; // 7-21 days
  const suggestedBidMin = budget?.min ? Math.round(budget.min * 0.9) : 500;
  const suggestedBidMax = budget?.max ? Math.round(budget.max * 0.95) : 1500;
  const suggestedBid = Math.round((suggestedBidMin + suggestedBidMax) / 2);

  const coverLetter = template
    .replace(/{clientName}/g, 'Hiring Manager')
    .replace(/{jobTitle}/g, jobTitle)
    .replace(/{skills}/g, relevantSkills)
    .replace(/{jobSummary}/g, jobSummary)
    .replace(/{days}/g, estimatedDays);

  return {
    coverLetter,
    suggestedBid,
    suggestedBidMin,
    suggestedBidMax,
    estimatedDays,
    keyPoints: [
      `Expertise in ${relevantSkills}`,
      'On-time delivery guaranteed',
      'Free revisions included',
      'Clear communication throughout',
    ],
    confidence: Math.floor(Math.random() * 20) + 80, // 80-100%
  };
};

/**
 * Recommend jobs based on freelancer skills using TF-IDF-style scoring
 */
const recommendJobs = async (freelancerSkills, jobs) => {
  await new Promise((resolve) => setTimeout(resolve, 500));

  if (!freelancerSkills || freelancerSkills.length === 0 || !jobs || jobs.length === 0) {
    return [];
  }

  const normalizedFreelancerSkills = freelancerSkills.map((s) => s.toLowerCase());

  const scoredJobs = jobs.map((job) => {
    const jobSkills = (job.skills || []).map((s) => s.toLowerCase());
    const jobText = `${job.title} ${job.description}`.toLowerCase();

    let score = 0;

    // Direct skill match (highest weight)
    normalizedFreelancerSkills.forEach((skill) => {
      if (jobSkills.includes(skill)) {
        score += 30;
      }
      // Partial match in job text
      if (jobText.includes(skill)) {
        score += 10;
      }
    });

    // Bonus for fewer proposals (less competition)
    if (job.proposals < 5) score += 15;
    else if (job.proposals < 10) score += 8;

    // Bonus for higher budget
    if (job.budget?.max > 1000) score += 10;
    if (job.budget?.max > 5000) score += 15;

    // Recency bonus (newer jobs score higher)
    const ageInDays = (Date.now() - new Date(job.createdAt)) / (1000 * 60 * 60 * 24);
    if (ageInDays < 1) score += 20;
    else if (ageInDays < 3) score += 10;
    else if (ageInDays < 7) score += 5;

    return {
      ...job.toObject ? job.toObject() : job,
      matchScore: Math.min(score, 100),
      matchReasons: generateMatchReasons(normalizedFreelancerSkills, jobSkills, job),
    };
  });

  // Sort by score descending and return top 10
  return scoredJobs
    .filter((job) => job.matchScore > 0)
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 10);
};

const generateMatchReasons = (freelancerSkills, jobSkills, job) => {
  const reasons = [];
  const matchedSkills = freelancerSkills.filter((s) => jobSkills.includes(s));

  if (matchedSkills.length > 0) {
    reasons.push(`Your skills match: ${matchedSkills.slice(0, 3).join(', ')}`);
  }
  if (job.proposals < 5) {
    reasons.push('Low competition - only a few proposals');
  }
  if (job.budget?.max > 1000) {
    reasons.push('High-value project');
  }

  return reasons;
};

/**
 * Analyze resume/profile text and suggest skills and improvements
 */
const analyzeResume = async (text) => {
  await new Promise((resolve) => setTimeout(resolve, 1000));

  const normalizedText = text.toLowerCase();
  const extractedSkills = [];
  const missingSkills = [];

  // Extract skills mentioned in the text
  allSkillsList.forEach((skill) => {
    if (normalizedText.includes(skill.toLowerCase())) {
      extractedSkills.push(skill);
    }
  });

  // Determine category and suggest missing complementary skills
  const categoryScores = {};
  Object.entries(skillCategories).forEach(([category, skills]) => {
    const matches = skills.filter((s) => extractedSkills.includes(s));
    categoryScores[category] = matches.length;
  });

  const topCategory = Object.entries(categoryScores)
    .sort(([, a], [, b]) => b - a)[0];

  if (topCategory && topCategory[1] > 0) {
    const categorySkills = skillCategories[topCategory[0]];
    const missing = categorySkills
      .filter((s) => !extractedSkills.includes(s))
      .slice(0, 5);
    missingSkills.push(...missing);
  }

  // Calculate completeness score
  const score = Math.min(
    Math.round(
      (extractedSkills.length / 5) * 30 + // Skills score (max 30)
      (text.length > 200 ? 30 : text.length / 200 * 30) + // Content length (max 30)
      (text.includes('experience') || text.includes('years') ? 20 : 0) + // Experience mentioned
      (text.includes('project') || text.includes('portfolio') ? 20 : 0) // Projects mentioned
    ),
    100
  );

  const suggestions = [
    extractedSkills.length < 5 && 'Add more specific technical skills to your profile',
    text.length < 300 && 'Expand your bio with more detail about your experience',
    !text.includes('year') && 'Mention your years of experience',
    !text.includes('project') && 'Add portfolio projects to showcase your work',
    missingSkills.length > 0 && `Consider learning: ${missingSkills.slice(0, 3).join(', ')}`,
  ].filter(Boolean);

  return {
    extractedSkills,
    missingSkills,
    suggestions,
    score,
    topCategory: topCategory ? topCategory[0] : 'general',
    strengths: extractedSkills.slice(0, 5),
    improvementAreas: missingSkills.slice(0, 3),
    analysis: {
      skillCount: extractedSkills.length,
      contentLength: text.length,
      hasExperience: text.includes('experience') || text.includes('years'),
      hasProjects: text.includes('project') || text.includes('portfolio'),
    },
  };
};

module.exports = { generateProposal, recommendJobs, analyzeResume };

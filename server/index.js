require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const mongoose = require('mongoose');
const passport = require('passport');
const rateLimit = require('express-rate-limit');
const { Server } = require('socket.io');

const authRoutes = require('./routes/auth');
const jobRoutes = require('./routes/jobs');
const proposalRoutes = require('./routes/proposals');
const userRoutes = require('./routes/users');
const messageRoutes = require('./routes/messages');
const adminRoutes = require('./routes/admin');
const aiRoutes = require('./routes/ai');
const reviewRoutes = require('./routes/reviews');
const errorHandler = require('./middleware/errorHandler');
const { initSocket } = require('./socket');

// Passport config
require('./config/passport')(passport);

const app = express();
const server = http.createServer(app);

// Socket.io setup
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Initialize socket handlers
initSocket(io);

// Make io accessible in routes/controllers
app.set('io', io);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
});

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(limiter);
app.use(passport.initialize());

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Freelance API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/proposals', proposalRoutes);
app.use('/api/users', userRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/reviews', reviewRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// Global error handler
app.use(errorHandler);

// MongoDB connection — uses in-memory DB in dev if no MONGO_URI provided
const connectDB = async () => {
  let uri = process.env.MONGO_URI;

  if (!uri || uri.includes('your_') || uri === 'mongodb://localhost:27017/freelance_db') {
    // Try local first, fall back to in-memory
    try {
      await mongoose.connect('mongodb://127.0.0.1:27017/freelance_db', { serverSelectionTimeoutMS: 2000 });
      console.log('MongoDB connected: localhost');
      return;
    } catch {
      // Local not available — spin up in-memory MongoDB
      console.log('Local MongoDB not found. Starting in-memory MongoDB for development...');
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const mongod = new MongoMemoryServer();
      await mongod.start();
      uri = mongod.getUri();
      // Store reference so it can be stopped on exit
      process.on('exit', () => mongod.stop());
      process.on('SIGINT', async () => { await mongod.stop(); process.exit(0); });
      console.log('✅ In-memory MongoDB started (data resets on server restart)');
    }
  }

  const conn = await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
  console.log(`MongoDB connected: ${conn.connection.host}`);
};

// Seed demo data after DB connects
const seedDemoData = async () => {
  try {
    const User = require('./models/User');
    const Job = require('./models/Job');
    const count = await User.countDocuments();
    if (count > 0) return; // Already seeded

    const bcrypt = require('bcryptjs');
    const hash = await bcrypt.hash('password123', 10);

    const [client, freelancer, admin] = await User.insertMany([
      { name: 'Alice Chen', email: 'client@demo.com', password: hash, role: 'client', location: 'New York, USA', bio: 'Product manager building the next generation of SaaS tools.', isVerified: true },
      { name: 'Bob Martinez', email: 'freelancer@demo.com', password: hash, role: 'freelancer', title: 'Full-Stack Developer', skills: ['React', 'Node.js', 'MongoDB', 'TypeScript', 'AWS'], hourlyRate: 85, location: 'Austin, TX', bio: '8+ years building scalable web applications. Specialized in MERN stack.', availability: 'available', isVerified: true },
      { name: 'Super Admin', email: 'admin@demo.com', password: hash, role: 'admin', isVerified: true },
    ]);

    await Job.insertMany([
      { title: 'Full-Stack React & Node.js Developer for E-Commerce Platform', description: 'We need an experienced full-stack developer to build a modern e-commerce platform. The project includes user authentication, product catalog, shopping cart, payment integration (Stripe), order management, and an admin dashboard.\n\nRequirements:\n- 3+ years React experience\n- Node.js/Express backend\n- MongoDB database design\n- REST API development\n- Experience with Stripe or similar payment gateways\n\nNice to have:\n- TypeScript\n- Redis caching\n- Docker deployment', budget: { min: 3000, max: 6000, type: 'fixed' }, deadline: new Date(Date.now() + 45 * 86400000), skills: ['React', 'Node.js', 'MongoDB', 'Stripe', 'TypeScript'], category: 'Web Development', clientId: client._id, status: 'open', experienceLevel: 'intermediate', proposals: 0 },
      { title: 'UI/UX Designer for Mobile Banking App (Figma)', description: 'Looking for a talented UI/UX designer to redesign our mobile banking app. We need clean, modern interfaces that focus on usability and trust.\n\nScope of work:\n- User research and competitor analysis\n- User flows and wireframes\n- High-fidelity Figma mockups\n- Design system/component library\n- Prototype for user testing\n\nThe final deliverable should include all Figma source files, a design system, and a clickable prototype.', budget: { min: 1500, max: 3000, type: 'fixed' }, deadline: new Date(Date.now() + 30 * 86400000), skills: ['Figma', 'UI/UX Design', 'Mobile Design', 'Prototyping'], category: 'UI/UX Design', clientId: client._id, status: 'open', experienceLevel: 'intermediate', proposals: 0 },
      { title: 'Python Data Scientist for ML Recommendation Engine', description: 'We are building a content recommendation engine for our streaming platform. Need a data scientist with strong ML background.\n\nTasks:\n- Collaborative filtering model\n- Content-based filtering\n- A/B testing framework\n- Model deployment with FastAPI\n- Performance monitoring dashboard\n\nDataset: ~10M user interactions, 50K content items. Must have experience with large-scale ML pipelines.', budget: { min: 5000, max: 10000, type: 'fixed' }, deadline: new Date(Date.now() + 60 * 86400000), skills: ['Python', 'Machine Learning', 'TensorFlow', 'FastAPI', 'Data Science'], category: 'Data Science', clientId: client._id, status: 'open', experienceLevel: 'expert', proposals: 0 },
      { title: 'WordPress Developer for Corporate Website Redesign', description: 'Our company needs a WordPress developer to redesign our corporate website. We want a modern, fast, and SEO-optimized site.\n\nPages: Home, About, Services (6 pages), Portfolio, Blog, Contact\nRequirements: Custom theme, responsive design, page speed optimization (Lighthouse 90+), contact forms, basic SEO setup.', budget: { min: 800, max: 1500, type: 'fixed' }, deadline: new Date(Date.now() + 21 * 86400000), skills: ['WordPress', 'PHP', 'CSS', 'SEO', 'Elementor'], category: 'Web Development', clientId: client._id, status: 'open', experienceLevel: 'entry', proposals: 0 },
      { title: 'React Native Developer — iOS & Android Fitness App', description: 'Build a cross-platform fitness tracking app with React Native. Features include workout logging, progress charts, social sharing, Apple Health/Google Fit integration, and push notifications.\n\nMust-have experience with React Native, Expo, Redux, and mobile app publishing (App Store + Play Store).', budget: { min: 4000, max: 8000, type: 'fixed' }, deadline: new Date(Date.now() + 90 * 86400000), skills: ['React Native', 'Expo', 'Redux', 'iOS', 'Android'], category: 'Mobile Development', clientId: client._id, status: 'open', experienceLevel: 'intermediate', proposals: 0 },
      { title: 'Content Writer for SaaS Blog (10 articles/month)', description: 'We need a skilled B2B SaaS content writer to produce high-quality blog articles. Topics include productivity, project management, remote work, and software tutorials.\n\nEach article: 1500-2500 words, SEO-optimized, original research, practical and actionable. Native English speaker preferred.', budget: { min: 50, max: 100, type: 'hourly' }, deadline: new Date(Date.now() + 365 * 86400000), skills: ['Content Writing', 'SEO', 'B2B Marketing', 'SaaS'], category: 'Content Writing', clientId: client._id, status: 'open', experienceLevel: 'intermediate', proposals: 0 },
    ]);

    console.log('✅ Demo data seeded — Login with:');
    console.log('   Client:     client@demo.com / password123');
    console.log('   Freelancer: freelancer@demo.com / password123');
    console.log('   Admin:      admin@demo.com / password123');
  } catch (err) {
    console.error('Seed error (non-fatal):', err.message);
  }
};

// Start server
const PORT = process.env.PORT || 5000;

connectDB().then(async () => {
  await seedDemoData();
  server.listen(PORT, () => {
    console.log(`\n🚀 Server running on http://localhost:${PORT}`);
    console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`   Frontend:    http://localhost:5173\n`);
  });
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err.message);
  server.close(() => process.exit(1));
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err.message);
  process.exit(1);
});

module.exports = { app, server, io };

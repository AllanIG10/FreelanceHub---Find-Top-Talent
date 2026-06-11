import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Navbar from './components/Navbar'

// Pages
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import JobList from './pages/JobList'
import JobDetails from './pages/JobDetails'
import JobCreate from './pages/JobCreate'
import SubmitProposal from './pages/SubmitProposal'
import Dashboard from './pages/Dashboard'
import ClientDashboard from './pages/ClientDashboard'
import FreelancerDashboard from './pages/FreelancerDashboard'
import AdminDashboard from './pages/AdminDashboard'
import Profile from './pages/Profile'
import EditProfile from './pages/EditProfile'
import Messages from './pages/Messages'
import MyProposals from './pages/MyProposals'
import ProposalList from './pages/ProposalList'
import NotFound from './pages/NotFound'

const noNavbarRoutes = ['/login', '/register']

function App() {
  const { user } = useAuth()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<><Navbar /><Home /></>} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/jobs" element={<><Navbar /><JobList /></>} />
        <Route path="/jobs/:id" element={<><Navbar /><JobDetails /></>} />
        <Route path="/profile/:id" element={<><Navbar /><Profile /></>} />

        {/* Protected: Freelancer */}
        <Route
          path="/jobs/:id/proposal"
          element={
            <ProtectedRoute allowedRoles={['freelancer']}>
              <Navbar />
              <SubmitProposal />
            </ProtectedRoute>
          }
        />
        <Route
          path="/proposals"
          element={
            <ProtectedRoute allowedRoles={['freelancer']}>
              <MyProposals />
            </ProtectedRoute>
          }
        />

        {/* Protected: Client */}
        <Route
          path="/jobs/create"
          element={
            <ProtectedRoute allowedRoles={['client']}>
              <Navbar />
              <JobCreate />
            </ProtectedRoute>
          }
        />
        <Route
          path="/jobs/:id/edit"
          element={
            <ProtectedRoute allowedRoles={['client']}>
              <Navbar />
              <JobCreate editMode />
            </ProtectedRoute>
          }
        />
        <Route
          path="/jobs/:id/proposals"
          element={
            <ProtectedRoute allowedRoles={['client']}>
              <ProposalList />
            </ProtectedRoute>
          }
        />

        {/* Protected: Dashboard */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/client"
          element={
            <ProtectedRoute allowedRoles={['client']}>
              <ClientDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/freelancer"
          element={
            <ProtectedRoute allowedRoles={['freelancer']}>
              <FreelancerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/admin"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* Protected: Profile Edit */}
        <Route
          path="/profile/edit"
          element={
            <ProtectedRoute>
              <Navbar />
              <EditProfile />
            </ProtectedRoute>
          }
        />

        {/* Protected: Messages */}
        <Route
          path="/messages"
          element={
            <ProtectedRoute>
              <Messages />
            </ProtectedRoute>
          }
        />
        <Route
          path="/messages/:conversationId"
          element={
            <ProtectedRoute>
              <Messages />
            </ProtectedRoute>
          }
        />

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  )
}

export default App

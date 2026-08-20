import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Public Pages
import { Home } from './pages/public/Home';
import { JobsListing } from './pages/public/JobsListing';
import { JobDetails } from './pages/public/JobDetails';
import { About } from './pages/public/About';
import { Contact } from './pages/public/Contact';
import { HowItWorks } from './pages/public/HowItWorks';
import { FAQ } from './pages/public/FAQ';
import { Privacy } from './pages/public/Privacy';
import { Terms } from './pages/public/Terms';
import { NotFound } from './pages/public/NotFound';

// Auth Pages
import { Login } from './pages/auth/Login';
import { RegisterJobSeeker } from './pages/auth/RegisterJobSeeker';
import { RegisterEmployer } from './pages/auth/RegisterEmployer';
import { ForgotPassword } from './pages/auth/ForgotPassword';

// Seeker Pages
import { SeekerDashboard } from './pages/seeker/SeekerDashboard';
import { SeekerSearchJobs } from './pages/seeker/SeekerSearchJobs';
import { SeekerSavedJobs } from './pages/seeker/SeekerSavedJobs';
import { SeekerAppliedJobs } from './pages/seeker/SeekerAppliedJobs';
import { SeekerApplicationStatus } from './pages/seeker/SeekerApplicationStatus';
import { SeekerNotifications } from './pages/seeker/SeekerNotifications';
import { SeekerProfile } from './pages/seeker/SeekerProfile';
import { SeekerEditProfile } from './pages/seeker/SeekerEditProfile';

// Employer Pages
import { EmployerDashboard } from './pages/employer/EmployerDashboard';
import { PostJob } from './pages/employer/PostJob';
import { ManageJobs } from './pages/employer/ManageJobs';
import { EditJob } from './pages/employer/EditJob';
import { ViewApplications } from './pages/employer/ViewApplications';
import { ShortlistedCandidates } from './pages/employer/ShortlistedCandidates';
import { CompanyProfile } from './pages/employer/CompanyProfile';
import { EmployerNotifications } from './pages/employer/EmployerNotifications';

// Admin Pages
import { AdminAccess } from './pages/admin/AdminAccess';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { PendingJobs } from './pages/admin/PendingJobs';
import { ManageEmployers } from './pages/admin/ManageEmployers';
import { ManageJobSeekers } from './pages/admin/ManageJobSeekers';
import { SystemLogs } from './pages/admin/SystemLogs';

// Protected Route Wrapper
const ProtectedRoute: React.FC<{
  children: React.ReactNode;
  allowedRoles?: ('jobSeeker' | 'employer' | 'admin')[];
}> = ({ children, allowedRoles }) => {
  const { currentUser, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white font-sans text-xs font-semibold">
        Loading Part Time Hub Session...
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && role && !allowedRoles.includes(role)) {
    // Redirect to respective dashboard if wrong role
    if (role === 'admin') return <Navigate to="/admin/dashboard" replace />;
    if (role === 'employer') return <Navigate to="/employer/dashboard" replace />;
    return <Navigate to="/seeker/dashboard" replace />;
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/jobs" element={<JobsListing />} />
          <Route path="/jobs/:jobId" element={<JobDetails />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/how-it-works" element={<HowItWorks />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />

          {/* Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register/seeker" element={<RegisterJobSeeker />} />
          <Route path="/register/job-seeker" element={<RegisterJobSeeker />} />
          <Route path="/register/employer" element={<RegisterEmployer />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* Job Seeker Protected Routes */}
          <Route
            path="/seeker/dashboard"
            element={
              <ProtectedRoute allowedRoles={['jobSeeker']}>
                <SeekerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/seeker/jobs"
            element={
              <ProtectedRoute allowedRoles={['jobSeeker']}>
                <SeekerSearchJobs />
              </ProtectedRoute>
            }
          />
          <Route
            path="/seeker/saved-jobs"
            element={
              <ProtectedRoute allowedRoles={['jobSeeker']}>
                <SeekerSavedJobs />
              </ProtectedRoute>
            }
          />
          <Route
            path="/seeker/applied-jobs"
            element={
              <ProtectedRoute allowedRoles={['jobSeeker']}>
                <SeekerAppliedJobs />
              </ProtectedRoute>
            }
          />
          <Route
            path="/seeker/application-status"
            element={
              <ProtectedRoute allowedRoles={['jobSeeker']}>
                <SeekerApplicationStatus />
              </ProtectedRoute>
            }
          />
          <Route
            path="/seeker/notifications"
            element={
              <ProtectedRoute allowedRoles={['jobSeeker']}>
                <SeekerNotifications />
              </ProtectedRoute>
            }
          />
          <Route
            path="/seeker/profile"
            element={
              <ProtectedRoute allowedRoles={['jobSeeker']}>
                <SeekerProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/seeker/profile/edit"
            element={
              <ProtectedRoute allowedRoles={['jobSeeker']}>
                <SeekerEditProfile />
              </ProtectedRoute>
            }
          />

          {/* Employer Protected Routes */}
          <Route
            path="/employer/dashboard"
            element={
              <ProtectedRoute allowedRoles={['employer']}>
                <EmployerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/employer/post-job"
            element={
              <ProtectedRoute allowedRoles={['employer']}>
                <PostJob />
              </ProtectedRoute>
            }
          />
          <Route
            path="/employer/jobs"
            element={
              <ProtectedRoute allowedRoles={['employer']}>
                <ManageJobs />
              </ProtectedRoute>
            }
          />
          <Route
            path="/employer/jobs/:jobId/edit"
            element={
              <ProtectedRoute allowedRoles={['employer']}>
                <EditJob />
              </ProtectedRoute>
            }
          />
          <Route
            path="/employer/applications"
            element={
              <ProtectedRoute allowedRoles={['employer']}>
                <ViewApplications />
              </ProtectedRoute>
            }
          />
          <Route
            path="/employer/shortlisted"
            element={
              <ProtectedRoute allowedRoles={['employer']}>
                <ShortlistedCandidates />
              </ProtectedRoute>
            }
          />
          <Route
            path="/employer/company-profile"
            element={
              <ProtectedRoute allowedRoles={['employer']}>
                <CompanyProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/employer/notifications"
            element={
              <ProtectedRoute allowedRoles={['employer']}>
                <EmployerNotifications />
              </ProtectedRoute>
            }
          />

          {/* Admin Routes */}
          <Route path="/admin" element={<AdminAccess />} />
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/pending-jobs"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <PendingJobs />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/employers"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <ManageEmployers />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/seekers"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <ManageJobSeekers />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/logs"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <SystemLogs />
              </ProtectedRoute>
            }
          />

          {/* Fallback 404 Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
};

export default App;

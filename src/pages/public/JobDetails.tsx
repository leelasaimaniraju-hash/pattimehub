import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  MapPin,
  DollarSign,
  Clock,
  Calendar,
  Building2,
  CheckCircle2,
  Bookmark,
  Send,
  ArrowLeft,
  Users,
  Briefcase,
  AlertCircle,
  Share2,
} from 'lucide-react';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';
import { useAuth } from '../../context/AuthContext';
import { Job, SavedJob, JobApplication, EmployerProfile } from '../../types';
import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import { db } from '../../firebase/config';
import { calculateHaversineDistance, formatDistance } from '../../utils/location';

export const JobDetails: React.FC = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const { currentUser, userProfile, role, userLocation } = useAuth();
  const navigate = useNavigate();

  const [job, setJob] = useState<Job | null>(null);
  const [employer, setEmployer] = useState<EmployerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [isApplied, setIsApplied] = useState(false);
  const [applying, setApplying] = useState(false);
  const [applySuccess, setApplySuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    async function loadJob() {
      if (!jobId) return;
      setLoading(true);
      try {
        const jobRef = doc(db, 'jobs', jobId);
        const jobSnap = await getDoc(jobRef);

        if (jobSnap.exists()) {
          const data = jobSnap.data() as Job;
          const dist = userLocation
            ? calculateHaversineDistance(
                userLocation.latitude,
                userLocation.longitude,
                data.latitude,
                data.longitude
              )
            : undefined;

          setJob({ ...data, distanceKm: dist });

          // Fetch employer info
          const empSnap = await getDoc(doc(db, 'employers', data.employerId));
          if (empSnap.exists()) {
            setEmployer(empSnap.data() as EmployerProfile);
          }

          // Check if current user saved or applied
          if (currentUser && role === 'jobSeeker') {
            const savedId = `${currentUser.uid}_${jobId}`;
            const savedSnap = await getDoc(doc(db, 'savedJobs', savedId));
            setIsSaved(savedSnap.exists());

            const appQ = query(
              collection(db, 'applications'),
              where('jobId', '==', jobId),
              where('jobSeekerId', '==', currentUser.uid)
            );
            const appSnap = await getDocs(appQ);
            setIsApplied(!appSnap.empty);
          }
        }
      } catch (err) {
        console.error('Error loading job details:', err);
      } finally {
        setLoading(false);
      }
    }

    loadJob();
  }, [jobId, currentUser, role, userLocation]);

  const handleToggleSave = async () => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    if (!jobId) return;

    const savedId = `${currentUser.uid}_${jobId}`;
    try {
      if (isSaved) {
        setIsSaved(false);
        await deleteDoc(doc(db, 'savedJobs', savedId));
      } else {
        setIsSaved(true);
        await setDoc(doc(db, 'savedJobs', savedId), {
          savedJobId: savedId,
          jobSeekerId: currentUser.uid,
          jobId,
          createdAt: new Date().toISOString(),
        });
      }
    } catch (err) {
      console.error('Error toggling save:', err);
    }
  };

  const handleApply = async () => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    if (role === 'employer') {
      setErrorMsg('Employers cannot apply for jobs. Please register or log in as a Job Seeker.');
      return;
    }

    if (!job || !jobId) return;

    setApplying(true);
    setErrorMsg('');

    try {
      const applicationId = `app_${Date.now()}_${currentUser.uid.slice(0, 5)}`;
      const application: JobApplication = {
        applicationId,
        jobId: job.jobId,
        jobTitle: job.title,
        employerId: job.employerId,
        employerName: job.employerName,
        jobSeekerId: currentUser.uid,
        jobSeekerName: userProfile?.fullName || 'Applicant',
        jobSeekerEmail: currentUser.email || '',
        jobSeekerPhone: userProfile?.phone || '',
        jobSeekerSkills: userProfile?.skills || [],
        jobSeekerAbout: userProfile?.about || '',
        appliedAt: new Date().toISOString(),
        status: 'pending',
        updatedAt: new Date().toISOString(),
      };

      await setDoc(doc(db, 'applications', applicationId), application);

      // Create notification for employer
      const notifId = `notif_${Date.now()}`;
      await setDoc(doc(db, 'notifications', notifId), {
        notificationId: notifId,
        recipientUid: job.employerId,
        title: 'New Job Application Received!',
        message: `${userProfile?.fullName || 'A candidate'} applied for ${job.title}`,
        type: 'application',
        relatedJobId: job.jobId,
        relatedApplicationId: applicationId,
        isRead: false,
        createdAt: new Date().toISOString(),
      });

      // Create activity log
      await setDoc(doc(db, 'activityLogs', `log_${Date.now()}`), {
        logId: `log_${Date.now()}`,
        actorUid: currentUser.uid,
        actorRole: 'jobSeeker',
        actorName: userProfile?.fullName || 'Applicant',
        action: 'application_submitted',
        targetType: 'job',
        targetId: job.jobId,
        description: `Applied for ${job.title}`,
        createdAt: new Date().toISOString(),
      });

      setIsApplied(true);
      setApplySuccess(true);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit application');
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-16 w-full flex-1">
          <div className="bg-white rounded-2xl p-8 border border-slate-200 animate-pulse space-y-6">
            <div className="h-8 bg-slate-200 rounded w-1/2"></div>
            <div className="h-4 bg-slate-200 rounded w-1/4"></div>
            <div className="h-24 bg-slate-200 rounded"></div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
        <Navbar />
        <div className="max-w-md mx-auto px-4 py-20 text-center flex-1">
          <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-slate-900">Job Not Found</h2>
          <p className="text-xs text-slate-500 mt-1 mb-4">
            This vacancy may have expired or been removed by the employer.
          </p>
          <Link
            to="/jobs"
            className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold"
          >
            Back to All Jobs
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1 space-y-8">
        {/* Back Link */}
        <Link
          to="/jobs"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-indigo-600"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Job Listings
        </Link>

        {/* Top Job Overview Card */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="px-3 py-1 rounded-md text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                  {job.category}
                </span>
                <span className="px-3 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700">
                  {job.jobType}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {job.title}
              </h1>

              <div className="flex items-center gap-2 mt-2 text-sm text-slate-600 font-medium">
                <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
                <span>{job.employerName}</span>
                <span className="inline-flex items-center text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3 mr-1" /> Verified Employer
                </span>
              </div>
            </div>

            {/* Save & Share Actions */}
            <div className="flex items-center gap-2 self-start">
              <button
                onClick={handleToggleSave}
                className={`p-2.5 rounded-xl border transition-colors ${
                  isSaved
                    ? 'bg-rose-50 text-rose-600 border-rose-200'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
                title={isSaved ? 'Saved' : 'Save job'}
              >
                <Bookmark className={`w-5 h-5 ${isSaved ? 'fill-current' : ''}`} />
              </button>
            </div>
          </div>

          {/* Key Info Banner Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100 text-xs mb-6">
            <div>
              <span className="text-slate-400 block font-medium mb-1">Pay Rate</span>
              <span className="font-extrabold text-base text-emerald-700">
                ${job.payAmount.toFixed(2)}
                <span className="text-xs font-normal text-slate-500">
                  /{job.payFrequency.replace('per_', '')}
                </span>
              </span>
            </div>

            <div>
              <span className="text-slate-400 block font-medium mb-1">GPS Distance</span>
              <span className="font-bold text-sm text-indigo-700 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-indigo-500" />
                {formatDistance(job.distanceKm)}
              </span>
            </div>

            <div>
              <span className="text-slate-400 block font-medium mb-1">Working Days</span>
              <span className="font-semibold text-slate-800">{job.workingDays || 'Flexible'}</span>
            </div>

            <div>
              <span className="text-slate-400 block font-medium mb-1">Openings</span>
              <span className="font-semibold text-slate-800">{job.openings} Positions</span>
            </div>
          </div>

          {/* Location details */}
          <div className="flex items-start gap-2 text-xs text-slate-600 bg-indigo-50/50 p-3 rounded-xl border border-indigo-100 mb-6">
            <MapPin className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-900">{job.locationName}</span> — {job.address}
            </div>
          </div>

          {/* Apply CTA Block */}
          {errorMsg && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-medium">
              {errorMsg}
            </div>
          )}

          {applySuccess ? (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-xs font-medium flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
              <div>
                <strong>Application Submitted Successfully!</strong>
                <p className="text-emerald-700 font-normal mt-0.5">
                  The employer has been notified. You can track your application status in your Job Seeker Dashboard.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-4 pt-4 border-t border-slate-100">
              <span className="text-xs text-slate-400">
                Posted on {new Date(job.createdAt).toLocaleDateString()}
              </span>

              <button
                type="button"
                disabled={isApplied || applying}
                onClick={handleApply}
                className={`px-6 py-3 text-sm font-semibold rounded-xl flex items-center gap-2 transition-all shadow-md ${
                  isApplied
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200'
                }`}
              >
                <Send className="w-4 h-4" />
                {isApplied ? 'Already Applied' : applying ? 'Submitting...' : 'Apply Now'}
              </button>
            </div>
          )}
        </div>

        {/* Detailed Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* Description */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-4">
              <h2 className="text-lg font-bold text-slate-900">Job Description</h2>
              <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                {job.description}
              </p>
            </div>

            {/* Required Skills & Requirements */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
              {job.requiredSkills && job.requiredSkills.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-slate-900 mb-3">Required Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {job.requiredSkills.map((skill, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {job.requirements && job.requirements.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-slate-900 mb-3">Job Requirements</h3>
                  <ul className="space-y-2 text-xs text-slate-600 list-disc list-inside">
                    {job.requirements.map((req, idx) => (
                      <li key={idx} className="leading-relaxed">
                        {req}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Employer Sidebar Overview */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-slate-900 pb-3 border-b border-slate-100">
                About the Employer
              </h3>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white font-bold flex items-center justify-center text-sm">
                  {job.employerName.charAt(0)}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">{job.employerName}</h4>
                  <p className="text-xs text-slate-500">{employer?.category || 'Local Business'}</p>
                </div>
              </div>

              {employer?.description && (
                <p className="text-xs text-slate-500 leading-relaxed">
                  {employer.description}
                </p>
              )}

              <div className="pt-3 border-t border-slate-100 space-y-2 text-xs text-slate-600">
                <div>
                  <strong className="text-slate-900 block">Location:</strong>
                  {job.address}, {employer?.city || 'City'}
                </div>
                {employer?.phone && (
                  <div>
                    <strong className="text-slate-900 block">Contact Phone:</strong>
                    {employer.phone}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

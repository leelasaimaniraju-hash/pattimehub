import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FileCheck,
  Bookmark,
  Clock,
  CheckCircle2,
  MapPin,
  Search,
  Bell,
  ArrowRight,
} from 'lucide-react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { JobCard } from '../../components/common/JobCard';
import { useAuth } from '../../context/AuthContext';
import { Job, JobApplication, NotificationItem } from '../../types';
import { collection, query, where, getDocs, limit, orderBy } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { calculateHaversineDistance } from '../../utils/location';
import { getApprovedJobsWithFallback } from '../../services/seedData';

export const SeekerDashboard: React.FC = () => {
  const { currentUser, userProfile, userLocation } = useAuth();
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [savedCount, setSavedCount] = useState(0);
  const [recommendedJobs, setRecommendedJobs] = useState<Job[]>([]);
  const [recentNotifications, setRecentNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      if (!currentUser?.uid) return;
      setLoading(true);
      try {
        // Fetch applications
        const appQ = query(
          collection(db, 'applications'),
          where('jobSeekerId', '==', currentUser.uid)
        );
        const appSnap = await getDocs(appQ);
        const appList: JobApplication[] = [];
        appSnap.forEach((doc) => appList.push(doc.data() as JobApplication));
        setApplications(appList);

        // Fetch saved count
        const savedQ = query(
          collection(db, 'savedJobs'),
          where('jobSeekerId', '==', currentUser.uid)
        );
        const savedSnap = await getDocs(savedQ);
        setSavedCount(savedSnap.size);

        // Fetch notifications
        const notifQ = query(
          collection(db, 'notifications'),
          where('recipientUid', '==', currentUser.uid),
          limit(5)
        );
        const notifSnap = await getDocs(notifQ);
        const notifList: NotificationItem[] = [];
        notifSnap.forEach((doc) => notifList.push(doc.data() as NotificationItem));
        setRecentNotifications(notifList);

        // Fetch recommended approved jobs with fallback
        try {
          const loadedJobs = await getApprovedJobsWithFallback(
            userLocation?.latitude,
            userLocation?.longitude
          );
          loadedJobs.sort((a, b) => (a.distanceKm || 999) - (b.distanceKm || 999));
          setRecommendedJobs(loadedJobs.slice(0, 6));
        } catch (jobErr) {
          console.warn('Recommended jobs load notice:', jobErr);
        }
      } catch (err) {
        console.error('Error loading seeker dashboard:', err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, [currentUser, userLocation]);

  const pendingApps = applications.filter((a) => a.status === 'pending').length;
  const shortlistedApps = applications.filter((a) => a.status === 'shortlisted').length;
  const acceptedApps = applications.filter((a) => a.status === 'accepted').length;

  return (
    <DashboardLayout
      title={`Welcome back, ${userProfile?.fullName || 'Seeker'}!`}
      subtitle="Track your applications and explore nearby part-time jobs"
    >
      <div className="space-y-8">
        {/* Metric Cards Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500">Total Applications</span>
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                <FileCheck className="w-5 h-5" />
              </div>
            </div>
            <div className="text-2xl font-extrabold text-slate-900">{applications.length}</div>
            <Link to="/seeker/applied-jobs" className="text-[11px] text-indigo-600 font-medium hover:underline block mt-1">
              View applied list →
            </Link>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500">Saved Bookmarks</span>
              <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
                <Bookmark className="w-5 h-5" />
              </div>
            </div>
            <div className="text-2xl font-extrabold text-slate-900">{savedCount}</div>
            <Link to="/seeker/saved-jobs" className="text-[11px] text-rose-600 font-medium hover:underline block mt-1">
              View saved jobs →
            </Link>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500">Pending Review</span>
              <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                <Clock className="w-5 h-5" />
              </div>
            </div>
            <div className="text-2xl font-extrabold text-slate-900">{pendingApps}</div>
            <span className="text-[11px] text-slate-400 block mt-1">Awaiting employer review</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500">Shortlisted / Accepted</span>
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>
            <div className="text-2xl font-extrabold text-emerald-600">
              {shortlistedApps + acceptedApps}
            </div>
            <Link to="/seeker/application-status" className="text-[11px] text-emerald-600 font-medium hover:underline block mt-1">
              Track status timeline →
            </Link>
          </div>
        </div>

        {/* Recommended Nearby Jobs */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-indigo-600" /> Recommended Jobs Near You
            </h2>
            <Link to="/seeker/jobs" className="text-xs font-semibold text-indigo-600 hover:underline">
              Search All Nearby →
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2].map((i) => (
                <div key={i} className="bg-white p-6 rounded-xl border border-slate-200 animate-pulse h-32"></div>
              ))}
            </div>
          ) : recommendedJobs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recommendedJobs.map((job) => (
                <JobCard key={job.jobId} job={job} />
              ))}
            </div>
          ) : (
            <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center">
              <Search className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-xs text-slate-500">No recommended jobs found in your immediate radius.</p>
            </div>
          )}
        </div>

        {/* Notifications preview */}
        {recentNotifications.length > 0 && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Bell className="w-4 h-4 text-indigo-600" /> Recent Notifications
              </h3>
              <Link to="/seeker/notifications" className="text-xs text-indigo-600 font-medium hover:underline">
                View All
              </Link>
            </div>

            <div className="space-y-2">
              {recentNotifications.map((n) => (
                <div key={n.notificationId} className="p-3 bg-slate-50 rounded-xl text-xs flex justify-between items-center">
                  <div>
                    <strong className="block text-slate-900">{n.title}</strong>
                    <span className="text-slate-500">{n.message}</span>
                  </div>
                  <span className="text-[10px] text-slate-400">
                    {new Date(n.createdAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

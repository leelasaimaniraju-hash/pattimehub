import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { StatusBadge } from '../../components/common/StatusBadge';
import { useAuth } from '../../context/AuthContext';
import { Job, JobApplication, NotificationItem } from '../../types';
import { collection, query, where, getDocs, limit, doc, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import {
  Briefcase,
  Users,
  CheckSquare,
  Clock,
  PlusCircle,
  Building2,
  Bell,
  Check,
  X,
  ExternalLink,
} from 'lucide-react';

export const EmployerDashboard: React.FC = () => {
  const { currentUser, employerProfile, userProfile } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadEmployerData() {
      if (!currentUser?.uid) return;
      setLoading(true);
      try {
        // Fetch employer's jobs
        const jobsQ = query(
          collection(db, 'jobs'),
          where('employerId', '==', currentUser.uid)
        );
        const jobsSnap = await getDocs(jobsQ);
        const jList: Job[] = [];
        jobsSnap.forEach((doc) => jList.push(doc.data() as Job));
        setJobs(jList);

        // Fetch applications for employer's jobs
        const appQ = query(
          collection(db, 'applications'),
          where('employerId', '==', currentUser.uid)
        );
        const appSnap = await getDocs(appQ);
        const aList: JobApplication[] = [];
        appSnap.forEach((doc) => aList.push(doc.data() as JobApplication));
        aList.sort((a, b) => new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime());
        setApplications(aList);

        // Fetch notifications
        const notifQ = query(
          collection(db, 'notifications'),
          where('recipientUid', '==', currentUser.uid),
          limit(5)
        );
        const notifSnap = await getDocs(notifQ);
        const nList: NotificationItem[] = [];
        notifSnap.forEach((doc) => nList.push(doc.data() as NotificationItem));
        setNotifications(nList);
      } catch (err) {
        console.error('Error loading employer dashboard:', err);
      } finally {
        setLoading(false);
      }
    }

    loadEmployerData();
  }, [currentUser]);

  const activeJobs = jobs.filter((j) => j.status === 'approved').length;
  const pendingJobs = jobs.filter((j) => j.status === 'pending').length;
  const shortlistedCount = applications.filter((a) => a.status === 'shortlisted').length;

  const handleUpdateAppStatus = async (appId: string, newStatus: 'shortlisted' | 'accepted' | 'rejected') => {
    try {
      await updateDoc(doc(db, 'applications', appId), {
        status: newStatus,
        updatedAt: new Date().toISOString(),
      });

      const targetApp = applications.find((a) => a.applicationId === appId);
      if (targetApp) {
        // Notify candidate
        const notifId = `notif_${Date.now()}`;
        await setDoc(doc(db, 'notifications', notifId), {
          notificationId: notifId,
          recipientUid: targetApp.jobSeekerId,
          title: `Application Status Updated: ${newStatus.toUpperCase()}`,
          message: `${employerProfile?.companyName || 'The employer'} updated your application for ${targetApp.jobTitle} to ${newStatus}`,
          type: 'status_change',
          relatedJobId: targetApp.jobId,
          relatedApplicationId: appId,
          isRead: false,
          createdAt: new Date().toISOString(),
        });
      }

      setApplications((prev) =>
        prev.map((a) => (a.applicationId === appId ? { ...a, status: newStatus } : a))
      );
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  return (
    <DashboardLayout
      title={employerProfile?.companyName || userProfile?.fullName || 'Employer Panel'}
      subtitle="Recruit nearby talent and manage job posts"
    >
      <div className="space-y-8">
        {/* Company Verification Status Header Banner */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-sm text-slate-900 block">Verification Status</span>
              <span className="text-xs text-slate-500">Admin verification status for public trust</span>
            </div>
          </div>
          <StatusBadge status={employerProfile?.verificationStatus || 'pending'} type="employer" />
        </div>

        {/* Metric Cards Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500">Active Approved Jobs</span>
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                <Briefcase className="w-5 h-5" />
              </div>
            </div>
            <div className="text-2xl font-extrabold text-slate-900">{activeJobs}</div>
            <Link to="/employer/jobs" className="text-[11px] text-emerald-600 font-medium hover:underline block mt-1">
              Manage listings →
            </Link>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500">Pending Admin Approval</span>
              <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                <Clock className="w-5 h-5" />
              </div>
            </div>
            <div className="text-2xl font-extrabold text-slate-900">{pendingJobs}</div>
            <span className="text-[11px] text-slate-400 block mt-1">Review queue</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500">Total Applicants</span>
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <div className="text-2xl font-extrabold text-slate-900">{applications.length}</div>
            <Link to="/employer/applications" className="text-[11px] text-indigo-600 font-medium hover:underline block mt-1">
              View candidate list →
            </Link>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500">Shortlisted Pipeline</span>
              <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                <CheckSquare className="w-5 h-5" />
              </div>
            </div>
            <div className="text-2xl font-extrabold text-blue-600">{shortlistedCount}</div>
            <Link to="/employer/shortlisted" className="text-[11px] text-blue-600 font-medium hover:underline block mt-1">
              Manage shortlisted →
            </Link>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center justify-between bg-indigo-600 text-white p-6 rounded-2xl shadow-md">
          <div>
            <h3 className="text-lg font-bold">Have a new shift or role open?</h3>
            <p className="text-xs text-indigo-100 mt-1">
              Publish a new part-time job with location coordinates in less than 2 minutes.
            </p>
          </div>
          <Link
            to="/employer/post-job"
            className="px-5 py-2.5 bg-white text-indigo-600 rounded-xl text-xs font-bold shadow-xs hover:bg-indigo-50 transition-colors shrink-0 flex items-center gap-2"
          >
            <PlusCircle className="w-4 h-4" /> Post New Job
          </Link>
        </div>

        {/* Recent Applications Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-600" /> Recent Candidate Applications
            </h2>
            <Link to="/employer/applications" className="text-xs text-indigo-600 font-semibold hover:underline">
              View All Applications →
            </Link>
          </div>

          {applications.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase">
                  <tr>
                    <th className="p-3">Candidate</th>
                    <th className="p-3">Applied Job</th>
                    <th className="p-3">Applied Date</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Quick Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {applications.slice(0, 5).map((app) => (
                    <tr key={app.applicationId} className="hover:bg-slate-50/80">
                      <td className="p-3 font-semibold text-slate-900">
                        <div>{app.jobSeekerName}</div>
                        <div className="text-[10px] text-slate-400 font-normal">{app.jobSeekerEmail}</div>
                      </td>
                      <td className="p-3 text-slate-700">{app.jobTitle}</td>
                      <td className="p-3 text-slate-500">
                        {new Date(app.appliedAt).toLocaleDateString()}
                      </td>
                      <td className="p-3">
                        <StatusBadge status={app.status} type="application" />
                      </td>
                      <td className="p-3 text-right space-x-1">
                        {app.status === 'pending' && (
                          <button
                            onClick={() => handleUpdateAppStatus(app.applicationId, 'shortlisted')}
                            className="px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded text-[11px] font-semibold"
                          >
                            Shortlist
                          </button>
                        )}
                        {app.status === 'shortlisted' && (
                          <button
                            onClick={() => handleUpdateAppStatus(app.applicationId, 'accepted')}
                            className="px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded text-[11px] font-semibold"
                          >
                            Accept
                          </button>
                        )}
                        {app.status !== 'rejected' && app.status !== 'accepted' && (
                          <button
                            onClick={() => handleUpdateAppStatus(app.applicationId, 'rejected')}
                            className="px-2 py-1 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded text-[11px] font-semibold"
                          >
                            Reject
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-xs text-slate-400">
              No applications received yet for your posted jobs.
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

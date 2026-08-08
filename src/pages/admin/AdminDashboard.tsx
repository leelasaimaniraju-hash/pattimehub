import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Job, EmployerProfile, UserProfile, JobApplication, ActivityLog } from '../../types';
import { collection, getDocs, doc, updateDoc, setDoc, limit, query, orderBy } from 'firebase/firestore';
import { db } from '../../firebase/config';
import {
  ShieldAlert,
  Briefcase,
  Building2,
  Users,
  FileCheck,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  Activity,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [employers, setEmployers] = useState<EmployerProfile[]>([]);
  const [seekersCount, setSeekersCount] = useState(0);
  const [applicationsCount, setApplicationsCount] = useState(0);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAdminData() {
      setLoading(true);
      try {
        // Fetch jobs
        const jobsSnap = await getDocs(collection(db, 'jobs'));
        const jList: Job[] = [];
        jobsSnap.forEach((d) => jList.push(d.data() as Job));
        setJobs(jList);

        // Fetch employers
        const empSnap = await getDocs(collection(db, 'employers'));
        const eList: EmployerProfile[] = [];
        empSnap.forEach((d) => eList.push(d.data() as EmployerProfile));
        setEmployers(eList);

        // Fetch user profiles to count job seekers
        const usersSnap = await getDocs(collection(db, 'users'));
        let seekerCounter = 0;
        usersSnap.forEach((d) => {
          if ((d.data() as UserProfile).role === 'jobSeeker') seekerCounter++;
        });
        setSeekersCount(seekerCounter);

        // Fetch applications count
        const appSnap = await getDocs(collection(db, 'applications'));
        setApplicationsCount(appSnap.size);

        // Fetch activity logs
        const logsQ = query(collection(db, 'activityLogs'), limit(8));
        const logsSnap = await getDocs(logsQ);
        const lList: ActivityLog[] = [];
        logsSnap.forEach((d) => lList.push(d.data() as ActivityLog));
        lList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setActivityLogs(lList);
      } catch (err) {
        console.error('Error loading admin dashboard:', err);
      } finally {
        setLoading(false);
      }
    }

    loadAdminData();
  }, []);

  const pendingJobs = jobs.filter((j) => j.status === 'pending');
  const approvedJobs = jobs.filter((j) => j.status === 'approved').length;
  const pendingEmployers = employers.filter((e) => e.verificationStatus === 'pending').length;

  const handleApproveJob = async (jobId: string) => {
    try {
      await updateDoc(doc(db, 'jobs', jobId), {
        status: 'approved',
        updatedAt: new Date().toISOString(),
      });

      const targetJob = jobs.find((j) => j.jobId === jobId);
      if (targetJob) {
        // Notify employer
        const notifId = `notif_${Date.now()}`;
        await setDoc(doc(db, 'notifications', notifId), {
          notificationId: notifId,
          recipientUid: targetJob.employerId,
          title: 'Job Post Approved & Published!',
          message: `Your job posting "${targetJob.title}" has been approved by admin and is now live publicly.`,
          type: 'status_change',
          relatedJobId: jobId,
          isRead: false,
          createdAt: new Date().toISOString(),
        });
      }

      setJobs((prev) =>
        prev.map((j) => (j.jobId === jobId ? { ...j, status: 'approved' } : j))
      );
    } catch (err) {
      console.error('Error approving job:', err);
    }
  };

  const handleRejectJob = async (jobId: string) => {
    try {
      await updateDoc(doc(db, 'jobs', jobId), {
        status: 'rejected',
        updatedAt: new Date().toISOString(),
      });
      setJobs((prev) =>
        prev.map((j) => (j.jobId === jobId ? { ...j, status: 'rejected' } : j))
      );
    } catch (err) {
      console.error('Error rejecting job:', err);
    }
  };

  return (
    <DashboardLayout
      title="Platform Administrative Control"
      subtitle="Moderation, employer verification, job approvals, and safety oversight"
    >
      <div className="space-y-8">
        {/* Top Priority Warning Banner for Pending Reviews */}
        {pendingJobs.length > 0 && (
          <div className="p-4 bg-amber-500 text-white rounded-2xl shadow-md flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Clock className="w-6 h-6 shrink-0" />
              <div>
                <h3 className="text-sm font-bold">
                  {pendingJobs.length} Job Listing(s) Pending Admin Approval
                </h3>
                <p className="text-xs text-amber-100">
                  Review and verify employer postings before publishing them to job seekers.
                </p>
              </div>
            </div>
            <Link
              to="/admin/pending-jobs"
              className="px-4 py-2 bg-white text-amber-900 rounded-xl text-xs font-bold hover:bg-amber-50 shrink-0"
            >
              Review Queue →
            </Link>
          </div>
        )}

        {/* Global Metrics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500">Pending Job Moderations</span>
              <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                <Clock className="w-5 h-5" />
              </div>
            </div>
            <div className="text-2xl font-extrabold text-amber-600">{pendingJobs.length}</div>
            <Link to="/admin/pending-jobs" className="text-[11px] text-amber-700 font-medium hover:underline block mt-1">
              Review pending →
            </Link>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500">Approved Live Jobs</span>
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                <Briefcase className="w-5 h-5" />
              </div>
            </div>
            <div className="text-2xl font-extrabold text-slate-900">{approvedJobs}</div>
            <span className="text-[11px] text-slate-400 block mt-1">Publicly searchable</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500">Registered Employers</span>
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                <Building2 className="w-5 h-5" />
              </div>
            </div>
            <div className="text-2xl font-extrabold text-slate-900">{employers.length}</div>
            <Link to="/admin/employers" className="text-[11px] text-indigo-600 font-medium hover:underline block mt-1">
              {pendingEmployers > 0 ? `${pendingEmployers} pending verification` : 'Manage accounts'} →
            </Link>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500">Active Job Seekers</span>
              <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <div className="text-2xl font-extrabold text-slate-900">{seekersCount}</div>
            <Link to="/admin/seekers" className="text-[11px] text-blue-600 font-medium hover:underline block mt-1">
              View user list →
            </Link>
          </div>
        </div>

        {/* Pending Approval Jobs Table */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-amber-600" /> Pending Job Approvals Queue
            </h2>
            <Link to="/admin/pending-jobs" className="text-xs font-semibold text-indigo-600 hover:underline">
              View Full Queue →
            </Link>
          </div>

          {pendingJobs.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase">
                  <tr>
                    <th className="p-3">Job Title</th>
                    <th className="p-3">Employer</th>
                    <th className="p-3">Pay Rate</th>
                    <th className="p-3">Location Address</th>
                    <th className="p-3 text-right">Moderation Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pendingJobs.slice(0, 5).map((job) => (
                    <tr key={job.jobId} className="hover:bg-slate-50/80">
                      <td className="p-3 font-bold text-slate-900">{job.title}</td>
                      <td className="p-3 text-slate-700">{job.employerName}</td>
                      <td className="p-3 font-semibold text-emerald-700">
                        ${job.payAmount.toFixed(2)}/{job.payFrequency.replace('per_', '')}
                      </td>
                      <td className="p-3 text-slate-500">{job.address}</td>
                      <td className="p-3 text-right space-x-2">
                        <button
                          onClick={() => handleApproveJob(job.jobId)}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded text-xs shadow-xs"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleRejectJob(job.jobId)}
                          className="px-3 py-1 bg-rose-50 text-rose-700 hover:bg-rose-100 font-semibold rounded text-xs"
                        >
                          Reject
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-xs text-slate-400">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              All posted job listings have been reviewed and moderated. Queue clear!
            </div>
          )}
        </div>

        {/* Activity Logs Stream */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Activity className="w-5 h-5 text-indigo-600" /> Platform Audit Activity Log
            </h3>
            <Link to="/admin/logs" className="text-xs text-indigo-600 font-semibold hover:underline">
              View Audit Logs →
            </Link>
          </div>

          <div className="space-y-2">
            {activityLogs.map((log) => (
              <div key={log.logId} className="p-3 bg-slate-50 rounded-xl text-xs flex justify-between items-center">
                <div>
                  <span className="font-bold text-slate-900">{log.actorName}</span>{' '}
                  <span className="text-slate-600">{log.description}</span>
                </div>
                <span className="text-[10px] text-slate-400 font-medium">
                  {new Date(log.createdAt).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Job, EmployerProfile, UserProfile, ActivityLog } from '../../types';
import { collection, getDocs, doc, updateDoc, deleteDoc, setDoc, limit, query, where, orderBy } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../context/AuthContext';
import { seedSampleDatabaseIfNeeded, generateSampleJobs, SAMPLE_EMPLOYERS } from '../../services/seedData';
import {
  ShieldAlert,
  Briefcase,
  Building2,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  Activity,
  Search,
  Filter,
  Trash2,
  Star,
  ExternalLink,
  RefreshCw,
  Database,
  PlusCircle,
  Check,
  Ban,
  Eye,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { currentUser, userLocation } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'jobs' | 'employers' | 'seekers' | 'database'>('overview');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [employers, setEmployers] = useState<EmployerProfile[]>([]);
  const [seekers, setSeekers] = useState<UserProfile[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Search and filter states
  const [jobSearch, setJobSearch] = useState('');
  const [jobStatusFilter, setJobStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [empSearch, setEmpSearch] = useState('');
  const [empFilter, setEmpFilter] = useState<'all' | 'verified' | 'pending'>('all');
  const [seekerSearch, setSeekerSearch] = useState('');

  // Inspection modal
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      // 1. Fetch jobs
      const jobsSnap = await getDocs(collection(db, 'jobs'));
      const jList: Job[] = [];
      jobsSnap.forEach((d) => jList.push(d.data() as Job));
      jList.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      setJobs(jList);

      // 2. Fetch employers
      const empSnap = await getDocs(collection(db, 'employers'));
      const eList: EmployerProfile[] = [];
      empSnap.forEach((d) => eList.push(d.data() as EmployerProfile));
      setEmployers(eList);

      // 3. Fetch user profiles to list job seekers
      const usersSnap = await getDocs(collection(db, 'users'));
      const sList: UserProfile[] = [];
      usersSnap.forEach((d) => {
        const u = d.data() as UserProfile;
        if (u.role === 'jobSeeker') sList.push(u);
      });
      setSeekers(sList);

      // 4. Fetch activity logs
      try {
        const logsSnap = await getDocs(collection(db, 'activityLogs'));
        const lList: ActivityLog[] = [];
        logsSnap.forEach((d) => lList.push(d.data() as ActivityLog));
        lList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setActivityLogs(lList.slice(0, 10));
      } catch (e) {
        // logs table might be empty
      }
    } catch (err) {
      console.error('Error loading admin dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const showNotification = (msg: string) => {
    setActionMessage(msg);
    setTimeout(() => setActionMessage(null), 4000);
  };

  const logAdminAction = async (action: string, description: string, targetType: string = 'system', targetId: string = 'global') => {
    try {
      const logId = `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const newLog: ActivityLog = {
        logId,
        actorUid: currentUser?.uid || 'admin',
        actorName: 'Admin Moderator',
        actorRole: 'admin',
        action,
        targetType,
        targetId,
        description,
        createdAt: new Date().toISOString(),
      };
      await setDoc(doc(db, 'activityLogs', logId), newLog);
      setActivityLogs((prev) => [newLog, ...prev.slice(0, 9)]);
    } catch (e) {
      console.warn('Logging action notice:', e);
    }
  };

  // Job moderation actions
  const handleApproveJob = async (jobId: string) => {
    try {
      await updateDoc(doc(db, 'jobs', jobId), {
        status: 'approved',
        updatedAt: new Date().toISOString(),
      });

      const targetJob = jobs.find((j) => j.jobId === jobId);
      if (targetJob) {
        // Send notification to employer
        const notifId = `notif_${Date.now()}`;
        await setDoc(doc(db, 'notifications', notifId), {
          notificationId: notifId,
          recipientUid: targetJob.employerId,
          title: 'Job Approved & Published!',
          message: `Your job posting "${targetJob.title}" has been reviewed by admin and is now live publicly.`,
          type: 'status_change',
          relatedJobId: jobId,
          isRead: false,
          createdAt: new Date().toISOString(),
        });
      }

      setJobs((prev) =>
        prev.map((j) => (j.jobId === jobId ? { ...j, status: 'approved' } : j))
      );
      await logAdminAction('Job Approved', `Approved listing ${jobId}`);
      showNotification('Job posting successfully approved and published live!');
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
      await logAdminAction('Job Rejected', `Rejected listing ${jobId}`);
      showNotification('Job listing marked as rejected.');
    } catch (err) {
      console.error('Error rejecting job:', err);
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    if (!window.confirm('Are you sure you want to permanently delete this job listing?')) return;
    try {
      await deleteDoc(doc(db, 'jobs', jobId));
      setJobs((prev) => prev.filter((j) => j.jobId !== jobId));
      if (selectedJob?.jobId === jobId) setSelectedJob(null);
      await logAdminAction('Job Deleted', `Permanently removed job ${jobId}`);
      showNotification('Job listing permanently removed from Firestore.');
    } catch (err) {
      console.error('Error deleting job:', err);
    }
  };

  // Employer verification actions
  const handleToggleEmployerVerification = async (employerId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'verified' ? 'pending' : 'verified';
    try {
      await updateDoc(doc(db, 'employers', employerId), {
        verificationStatus: nextStatus,
        updatedAt: new Date().toISOString(),
      });
      setEmployers((prev) =>
        prev.map((e) => (e.employerId === employerId ? { ...e, verificationStatus: nextStatus as any } : e))
      );
      await logAdminAction('Employer Verification', `Set verification status of employer ${employerId} to ${nextStatus}`);
      showNotification(`Employer verification updated to: ${nextStatus.toUpperCase()}`);
    } catch (err) {
      console.error('Error toggling employer verification:', err);
    }
  };

  // Seeker account toggle
  const handleToggleSeekerStatus = async (uid: string, currentStatus?: string) => {
    const nextStatus = currentStatus === 'suspended' ? 'active' : 'suspended';
    try {
      await updateDoc(doc(db, 'users', uid), {
        accountStatus: nextStatus,
        updatedAt: new Date().toISOString(),
      });
      setSeekers((prev) =>
        prev.map((s) => (s.uid === uid ? { ...s, accountStatus: nextStatus as any } : s))
      );
      await logAdminAction('User Status Change', `Changed seeker ${uid} account status to ${nextStatus}`);
      showNotification(`User account is now ${nextStatus.toUpperCase()}`);
    } catch (err) {
      console.error('Error updating user status:', err);
    }
  };

  // Database tools
  const handleSeedSampleData = async () => {
    if (!window.confirm('Seed sample employers and local job listings into your live Firestore database?')) return;
    setLoading(true);
    try {
      const lat = userLocation?.latitude || 40.7128;
      const lng = userLocation?.longitude || -74.0060;

      // Seed Employers
      for (const emp of SAMPLE_EMPLOYERS) {
        const now = new Date().toISOString();
        await setDoc(doc(db, 'employers', emp.employerId), {
          ...emp,
          createdAt: now,
          updatedAt: now,
        });

        await setDoc(doc(db, 'users', emp.uid), {
          uid: emp.uid,
          fullName: emp.companyName,
          email: `contact@${emp.employerId}.com`,
          phone: emp.phone,
          role: 'employer',
          city: emp.city,
          locationName: `${emp.address}, ${emp.city}`,
          latitude: emp.latitude,
          longitude: emp.longitude,
          geohash: emp.geohash,
          accountStatus: 'active',
          createdAt: now,
          updatedAt: now,
        });
      }

      // Seed Jobs
      const sampleJobs = generateSampleJobs(lat, lng);
      for (const job of sampleJobs) {
        await setDoc(doc(db, 'jobs', job.jobId), job);
      }

      await logAdminAction('Database Seeded', 'Seeded sample employers & jobs into Firestore');
      await loadAdminData();
      showNotification('Sample data successfully seeded into Firestore!');
    } catch (err: any) {
      console.error('Error seeding data:', err);
      showNotification(`Seeding error: ${err.message || 'Failed'}`);
    } finally {
      setLoading(false);
    }
  };

  // Filtered lists
  const pendingJobs = jobs.filter((j) => j.status === 'pending');
  const approvedJobs = jobs.filter((j) => j.status === 'approved');
  const rejectedJobs = jobs.filter((j) => j.status === 'rejected');

  const filteredJobs = jobs.filter((j) => {
    const matchesSearch =
      j.title.toLowerCase().includes(jobSearch.toLowerCase()) ||
      j.employerName.toLowerCase().includes(jobSearch.toLowerCase()) ||
      (j.address || '').toLowerCase().includes(jobSearch.toLowerCase());
    const matchesStatus = jobStatusFilter === 'all' || j.status === jobStatusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredEmployers = employers.filter((e) => {
    const matchesSearch =
      e.companyName.toLowerCase().includes(empSearch.toLowerCase()) ||
      e.category.toLowerCase().includes(empSearch.toLowerCase()) ||
      (e.city || '').toLowerCase().includes(empSearch.toLowerCase());
    const matchesFilter = empFilter === 'all' || e.verificationStatus === empFilter;
    return matchesSearch && matchesFilter;
  });

  const filteredSeekers = seekers.filter((s) => {
    const matchesSearch =
      s.fullName.toLowerCase().includes(seekerSearch.toLowerCase()) ||
      s.email.toLowerCase().includes(seekerSearch.toLowerCase()) ||
      (s.city || '').toLowerCase().includes(seekerSearch.toLowerCase()) ||
      (s.skills || []).some((skill) => skill.toLowerCase().includes(seekerSearch.toLowerCase()));
    return matchesSearch;
  });

  return (
    <DashboardLayout
      title="Platform Administrative Control"
      subtitle="Complete moderation suite for job approvals, verified employers, seeker accounts, and database tools"
    >
      <div className="space-y-6 font-sans">
        {/* Action toast message */}
        {actionMessage && (
          <div className="p-4 bg-indigo-600 text-white rounded-2xl shadow-lg flex items-center justify-between text-xs font-semibold animate-in fade-in duration-200">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>{actionMessage}</span>
            </div>
            <button onClick={() => setActionMessage(null)} className="text-indigo-200 hover:text-white">
              ✕
            </button>
          </div>
        )}

        {/* Priority Pending Approval Banner */}
        {pendingJobs.length > 0 && (
          <div className="p-4 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-2xl shadow-md flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-xl">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-bold">
                  {pendingJobs.length} Job Listing(s) Awaiting Moderation
                </h3>
                <p className="text-xs text-amber-100">
                  Review submitted postings to ensure policy compliance before making them publicly searchable.
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setActiveTab('jobs');
                setJobStatusFilter('pending');
              }}
              className="px-4 py-2 bg-white text-amber-900 rounded-xl text-xs font-bold hover:bg-amber-50 transition-colors shrink-0 shadow-xs"
            >
              Review Now →
            </button>
          </div>
        )}

        {/* Global Summary Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div
            onClick={() => {
              setActiveTab('jobs');
              setJobStatusFilter('pending');
            }}
            className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs cursor-pointer hover:border-amber-400 transition-all"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500">Pending Approvals</span>
              <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                <Clock className="w-5 h-5" />
              </div>
            </div>
            <div className="text-2xl font-black text-amber-600">{pendingJobs.length}</div>
            <span className="text-[11px] text-amber-700 font-medium block mt-1">Requires review</span>
          </div>

          <div
            onClick={() => {
              setActiveTab('jobs');
              setJobStatusFilter('approved');
            }}
            className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs cursor-pointer hover:border-emerald-400 transition-all"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500">Active Live Jobs</span>
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                <Briefcase className="w-5 h-5" />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900">{approvedJobs.length}</div>
            <span className="text-[11px] text-slate-400 block mt-1">
              {jobs.length} total postings
            </span>
          </div>

          <div
            onClick={() => setActiveTab('employers')}
            className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs cursor-pointer hover:border-indigo-400 transition-all"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500">Registered Employers</span>
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                <Building2 className="w-5 h-5" />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900">{employers.length}</div>
            <span className="text-[11px] text-indigo-600 font-medium block mt-1">
              {employers.filter((e) => e.verificationStatus === 'verified').length} verified businesses
            </span>
          </div>

          <div
            onClick={() => setActiveTab('seekers')}
            className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs cursor-pointer hover:border-blue-400 transition-all"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500">Registered Job Seekers</span>
              <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900">{seekers.length}</div>
            <span className="text-[11px] text-blue-600 font-medium block mt-1">
              Candidate database
            </span>
          </div>
        </div>

        {/* Tab Navigation Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                activeTab === 'overview'
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Overview & Activity
            </button>
            <button
              onClick={() => setActiveTab('jobs')}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ${
                activeTab === 'jobs'
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Manage Jobs</span>
              {pendingJobs.length > 0 && (
                <span className="px-1.5 py-0.2 bg-amber-500 text-white rounded-full text-[10px]">
                  {pendingJobs.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('employers')}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                activeTab === 'employers'
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Employers ({employers.length})
            </button>
            <button
              onClick={() => setActiveTab('seekers')}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                activeTab === 'seekers'
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Job Seekers ({seekers.length})
            </button>
            <button
              onClick={() => setActiveTab('database')}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1 ${
                activeTab === 'database'
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span>Platform Tools</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadAdminData}
              disabled={loading}
              className="p-2 text-slate-600 hover:bg-slate-100 rounded-xl border border-slate-200 text-xs font-medium flex items-center gap-1.5"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>

        {/* TAB 1: OVERVIEW & AUDIT STREAM */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Quick Pending Table */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <ShieldAlert className="w-5 h-5 text-amber-500" /> Pending Moderation Queue
                  </h3>
                  <p className="text-xs text-slate-500">Unpublished postings waiting for verification</p>
                </div>
                {pendingJobs.length > 0 && (
                  <button
                    onClick={() => {
                      setActiveTab('jobs');
                      setJobStatusFilter('pending');
                    }}
                    className="text-xs font-bold text-indigo-600 hover:underline"
                  >
                    View All ({pendingJobs.length}) →
                  </button>
                )}
              </div>

              {pendingJobs.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase">
                      <tr>
                        <th className="p-3">Title</th>
                        <th className="p-3">Employer</th>
                        <th className="p-3">Pay Rate</th>
                        <th className="p-3">Location</th>
                        <th className="p-3 text-right">Moderation Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {pendingJobs.slice(0, 5).map((job) => (
                        <tr key={job.jobId} className="hover:bg-slate-50/80">
                          <td className="p-3 font-bold text-slate-900">
                            <button
                              onClick={() => setSelectedJob(job)}
                              className="hover:text-indigo-600 text-left"
                            >
                              {job.title}
                            </button>
                          </td>
                          <td className="p-3 text-slate-700">{job.employerName}</td>
                          <td className="p-3 font-semibold text-emerald-700">
                            ${job.payAmount.toFixed(2)}/{job.payFrequency.replace('per_', '')}
                          </td>
                          <td className="p-3 text-slate-500 max-w-[160px] truncate">{job.address}</td>
                          <td className="p-3 text-right space-x-2">
                            <button
                              onClick={() => handleApproveJob(job.jobId)}
                              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-xs shadow-xs"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleRejectJob(job.jobId)}
                              className="px-3 py-1 bg-rose-50 text-rose-700 hover:bg-rose-100 font-semibold rounded-lg text-xs"
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
                <div className="text-center py-8 text-xs text-slate-400 bg-slate-50 rounded-2xl">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                  All job postings are moderated. No pending listings in queue.
                </div>
              )}
            </div>

            {/* Audit Log Stream */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-indigo-600" /> Platform Security & Audit Trail
                  </h3>
                  <p className="text-xs text-slate-500">Live record of moderation actions and administrative events</p>
                </div>
                <Link to="/admin/logs" className="text-xs font-bold text-indigo-600 hover:underline">
                  Full Audit Log →
                </Link>
              </div>

              {activityLogs.length > 0 ? (
                <div className="space-y-2">
                  {activityLogs.map((log) => (
                    <div
                      key={log.logId}
                      className="p-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-1"
                    >
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-md font-bold text-[10px]">
                          {log.action}
                        </span>
                        <span className="text-slate-700">{log.description}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {new Date(log.createdAt).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-xs text-slate-400">
                  No recent audit activity recorded yet.
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: MANAGE JOBS */}
        {activeTab === 'jobs' && (
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-5">
            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search jobs by title, company, or address..."
                  value={jobSearch}
                  onChange={(e) => setJobSearch(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900 placeholder:text-slate-400"
                />
              </div>

              <div className="flex items-center gap-1.5">
                {(['all', 'pending', 'approved', 'rejected'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setJobStatusFilter(st)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-xl capitalize transition-colors ${
                      jobStatusFilter === st
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Jobs Table */}
            {filteredJobs.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase">
                    <tr>
                      <th className="p-3.5">Job Title</th>
                      <th className="p-3.5">Employer</th>
                      <th className="p-3.5">Category</th>
                      <th className="p-3.5">Rate</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredJobs.map((job) => (
                      <tr key={job.jobId} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3.5 font-bold text-slate-900">
                          <button
                            onClick={() => setSelectedJob(job)}
                            className="hover:text-indigo-600 text-left font-bold"
                          >
                            {job.title}
                          </button>
                          <div className="text-[10px] text-slate-400 font-normal">{job.address}</div>
                        </td>
                        <td className="p-3.5 text-slate-700">{job.employerName}</td>
                        <td className="p-3.5 text-slate-600">{job.category}</td>
                        <td className="p-3.5 font-semibold text-emerald-700">
                          ${job.payAmount.toFixed(2)}/{job.payFrequency.replace('per_', '')}
                        </td>
                        <td className="p-3.5">
                          <StatusBadge status={job.status} type="job" />
                        </td>
                        <td className="p-3.5 text-right space-x-1.5">
                          <button
                            onClick={() => setSelectedJob(job)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"
                            title="Inspect Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {job.status !== 'approved' && (
                            <button
                              onClick={() => handleApproveJob(job.jobId)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[11px]"
                            >
                              Approve
                            </button>
                          )}
                          {job.status !== 'rejected' && (
                            <button
                              onClick={() => handleRejectJob(job.jobId)}
                              className="px-2.5 py-1 bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold rounded-lg text-[11px]"
                            >
                              Reject
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteJob(job.jobId)}
                            className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg"
                            title="Delete Posting"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-10 text-xs text-slate-400">
                No job postings found matching your search and filter criteria.
              </div>
            )}
          </div>
        )}

        {/* TAB 3: MANAGE EMPLOYERS */}
        {activeTab === 'employers' && (
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-5">
            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search employer by business name, city, or phone..."
                  value={empSearch}
                  onChange={(e) => setEmpSearch(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900 placeholder:text-slate-400"
                />
              </div>

              <div className="flex items-center gap-1.5">
                {(['all', 'verified', 'pending'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setEmpFilter(st)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-xl capitalize transition-colors ${
                      empFilter === st
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Employers Table */}
            {filteredEmployers.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase">
                    <tr>
                      <th className="p-3.5">Company Details</th>
                      <th className="p-3.5">Category</th>
                      <th className="p-3.5">Phone</th>
                      <th className="p-3.5">City</th>
                      <th className="p-3.5">Verification</th>
                      <th className="p-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredEmployers.map((emp) => (
                      <tr key={emp.employerId} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3.5 font-bold text-slate-900">
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                              <Building2 className="w-4 h-4" />
                            </div>
                            <div>
                              <div>{emp.companyName}</div>
                              <div className="text-[10px] text-slate-400 font-normal">{emp.address}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-3.5 text-slate-600">{emp.category}</td>
                        <td className="p-3.5 text-slate-600">{emp.phone}</td>
                        <td className="p-3.5 text-slate-600">{emp.city}</td>
                        <td className="p-3.5">
                          <StatusBadge status={emp.verificationStatus} type="employer" />
                        </td>
                        <td className="p-3.5 text-right">
                          <button
                            onClick={() => handleToggleEmployerVerification(emp.employerId, emp.verificationStatus)}
                            className={`px-3 py-1.5 rounded-xl font-bold text-xs border transition-colors ${
                              emp.verificationStatus === 'verified'
                                ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                                : 'bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700 shadow-xs'
                            }`}
                          >
                            {emp.verificationStatus === 'verified' ? 'Revoke Verification' : 'Verify Business'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-10 text-xs text-slate-400">
                No employer accounts found matching your query.
              </div>
            )}
          </div>
        )}

        {/* TAB 4: MANAGE JOB SEEKERS */}
        {activeTab === 'seekers' && (
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-5">
            <div className="relative max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search job seekers by name, email, city, or skill..."
                value={seekerSearch}
                onChange={(e) => setSeekerSearch(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900 placeholder:text-slate-400"
              />
            </div>

            {filteredSeekers.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase">
                    <tr>
                      <th className="p-3.5">Candidate Name</th>
                      <th className="p-3.5">Email</th>
                      <th className="p-3.5">Phone</th>
                      <th className="p-3.5">Location</th>
                      <th className="p-3.5">Skills</th>
                      <th className="p-3.5 text-right">Account Control</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredSeekers.map((seeker) => (
                      <tr key={seeker.uid} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3.5 font-bold text-slate-900">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs">
                              {seeker.fullName.charAt(0)}
                            </div>
                            <span>{seeker.fullName}</span>
                          </div>
                        </td>
                        <td className="p-3.5 text-slate-600">{seeker.email}</td>
                        <td className="p-3.5 text-slate-600">{seeker.phone || 'N/A'}</td>
                        <td className="p-3.5 text-slate-600">{seeker.city || 'N/A'}</td>
                        <td className="p-3.5">
                          <div className="flex flex-wrap gap-1">
                            {(seeker.skills || []).slice(0, 3).map((s, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md text-[10px] font-semibold"
                              >
                                {s}
                              </span>
                            ))}
                            {(seeker.skills || []).length > 3 && (
                              <span className="text-[10px] text-slate-400">
                                +{(seeker.skills || []).length - 3}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-3.5 text-right">
                          <button
                            onClick={() => handleToggleSeekerStatus(seeker.uid, seeker.accountStatus)}
                            className={`px-3 py-1 rounded-xl text-xs font-semibold ${
                              seeker.accountStatus === 'suspended'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                                : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                            }`}
                          >
                            {seeker.accountStatus === 'suspended' ? 'Activate Account' : 'Suspend Account'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-10 text-xs text-slate-400">
                No job seeker accounts found.
              </div>
            )}
          </div>
        )}

        {/* TAB 5: DATABASE & SYSTEM TOOLS */}
        {activeTab === 'database' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Seeding Tool */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl w-fit">
                <Database className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Marketplace Seed Tool
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Quickly populate your Firestore database with realistic local businesses (Starbucks, Target, Logistics Courier, Tutoring Academy) and approved part-time job postings with real GPS coordinates.
              </p>
              <button
                onClick={handleSeedSampleData}
                disabled={loading}
                className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-200 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Seed Sample Employers & Jobs into Firestore</span>
              </button>
            </div>

            {/* System Status */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl w-fit">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Platform Health & Security
              </h3>
              <ul className="text-xs text-slate-600 space-y-2">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Firestore Connection: <strong>Online</strong></span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Role-Based Access Control: <strong>Enforced</strong></span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>GPS Geohashing Engine: <strong>Active</strong></span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Job Moderation Pipeline: <strong>Operational</strong></span>
                </li>
              </ul>
              <div className="pt-2">
                <Link
                  to="/admin/logs"
                  className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2"
                >
                  <Activity className="w-4 h-4" />
                  <span>Inspect Audit Activity Logs</span>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Job Details Modal */}
        {selectedJob && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
            <div className="bg-white rounded-3xl max-w-xl w-full p-6 space-y-5 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">{selectedJob.title}</h3>
                  <p className="text-xs text-slate-500">{selectedJob.employerName} • {selectedJob.category}</p>
                </div>
                <button
                  onClick={() => setSelectedJob(null)}
                  className="p-1 text-slate-400 hover:text-slate-700 text-sm font-bold"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                <div>
                  <span className="text-slate-400 block">Pay Rate:</span>
                  <span className="font-bold text-emerald-700">
                    ${selectedJob.payAmount.toFixed(2)}/{selectedJob.payFrequency.replace('per_', '')}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Status:</span>
                  <StatusBadge status={selectedJob.status} type="job" />
                </div>
                <div>
                  <span className="text-slate-400 block">Location:</span>
                  <span className="font-medium text-slate-700">{selectedJob.address}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Shift Timing:</span>
                  <span className="font-medium text-slate-700">{selectedJob.workingHours || 'Flexible'}</span>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <span className="font-bold text-slate-800">Job Description:</span>
                <p className="text-slate-600 bg-slate-50 p-3 rounded-xl leading-relaxed whitespace-pre-line">
                  {selectedJob.description}
                </p>
              </div>

              {selectedJob.requiredSkills && selectedJob.requiredSkills.length > 0 && (
                <div className="space-y-2 text-xs">
                  <span className="font-bold text-slate-800">Required Skills:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedJob.requiredSkills.map((sk, i) => (
                      <span key={i} className="px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg font-semibold text-[11px]">
                        {sk}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => handleDeleteJob(selectedJob.jobId)}
                  className="px-3 py-2 bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold rounded-xl text-xs flex items-center gap-1.5"
                >
                  <Trash2 className="w-4 h-4" /> Delete Posting
                </button>

                <div className="flex items-center gap-2">
                  {selectedJob.status !== 'approved' && (
                    <button
                      onClick={async () => {
                        await handleApproveJob(selectedJob.jobId);
                        setSelectedJob(null);
                      }}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-xs"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Approve & Publish
                    </button>
                  )}
                  {selectedJob.status !== 'rejected' && (
                    <button
                      onClick={async () => {
                        await handleRejectJob(selectedJob.jobId);
                        setSelectedJob(null);
                      }}
                      className="px-4 py-2 bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold rounded-xl text-xs"
                    >
                      Reject
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

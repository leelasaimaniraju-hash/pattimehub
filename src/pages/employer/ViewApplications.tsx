import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { StatusBadge } from '../../components/common/StatusBadge';
import { useAuth } from '../../context/AuthContext';
import { JobApplication } from '../../types';
import { collection, query, where, getDocs, doc, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { Users, Mail, Phone, Calendar, CheckSquare, CheckCircle2, XCircle, User } from 'lucide-react';

export const ViewApplications: React.FC = () => {
  const { currentUser, employerProfile } = useAuth();
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [selectedApp, setSelectedApp] = useState<JobApplication | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchApps() {
      if (!currentUser?.uid) return;
      setLoading(true);
      try {
        const q = query(
          collection(db, 'applications'),
          where('employerId', '==', currentUser.uid)
        );
        const snap = await getDocs(q);
        const loaded: JobApplication[] = [];
        snap.forEach((doc) => loaded.push(doc.data() as JobApplication));
        loaded.sort((a, b) => new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime());
        setApplications(loaded);
      } catch (err) {
        console.error('Error fetching applications:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchApps();
  }, [currentUser]);

  const handleUpdateStatus = async (appId: string, newStatus: 'shortlisted' | 'accepted' | 'rejected') => {
    try {
      await updateDoc(doc(db, 'applications', appId), {
        status: newStatus,
        updatedAt: new Date().toISOString(),
      });

      const targetApp = applications.find((a) => a.applicationId === appId);
      if (targetApp) {
        // Send candidate notification
        const notifId = `notif_${Date.now()}`;
        await setDoc(doc(db, 'notifications', notifId), {
          notificationId: notifId,
          recipientUid: targetApp.jobSeekerId,
          title: `Application Update: ${newStatus.toUpperCase()}`,
          message: `${employerProfile?.companyName || 'Employer'} marked your application for ${targetApp.jobTitle} as ${newStatus}`,
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

      if (selectedApp && selectedApp.applicationId === appId) {
        setSelectedApp((prev) => (prev ? { ...prev, status: newStatus } : null));
      }
    } catch (err) {
      console.error('Error updating application status:', err);
    }
  };

  const filtered = applications.filter((app) => {
    if (statusFilter !== 'all' && app.status !== statusFilter) return false;
    return true;
  });

  return (
    <DashboardLayout title="Candidate Applications" subtitle="Review applicant profiles and update hiring stages">
      <div className="space-y-6">
        <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-700">
            Total Candidates: <strong>{filtered.length}</strong>
          </span>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500 font-medium">Filter Stage:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="py-1 px-3 border border-slate-200 rounded-xl bg-white font-medium"
            >
              <option value="all">All Stages</option>
              <option value="pending">Pending</option>
              <option value="shortlisted">Shortlisted</option>
              <option value="accepted">Accepted</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 animate-pulse h-40"></div>
        ) : filtered.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* List Column */}
            <div className="lg:col-span-2 space-y-3">
              {filtered.map((app) => (
                <div
                  key={app.applicationId}
                  onClick={() => setSelectedApp(app)}
                  className={`p-4 bg-white rounded-2xl border transition-all cursor-pointer hover:border-indigo-300 ${
                    selectedApp?.applicationId === app.applicationId
                      ? 'border-indigo-600 shadow-sm ring-2 ring-indigo-500/10'
                      : 'border-slate-200'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                    <div>
                      <h3 className="font-bold text-sm text-slate-900">{app.jobSeekerName}</h3>
                      <p className="text-xs text-indigo-600 font-medium">{app.jobTitle}</p>
                    </div>
                    <StatusBadge status={app.status} type="application" />
                  </div>

                  <div className="flex items-center gap-4 text-xs text-slate-500 mt-2">
                    <span className="flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5 text-slate-400" /> {app.jobSeekerEmail}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {new Date(app.appliedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Candidate Inspector Drawer */}
            <div className="lg:col-span-1">
              {selectedApp ? (
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6 sticky top-24">
                  <div className="pb-4 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="font-bold text-base text-slate-900">Applicant Details</h3>
                    <StatusBadge status={selectedApp.status} type="application" />
                  </div>

                  <div className="space-y-4 text-xs">
                    <div>
                      <span className="text-slate-400 block font-medium">Candidate Name</span>
                      <strong className="text-slate-900 text-sm block">{selectedApp.jobSeekerName}</strong>
                    </div>

                    <div>
                      <span className="text-slate-400 block font-medium">Email</span>
                      <span className="text-slate-800">{selectedApp.jobSeekerEmail}</span>
                    </div>

                    <div>
                      <span className="text-slate-400 block font-medium">Phone</span>
                      <span className="text-slate-800">{selectedApp.jobSeekerPhone || 'Not provided'}</span>
                    </div>

                    {selectedApp.jobSeekerAbout && (
                      <div>
                        <span className="text-slate-400 block font-medium mb-1">About Bio</span>
                        <p className="text-slate-600 bg-slate-50 p-3 rounded-xl leading-relaxed">
                          {selectedApp.jobSeekerAbout}
                        </p>
                      </div>
                    )}

                    {selectedApp.jobSeekerSkills && selectedApp.jobSeekerSkills.length > 0 && (
                      <div>
                        <span className="text-slate-400 block font-medium mb-1">Listed Skills</span>
                        <div className="flex flex-wrap gap-1.5">
                          {selectedApp.jobSeekerSkills.map((s, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[11px] font-semibold"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Stage Action Buttons */}
                  <div className="pt-4 border-t border-slate-100 space-y-2">
                    <span className="text-xs font-semibold text-slate-700 block">Change Stage:</span>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => handleUpdateStatus(selectedApp.applicationId, 'shortlisted')}
                        className="py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl text-xs font-semibold transition-colors"
                      >
                        Shortlist
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(selectedApp.applicationId, 'accepted')}
                        className="py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-xl text-xs font-semibold transition-colors"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(selectedApp.applicationId, 'rejected')}
                        className="py-2 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-xl text-xs font-semibold transition-colors"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white p-8 text-center rounded-2xl border border-slate-200 text-xs text-slate-400">
                  Select an applicant from the list to view candidate profile & skills.
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white p-12 text-center rounded-2xl border border-slate-200">
            <Users className="w-12 h-12 text-slate-300 mx-auto mb-2" />
            <p className="text-xs text-slate-500">No candidate applications found for this filter.</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

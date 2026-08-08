import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { StatusBadge } from '../../components/common/StatusBadge';
import { useAuth } from '../../context/AuthContext';
import { JobApplication } from '../../types';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { CheckCircle2, Clock, CheckSquare, XCircle, Building2 } from 'lucide-react';

export const SeekerApplicationStatus: React.FC = () => {
  const { currentUser } = useAuth();
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchApps() {
      if (!currentUser?.uid) return;
      setLoading(true);
      try {
        const q = query(
          collection(db, 'applications'),
          where('jobSeekerId', '==', currentUser.uid)
        );
        const snap = await getDocs(q);
        const loaded: JobApplication[] = [];
        snap.forEach((doc) => loaded.push(doc.data() as JobApplication));
        setApplications(loaded);
      } catch (err) {
        console.error('Error loading application status:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchApps();
  }, [currentUser]);

  return (
    <DashboardLayout title="Application Status Timeline" subtitle="Visual hiring progress tracking for your submissions">
      <div className="space-y-6">
        {loading ? (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 animate-pulse h-40"></div>
        ) : applications.length > 0 ? (
          <div className="space-y-4">
            {applications.map((app) => (
              <div key={app.applicationId} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">{app.jobTitle}</h3>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                      <Building2 className="w-3.5 h-3.5" /> {app.employerName}
                    </p>
                  </div>
                  <StatusBadge status={app.status} type="application" />
                </div>

                {/* Progress Steps Bar */}
                <div className="pt-2">
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    {/* Step 1: Pending */}
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold mb-1 shadow-xs">
                        <Clock className="w-4 h-4" />
                      </div>
                      <span className="font-semibold text-slate-800">Submitted</span>
                      <span className="text-[10px] text-slate-400">Awaiting review</span>
                    </div>

                    {/* Step 2: Shortlisted */}
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center font-bold mb-1 shadow-xs ${
                          app.status === 'shortlisted' || app.status === 'accepted'
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-200 text-slate-400'
                        }`}
                      >
                        <CheckSquare className="w-4 h-4" />
                      </div>
                      <span className="font-semibold text-slate-800">Shortlisted</span>
                      <span className="text-[10px] text-slate-400">Employer interest</span>
                    </div>

                    {/* Step 3: Final Outcome */}
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center font-bold mb-1 shadow-xs ${
                          app.status === 'accepted'
                            ? 'bg-emerald-600 text-white'
                            : app.status === 'rejected'
                            ? 'bg-rose-600 text-white'
                            : 'bg-slate-200 text-slate-400'
                        }`}
                      >
                        {app.status === 'rejected' ? <XCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                      </div>
                      <span className="font-semibold text-slate-800">
                        {app.status === 'accepted' ? 'Accepted!' : app.status === 'rejected' ? 'Not Selected' : 'Decision'}
                      </span>
                      <span className="text-[10px] text-slate-400">Final employer status</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white p-12 text-center rounded-2xl border border-slate-200">
            <p className="text-xs text-slate-500">No active applications to display status for.</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

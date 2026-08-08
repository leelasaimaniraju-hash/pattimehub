import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { StatusBadge } from '../../components/common/StatusBadge';
import { useAuth } from '../../context/AuthContext';
import { JobApplication } from '../../types';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { FileCheck, Building2, Calendar, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

export const SeekerAppliedJobs: React.FC = () => {
  const { currentUser } = useAuth();
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchApplied() {
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
        loaded.sort((a, b) => new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime());
        setApplications(loaded);
      } catch (err) {
        console.error('Error fetching applied jobs:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchApplied();
  }, [currentUser]);

  return (
    <DashboardLayout title="My Submitted Applications" subtitle="Track all part-time job submissions">
      {loading ? (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 animate-pulse space-y-4">
          <div className="h-6 bg-slate-200 rounded w-1/4"></div>
          <div className="h-20 bg-slate-200 rounded"></div>
        </div>
      ) : applications.length > 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="p-4">Job Title</th>
                  <th className="p-4">Employer</th>
                  <th className="p-4">Applied Date</th>
                  <th className="p-4">Current Status</th>
                  <th className="p-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {applications.map((app) => (
                  <tr key={app.applicationId} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4 font-semibold text-slate-900">{app.jobTitle}</td>
                    <td className="p-4 text-slate-600">
                      <span className="flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        {app.employerName}
                      </span>
                    </td>
                    <td className="p-4 text-slate-500">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {new Date(app.appliedAt).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="p-4">
                      <StatusBadge status={app.status} type="application" />
                    </td>
                    <td className="p-4 text-right">
                      <Link
                        to={`/jobs/${app.jobId}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:underline"
                      >
                        View Post <ExternalLink className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200">
          <FileCheck className="w-12 h-12 text-slate-300 mx-auto mb-2" />
          <h3 className="text-base font-semibold text-slate-800">No Applications Submitted Yet</h3>
          <p className="text-xs text-slate-500 mt-1 mb-4">
            Search nearby jobs and submit your profile in one click.
          </p>
          <Link to="/seeker/jobs" className="px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-xl">
            Find Nearby Jobs
          </Link>
        </div>
      )}
    </DashboardLayout>
  );
};

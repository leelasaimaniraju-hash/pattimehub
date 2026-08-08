import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { StatusBadge } from '../../components/common/StatusBadge';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { useAuth } from '../../context/AuthContext';
import { Job } from '../../types';
import { collection, query, where, getDocs, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { Briefcase, Edit, Trash2, Plus, ExternalLink, MapPin } from 'lucide-react';

export const ManageJobs: React.FC = () => {
  const { currentUser } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchJobs() {
      if (!currentUser?.uid) return;
      setLoading(true);
      try {
        const q = query(
          collection(db, 'jobs'),
          where('employerId', '==', currentUser.uid)
        );
        const snap = await getDocs(q);
        const loaded: Job[] = [];
        snap.forEach((doc) => loaded.push(doc.data() as Job));
        loaded.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setJobs(loaded);
      } catch (err) {
        console.error('Error fetching employer jobs:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchJobs();
  }, [currentUser]);

  const handleDelete = async () => {
    if (!deleteTargetId) return;
    try {
      await deleteDoc(doc(db, 'jobs', deleteTargetId));
      setJobs((prev) => prev.filter((j) => j.jobId !== deleteTargetId));
      setDeleteTargetId(null);
    } catch (err) {
      console.error('Error deleting job:', err);
    }
  };

  const toggleCloseJob = async (job: Job) => {
    const nextStatus = job.status === 'closed' ? 'approved' : 'closed';
    try {
      await updateDoc(doc(db, 'jobs', job.jobId), {
        status: nextStatus,
        updatedAt: new Date().toISOString(),
      });
      setJobs((prev) =>
        prev.map((j) => (j.jobId === job.jobId ? { ...j, status: nextStatus as any } : j))
      );
    } catch (err) {
      console.error('Error toggling job status:', err);
    }
  };

  return (
    <DashboardLayout title="Manage Job Postings" subtitle="Edit, close, or delete your active part-time job listings">
      <div className="space-y-6">
        <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-700">
            Total Posted Jobs: <strong>{jobs.length}</strong>
          </span>

          <Link
            to="/employer/post-job"
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm"
          >
            <Plus className="w-4 h-4" /> Post New Job
          </Link>
        </div>

        {loading ? (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 animate-pulse h-40"></div>
        ) : jobs.length > 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase">
                  <tr>
                    <th className="p-4">Job Title</th>
                    <th className="p-4">Pay Rate</th>
                    <th className="p-4">Address</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {jobs.map((job) => (
                    <tr key={job.jobId} className="hover:bg-slate-50/80">
                      <td className="p-4">
                        <div className="font-bold text-slate-900">{job.title}</div>
                        <div className="text-[11px] text-slate-400">{job.category} • {job.jobType}</div>
                      </td>
                      <td className="p-4 font-semibold text-emerald-700">
                        ${job.payAmount.toFixed(2)}/{job.payFrequency.replace('per_', '')}
                      </td>
                      <td className="p-4 text-slate-600 max-w-xs truncate">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          {job.address}
                        </span>
                      </td>
                      <td className="p-4">
                        <StatusBadge status={job.status} type="job" />
                      </td>
                      <td className="p-4 text-right space-x-2">
                        <Link
                          to={`/jobs/${job.jobId}`}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 inline-block"
                          title="View public page"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Link>
                        <Link
                          to={`/employer/jobs/${job.jobId}/edit`}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 inline-block"
                          title="Edit Job"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => toggleCloseJob(job)}
                          className={`px-2 py-1 rounded text-[11px] font-semibold border ${
                            job.status === 'closed'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          {job.status === 'closed' ? 'Reopen' : 'Close Post'}
                        </button>
                        <button
                          onClick={() => setDeleteTargetId(job.jobId)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 inline-block"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-white p-12 text-center rounded-2xl border border-slate-200">
            <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-2" />
            <p className="text-xs text-slate-500 mb-4">You haven't posted any jobs yet.</p>
            <Link to="/employer/post-job" className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold">
              Post Your First Job
            </Link>
          </div>
        )}
      </div>

      {deleteTargetId && (
        <ConfirmDialog
          isOpen={true}
          title="Delete Job Post"
          message="Are you sure you want to permanently delete this job post? This action cannot be undone."
          confirmText="Delete Post"
          onConfirm={handleDelete}
          onCancel={() => setDeleteTargetId(null)}
        />
      )}
    </DashboardLayout>
  );
};

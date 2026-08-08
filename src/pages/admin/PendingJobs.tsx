import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Job } from '../../types';
import { collection, query, where, getDocs, doc, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { Clock, CheckCircle2, XCircle, MapPin, Building2, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

export const PendingJobs: React.FC = () => {
  const [pendingJobs, setPendingJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPending() {
      setLoading(true);
      try {
        const q = query(collection(db, 'jobs'), where('status', '==', 'pending'));
        const snap = await getDocs(q);
        const loaded: Job[] = [];
        snap.forEach((doc) => loaded.push(doc.data() as Job));
        setPendingJobs(loaded);
      } catch (err) {
        console.error('Error fetching pending jobs:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchPending();
  }, []);

  const handleApprove = async (jobId: string) => {
    try {
      await updateDoc(doc(db, 'jobs', jobId), {
        status: 'approved',
        updatedAt: new Date().toISOString(),
      });

      const targetJob = pendingJobs.find((j) => j.jobId === jobId);
      if (targetJob) {
        const notifId = `notif_${Date.now()}`;
        await setDoc(doc(db, 'notifications', notifId), {
          notificationId: notifId,
          recipientUid: targetJob.employerId,
          title: 'Job Post Approved & Live!',
          message: `Your job posting "${targetJob.title}" is now published and active on the marketplace.`,
          type: 'status_change',
          relatedJobId: jobId,
          isRead: false,
          createdAt: new Date().toISOString(),
        });
      }

      setPendingJobs((prev) => prev.filter((j) => j.jobId !== jobId));
    } catch (err) {
      console.error('Error approving job:', err);
    }
  };

  const handleReject = async (jobId: string) => {
    try {
      await updateDoc(doc(db, 'jobs', jobId), {
        status: 'rejected',
        updatedAt: new Date().toISOString(),
      });
      setPendingJobs((prev) => prev.filter((j) => j.jobId !== jobId));
    } catch (err) {
      console.error('Error rejecting job:', err);
    }
  };

  return (
    <DashboardLayout title="Pending Job Review Queue" subtitle="Moderate new job submissions before public publishing">
      {loading ? (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 animate-pulse h-40"></div>
      ) : pendingJobs.length > 0 ? (
        <div className="space-y-4">
          {pendingJobs.map((job) => (
            <div key={job.jobId} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                <div>
                  <h3 className="font-bold text-base text-slate-900">{job.title}</h3>
                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                    <Building2 className="w-3.5 h-3.5" /> {job.employerName} • {job.category}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-sm font-extrabold text-emerald-700">
                    ${job.payAmount.toFixed(2)}/{job.payFrequency.replace('per_', '')}
                  </span>
                </div>
              </div>

              <div className="text-xs text-slate-600 space-y-2">
                <p className="line-clamp-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  {job.description}
                </p>
                <div className="flex items-center gap-1 text-slate-500">
                  <MapPin className="w-3.5 h-3.5 text-indigo-500" /> {job.address}
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                <Link
                  to={`/jobs/${job.jobId}`}
                  className="text-xs font-semibold text-indigo-600 hover:underline inline-flex items-center gap-1"
                >
                  Preview Full Details <ExternalLink className="w-3 h-3" />
                </Link>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleApprove(job.jobId)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Approve & Publish
                  </button>
                  <button
                    onClick={() => handleReject(job.jobId)}
                    className="px-4 py-2 bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-bold rounded-xl border border-rose-200 flex items-center gap-1.5"
                  >
                    <XCircle className="w-4 h-4" /> Reject Post
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200">
          <Clock className="w-12 h-12 text-slate-300 mx-auto mb-2" />
          <h3 className="text-base font-semibold text-slate-800">Pending Queue is Empty</h3>
          <p className="text-xs text-slate-500 mt-1">
            There are currently no submitted jobs awaiting moderation.
          </p>
        </div>
      )}
    </DashboardLayout>
  );
};

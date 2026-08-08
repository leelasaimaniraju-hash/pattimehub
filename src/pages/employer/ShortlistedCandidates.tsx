import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { StatusBadge } from '../../components/common/StatusBadge';
import { useAuth } from '../../context/AuthContext';
import { JobApplication } from '../../types';
import { collection, query, where, getDocs, doc, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { CheckSquare, Mail, Phone, Calendar, CheckCircle2 } from 'lucide-react';

export const ShortlistedCandidates: React.FC = () => {
  const { currentUser, employerProfile } = useAuth();
  const [shortlisted, setShortlisted] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchShortlisted() {
      if (!currentUser?.uid) return;
      setLoading(true);
      try {
        const q = query(
          collection(db, 'applications'),
          where('employerId', '==', currentUser.uid),
          where('status', '==', 'shortlisted')
        );
        const snap = await getDocs(q);
        const loaded: JobApplication[] = [];
        snap.forEach((doc) => loaded.push(doc.data() as JobApplication));
        setShortlisted(loaded);
      } catch (err) {
        console.error('Error fetching shortlisted candidates:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchShortlisted();
  }, [currentUser]);

  const handleAccept = async (appId: string) => {
    try {
      await updateDoc(doc(db, 'applications', appId), {
        status: 'accepted',
        updatedAt: new Date().toISOString(),
      });

      const targetApp = shortlisted.find((a) => a.applicationId === appId);
      if (targetApp) {
        const notifId = `notif_${Date.now()}`;
        await setDoc(doc(db, 'notifications', notifId), {
          notificationId: notifId,
          recipientUid: targetApp.jobSeekerId,
          title: 'Congratulations! Application Accepted',
          message: `${employerProfile?.companyName || 'Employer'} has officially accepted your application for ${targetApp.jobTitle}`,
          type: 'status_change',
          relatedJobId: targetApp.jobId,
          relatedApplicationId: appId,
          isRead: false,
          createdAt: new Date().toISOString(),
        });
      }

      setShortlisted((prev) => prev.filter((a) => a.applicationId !== appId));
    } catch (err) {
      console.error('Error accepting candidate:', err);
    }
  };

  return (
    <DashboardLayout title="Shortlisted Candidate Pipeline" subtitle="Candidates shortlisted for interview or hire">
      {loading ? (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 animate-pulse h-40"></div>
      ) : shortlisted.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {shortlisted.map((app) => (
            <div key={app.applicationId} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="font-bold text-sm text-slate-900">{app.jobSeekerName}</span>
                <StatusBadge status="shortlisted" type="application" />
              </div>

              <div className="text-xs space-y-2 text-slate-600">
                <div>
                  <strong className="text-slate-900">Applied Job:</strong> {app.jobTitle}
                </div>
                <div className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-slate-400" /> {app.jobSeekerEmail}
                </div>
                {app.jobSeekerPhone && (
                  <div className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-slate-400" /> {app.jobSeekerPhone}
                  </div>
                )}
              </div>

              <button
                onClick={() => handleAccept(app.applicationId)}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-xs"
              >
                <CheckCircle2 className="w-4 h-4" /> Mark as Accepted & Hired
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200">
          <CheckSquare className="w-12 h-12 text-slate-300 mx-auto mb-2" />
          <p className="text-xs text-slate-500">No candidates currently shortlisted.</p>
        </div>
      )}
    </DashboardLayout>
  );
};

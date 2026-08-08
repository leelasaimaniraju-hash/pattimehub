import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { UserProfile } from '../../types';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { Users, Mail, Phone, MapPin } from 'lucide-react';

export const ManageJobSeekers: React.FC = () => {
  const [seekers, setSeekers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSeekers() {
      setLoading(true);
      try {
        const snap = await getDocs(collection(db, 'users'));
        const loaded: UserProfile[] = [];
        snap.forEach((doc) => {
          const u = doc.data() as UserProfile;
          if (u.role === 'jobSeeker') loaded.push(u);
        });
        setSeekers(loaded);
      } catch (err) {
        console.error('Error fetching job seekers:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchSeekers();
  }, []);

  return (
    <DashboardLayout title="Manage Job Seekers" subtitle="Overview of candidate accounts and profiles">
      {loading ? (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 animate-pulse h-40"></div>
      ) : seekers.length > 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase">
                <tr>
                  <th className="p-4">Full Name</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">Phone</th>
                  <th className="p-4">City</th>
                  <th className="p-4">Skills</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {seekers.map((seeker) => (
                  <tr key={seeker.uid} className="hover:bg-slate-50/80">
                    <td className="p-4 font-bold text-slate-900">{seeker.fullName}</td>
                    <td className="p-4 text-slate-600">{seeker.email}</td>
                    <td className="p-4 text-slate-600">{seeker.phone || 'N/A'}</td>
                    <td className="p-4 text-slate-600">{seeker.city || 'N/A'}</td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-1">
                        {(seeker.skills || []).map((s, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-semibold"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-2" />
          <p className="text-xs text-slate-500">No job seeker accounts registered yet.</p>
        </div>
      )}
    </DashboardLayout>
  );
};

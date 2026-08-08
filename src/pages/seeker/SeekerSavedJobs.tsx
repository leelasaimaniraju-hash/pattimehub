import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { JobCard } from '../../components/common/JobCard';
import { useAuth } from '../../context/AuthContext';
import { Job, SavedJob, JobApplication } from '../../types';
import { collection, query, where, getDocs, doc, getDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { calculateHaversineDistance } from '../../utils/location';
import { Bookmark, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';

export const SeekerSavedJobs: React.FC = () => {
  const { currentUser, userLocation } = useAuth();
  const [savedJobs, setSavedJobs] = useState<Job[]>([]);
  const [appliedJobIds, setAppliedJobIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSaved() {
      if (!currentUser?.uid) return;
      setLoading(true);
      try {
        const savedQ = query(
          collection(db, 'savedJobs'),
          where('jobSeekerId', '==', currentUser.uid)
        );
        const savedSnap = await getDocs(savedQ);

        const loadedJobs: Job[] = [];
        for (const sDoc of savedSnap.docs) {
          const sData = sDoc.data() as SavedJob;
          const jSnap = await getDoc(doc(db, 'jobs', sData.jobId));
          if (jSnap.exists()) {
            const jData = jSnap.data() as Job;
            const dist = userLocation
              ? calculateHaversineDistance(
                  userLocation.latitude,
                  userLocation.longitude,
                  jData.latitude,
                  jData.longitude
                )
              : undefined;
            loadedJobs.push({ ...jData, distanceKm: dist });
          }
        }
        setSavedJobs(loadedJobs);

        // Fetch applications
        const appQ = query(
          collection(db, 'applications'),
          where('jobSeekerId', '==', currentUser.uid)
        );
        const appSnap = await getDocs(appQ);
        const appSet = new Set<string>();
        appSnap.forEach((doc) => appSet.add((doc.data() as JobApplication).jobId));
        setAppliedJobIds(appSet);
      } catch (err) {
        console.error('Error fetching saved jobs:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchSaved();
  }, [currentUser, userLocation]);

  const handleRemoveSaved = async (jobId: string) => {
    if (!currentUser) return;
    const savedId = `${currentUser.uid}_${jobId}`;
    try {
      await deleteDoc(doc(db, 'savedJobs', savedId));
      setSavedJobs((prev) => prev.filter((j) => j.jobId !== jobId));
    } catch (err) {
      console.error('Error removing saved job:', err);
    }
  };

  return (
    <DashboardLayout title="Saved Bookmarks" subtitle="Manage your bookmarked part-time job postings">
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white p-6 rounded-xl border border-slate-200 animate-pulse h-40"></div>
          ))}
        </div>
      ) : savedJobs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {savedJobs.map((j) => (
            <JobCard
              key={j.jobId}
              job={j}
              isSaved={true}
              isApplied={appliedJobIds.has(j.jobId)}
              onToggleSave={(id) => handleRemoveSaved(id)}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200">
          <Bookmark className="w-12 h-12 text-slate-300 mx-auto mb-2" />
          <h3 className="text-base font-semibold text-slate-800">No Saved Jobs Yet</h3>
          <p className="text-xs text-slate-500 mt-1 mb-4">
            Click the bookmark icon on any job card to save it for later.
          </p>
          <Link to="/seeker/jobs" className="px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-xl">
            Browse Nearby Jobs
          </Link>
        </div>
      )}
    </DashboardLayout>
  );
};

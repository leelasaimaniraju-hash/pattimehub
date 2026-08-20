import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { JobCard } from '../../components/common/JobCard';
import { useAuth } from '../../context/AuthContext';
import { Job, SavedJob, JobApplication } from '../../types';
import { collection, query, where, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { calculateHaversineDistance, JOB_CATEGORIES, JOB_TYPES } from '../../utils/location';
import { getApprovedJobsWithFallback } from '../../services/seedData';
import { Search, MapPin, SlidersHorizontal, ArrowUpDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const SeekerSearchJobs: React.FC = () => {
  const { currentUser, userLocation, requestUserLocation } = useAuth();
  const navigate = useNavigate();

  const [keyword, setKeyword] = useState('');
  const [category, setCategory] = useState('All Categories');
  const [jobType, setJobType] = useState('All Types');
  const [maxDistanceKm, setMaxDistanceKm] = useState<number>(25);
  const [sortBy, setSortBy] = useState<'nearest' | 'latest' | 'highest_pay'>('nearest');

  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [savedJobIds, setSavedJobIds] = useState<Set<string>>(new Set());
  const [appliedJobIds, setAppliedJobIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function loadData() {
      if (!currentUser?.uid) return;
      setLoading(true);
      try {
        // Load approved jobs with fallback
        const loaded = await getApprovedJobsWithFallback(
          userLocation?.latitude,
          userLocation?.longitude
        );
        setJobs(loaded);

        // Load saved
        try {
          const savedQ = query(collection(db, 'savedJobs'), where('jobSeekerId', '==', currentUser.uid));
          const savedSnap = await getDocs(savedQ);
          const savedSet = new Set<string>();
          savedSnap.forEach((doc) => savedSet.add((doc.data() as SavedJob).jobId));
          setSavedJobIds(savedSet);
        } catch (sErr) {
          console.warn('Saved jobs notice:', sErr);
        }

        // Load applications
        try {
          const appQ = query(collection(db, 'applications'), where('jobSeekerId', '==', currentUser.uid));
          const appSnap = await getDocs(appQ);
          const appSet = new Set<string>();
          appSnap.forEach((doc) => appSet.add((doc.data() as JobApplication).jobId));
          setAppliedJobIds(appSet);
        } catch (aErr) {
          console.warn('Applications notice:', aErr);
        }
      } catch (err) {
        console.error('Error in SeekerSearchJobs:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [currentUser, userLocation]);

  const filteredJobs = jobs
    .filter((j) => {
      if (keyword.trim()) {
        const qLower = keyword.toLowerCase();
        if (
          !j.title.toLowerCase().includes(qLower) &&
          !j.description.toLowerCase().includes(qLower) &&
          !j.employerName.toLowerCase().includes(qLower)
        )
          return false;
      }
      if (category !== 'All Categories' && j.category !== category) return false;
      if (jobType !== 'All Types' && j.jobType !== jobType) return false;
      if (maxDistanceKm < 500 && j.distanceKm !== undefined && j.distanceKm > maxDistanceKm) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'nearest') return (a.distanceKm || 999) - (b.distanceKm || 999);
      if (sortBy === 'highest_pay') return b.payAmount - a.payAmount;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  const handleToggleSave = async (jobId: string, event: React.MouseEvent) => {
    event.preventDefault();
    if (!currentUser) return;
    const savedId = `${currentUser.uid}_${jobId}`;
    const newSet = new Set(savedJobIds);
    if (savedJobIds.has(jobId)) {
      newSet.delete(jobId);
      setSavedJobIds(newSet);
      await deleteDoc(doc(db, 'savedJobs', savedId));
    } else {
      newSet.add(jobId);
      setSavedJobIds(newSet);
      await setDoc(doc(db, 'savedJobs', savedId), {
        savedJobId: savedId,
        jobSeekerId: currentUser.uid,
        jobId,
        createdAt: new Date().toISOString(),
      });
    }
  };

  const handleApply = (jobId: string) => {
    navigate(`/jobs/${jobId}`);
  };

  return (
    <DashboardLayout
      title="Search Nearby Part-Time Jobs"
      subtitle="Find flexible hourly work filtered by your live GPS location"
    >
      <div className="space-y-6">
        {/* Filters Top Bar */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Keyword..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full py-2 px-3 text-xs border border-slate-200 rounded-xl bg-white"
              >
                {JOB_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <select
                value={jobType}
                onChange={(e) => setJobType(e.target.value)}
                className="w-full py-2 px-3 text-xs border border-slate-200 rounded-xl bg-white"
              >
                {JOB_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-600 shrink-0">Radius:</span>
              <input
                type="range"
                min="2"
                max="50"
                value={maxDistanceKm}
                onChange={(e) => setMaxDistanceKm(Number(e.target.value))}
                className="w-full accent-indigo-600"
              />
              <span className="text-xs font-bold text-indigo-600 shrink-0">{maxDistanceKm}km</span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
            <span className="text-slate-500">
              Found <strong>{filteredJobs.length}</strong> vacancies matching parameters
            </span>

            <div className="flex items-center gap-2">
              <span className="text-slate-500">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="py-1 px-2 border border-slate-200 rounded-lg text-xs font-semibold bg-white"
              >
                <option value="nearest">Nearest Distance</option>
                <option value="latest">Latest</option>
                <option value="highest_pay">Highest Rate</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results List */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white p-6 rounded-xl border border-slate-200 animate-pulse h-40"></div>
            ))}
          </div>
        ) : filteredJobs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredJobs.map((j) => (
              <JobCard
                key={j.jobId}
                job={j}
                isSaved={savedJobIds.has(j.jobId)}
                isApplied={appliedJobIds.has(j.jobId)}
                onToggleSave={handleToggleSave}
                onApply={(id) => handleApply(id)}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white p-12 text-center rounded-2xl border border-slate-200">
            <MapPin className="w-12 h-12 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">No matching jobs found in this area.</p>
            <p className="text-xs text-slate-500 mt-1">Try increasing your distance slider.</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

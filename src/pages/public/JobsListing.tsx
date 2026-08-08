import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  Search,
  MapPin,
  Filter,
  SlidersHorizontal,
  Navigation,
  ArrowUpDown,
  Bookmark,
  X,
  Building2,
  CheckCircle2,
} from 'lucide-react';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';
import { JobCard } from '../../components/common/JobCard';
import { useAuth } from '../../context/AuthContext';
import { Job, SavedJob, JobApplication } from '../../types';
import { collection, query, where, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { calculateHaversineDistance, JOB_CATEGORIES, JOB_TYPES } from '../../utils/location';
import { seedSampleDatabaseIfNeeded } from '../../services/seedData';

export const JobsListing: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { currentUser, userProfile, role, userLocation, requestUserLocation } = useAuth();
  const navigate = useNavigate();

  const [keyword, setKeyword] = useState(searchParams.get('q') || '');
  const [category, setCategory] = useState(searchParams.get('cat') || 'All Categories');
  const [jobType, setJobType] = useState(searchParams.get('type') || 'All Types');
  const [maxDistanceKm, setMaxDistanceKm] = useState<number>(
    searchParams.get('dist') ? Number(searchParams.get('dist')) : 25
  );
  const [sortBy, setSortBy] = useState<'nearest' | 'latest' | 'highest_pay'>('nearest');
  const [minPay, setMinPay] = useState<number>(0);

  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [savedJobIds, setSavedJobIds] = useState<Set<string>>(new Set());
  const [appliedJobIds, setAppliedJobIds] = useState<Set<string>>(new Set());
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);

  // Load user saved and applied jobs
  useEffect(() => {
    async function loadUserData() {
      if (!currentUser?.uid || role !== 'jobSeeker') return;

      try {
        // Saved jobs
        const savedQ = query(
          collection(db, 'savedJobs'),
          where('jobSeekerId', '==', currentUser.uid)
        );
        const savedSnap = await getDocs(savedQ);
        const savedSet = new Set<string>();
        savedSnap.forEach((doc) => {
          savedSet.add((doc.data() as SavedJob).jobId);
        });
        setSavedJobIds(savedSet);

        // Applied jobs
        const appliedQ = query(
          collection(db, 'applications'),
          where('jobSeekerId', '==', currentUser.uid)
        );
        const appliedSnap = await getDocs(appliedQ);
        const appliedSet = new Set<string>();
        appliedSnap.forEach((doc) => {
          appliedSet.add((doc.data() as JobApplication).jobId);
        });
        setAppliedJobIds(appliedSet);
      } catch (err) {
        console.error('Error loading user applications & saved jobs:', err);
      }
    }

    loadUserData();
  }, [currentUser, role]);

  // Load approved jobs from Firestore
  useEffect(() => {
    async function fetchJobs() {
      setLoading(true);
      try {
        await seedSampleDatabaseIfNeeded(userLocation?.latitude, userLocation?.longitude);

        const jobsRef = collection(db, 'jobs');
        const q = query(jobsRef, where('status', '==', 'approved'));
        const snap = await getDocs(q);

        const loaded: Job[] = [];
        snap.forEach((doc) => {
          const data = doc.data() as Job;
          // Calculate distance relative to current user coordinates
          const dist = userLocation
            ? calculateHaversineDistance(
                userLocation.latitude,
                userLocation.longitude,
                data.latitude,
                data.longitude
              )
            : undefined;

          loaded.push({ ...data, distanceKm: dist });
        });

        setJobs(loaded);
      } catch (err) {
        console.error('Error fetching jobs:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchJobs();
  }, [userLocation]);

  // Filter & Sort jobs client side for fast responsive experience
  const filteredJobs = useMemo(() => {
    return jobs
      .filter((job) => {
        // Keyword search in title, description, category, employer
        if (keyword.trim()) {
          const qLower = keyword.toLowerCase();
          const matchTitle = job.title.toLowerCase().includes(qLower);
          const matchDesc = job.description.toLowerCase().includes(qLower);
          const matchEmp = job.employerName.toLowerCase().includes(qLower);
          const matchCat = job.category.toLowerCase().includes(qLower);
          if (!matchTitle && !matchDesc && !matchEmp && !matchCat) return false;
        }

        // Category filter
        if (category !== 'All Categories' && job.category !== category) {
          return false;
        }

        // Job Type filter
        if (jobType !== 'All Types' && job.jobType !== jobType) {
          return false;
        }

        // Minimum Pay
        if (minPay > 0 && job.payAmount < minPay) {
          return false;
        }

        // Distance filter
        if (maxDistanceKm < 500 && job.distanceKm !== undefined) {
          if (job.distanceKm > maxDistanceKm) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'nearest') {
          return (a.distanceKm || 999) - (b.distanceKm || 999);
        }
        if (sortBy === 'highest_pay') {
          return b.payAmount - a.payAmount;
        }
        // Latest (createdAt descending)
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [jobs, keyword, category, jobType, minPay, maxDistanceKm, sortBy]);

  // Handle Save / Unsave bookmark
  const handleToggleSave = async (jobId: string, event: React.MouseEvent) => {
    event.preventDefault();
    if (!currentUser) {
      navigate('/login');
      return;
    }

    const savedId = `${currentUser.uid}_${jobId}`;
    const newSaved = new Set(savedJobIds);

    try {
      if (savedJobIds.has(jobId)) {
        newSaved.delete(jobId);
        setSavedJobIds(newSaved);
        await deleteDoc(doc(db, 'savedJobs', savedId));
      } else {
        newSaved.add(jobId);
        setSavedJobIds(newSaved);
        await setDoc(doc(db, 'savedJobs', savedId), {
          savedJobId: savedId,
          jobSeekerId: currentUser.uid,
          jobId,
          createdAt: new Date().toISOString(),
        });
      }
    } catch (err) {
      console.error('Error toggling save job:', err);
    }
  };

  // Handle Apply button
  const handleApply = (jobId: string, event: React.MouseEvent) => {
    event.preventDefault();
    if (!currentUser) {
      navigate('/login');
      return;
    }
    navigate(`/jobs/${jobId}`);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Navbar />

      {/* Top Banner Header */}
      <div className="bg-slate-900 text-white py-10 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Browse Part-Time Jobs</h1>
              <p className="text-xs text-slate-400 mt-1">
                Found {filteredJobs.length} active vacancies near{' '}
                <span className="text-indigo-400 font-semibold">{userLocation?.city || 'Location'}</span>
              </p>
            </div>

            <button
              onClick={() => requestUserLocation()}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-colors shrink-0"
            >
              <Navigation className="w-4 h-4 text-indigo-400" />
              <span>Update GPS Position</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar for Desktop */}
          <aside className="hidden lg:block w-72 shrink-0 space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6 sticky top-24">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <span className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-indigo-600" /> Search Filters
                </span>
                <button
                  onClick={() => {
                    setKeyword('');
                    setCategory('All Categories');
                    setJobType('All Types');
                    setMaxDistanceKm(500);
                    setMinPay(0);
                  }}
                  className="text-xs text-indigo-600 hover:underline font-medium"
                >
                  Reset
                </button>
              </div>

              {/* Keyword Filter */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Keyword Search</label>
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Title, cashier, tutor..."
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Distance Radius Filter */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-semibold text-slate-700">Distance Radius</label>
                  <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                    {maxDistanceKm >= 500 ? 'All Distances' : `Within ${maxDistanceKm} km`}
                  </span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="50"
                  step="1"
                  value={maxDistanceKm > 50 ? 50 : maxDistanceKm}
                  onChange={(e) => setMaxDistanceKm(Number(e.target.value))}
                  className="w-full accent-indigo-600"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                  <span>2 km</span>
                  <span>15 km</span>
                  <span>50 km</span>
                </div>
              </div>

              {/* Category Filter */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full py-2 px-3 text-xs border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                >
                  {JOB_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Job Type Filter */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Job Type</label>
                <select
                  value={jobType}
                  onChange={(e) => setJobType(e.target.value)}
                  className="w-full py-2 px-3 text-xs border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                >
                  {JOB_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              {/* Min Pay Filter */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Minimum Hourly Pay ($)
                </label>
                <input
                  type="number"
                  placeholder="e.g. $15"
                  value={minPay || ''}
                  onChange={(e) => setMinPay(Number(e.target.value))}
                  className="w-full py-2 px-3 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
            </div>
          </aside>

          {/* Main Results Container */}
          <main className="flex-1 space-y-6">
            {/* Top Toolbar: Search summary & Sort Selector */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setFilterDrawerOpen(true)}
                  className="lg:hidden flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200"
                >
                  <Filter className="w-4 h-4" /> Filters
                </button>
                <span className="text-xs text-slate-600 font-medium">
                  Showing <strong className="text-slate-900">{filteredJobs.length}</strong> vacancies
                </span>
              </div>

              {/* Sort Dropdown */}
              <div className="flex items-center gap-2">
                <ArrowUpDown className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="text-xs text-slate-500 font-medium hidden sm:inline">Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="py-1.5 px-3 text-xs font-semibold border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-indigo-500/20 text-slate-800"
                >
                  <option value="nearest">Nearest Distance First</option>
                  <option value="latest">Latest Posted</option>
                  <option value="highest_pay">Highest Hourly Rate</option>
                </select>
              </div>
            </div>

            {/* Job Grid / List */}
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="bg-white rounded-xl p-6 border border-slate-200 animate-pulse space-y-4">
                    <div className="h-4 bg-slate-200 rounded w-1/3"></div>
                    <div className="h-6 bg-slate-200 rounded w-3/4"></div>
                    <div className="h-10 bg-slate-200 rounded"></div>
                  </div>
                ))}
              </div>
            ) : filteredJobs.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredJobs.map((job) => (
                  <JobCard
                    key={job.jobId}
                    job={job}
                    isSaved={savedJobIds.has(job.jobId)}
                    isApplied={appliedJobIds.has(job.jobId)}
                    onToggleSave={handleToggleSave}
                    onApply={handleApply}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
                <MapPin className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-base font-semibold text-slate-900">No Job Posts Match Your Criteria</h3>
                <p className="text-xs text-slate-500 mt-1 mb-4">
                  Try clearing keyword filters or expanding the maximum distance range.
                </p>
                <button
                  onClick={() => {
                    setKeyword('');
                    setCategory('All Categories');
                    setJobType('All Types');
                    setMaxDistanceKm(500);
                    setMinPay(0);
                  }}
                  className="px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-xl"
                >
                  Reset All Filters
                </button>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Mobile Filter Drawer */}
      {filterDrawerOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex justify-end">
          <div className="w-80 bg-white h-full p-6 overflow-y-auto space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <span className="font-bold text-base text-slate-900">Filter Jobs</span>
              <button onClick={() => setFilterDrawerOpen(false)} className="text-slate-400">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Keyword Search</label>
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                className="w-full p-2 text-xs border border-slate-200 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Distance Radius (km)</label>
              <input
                type="range"
                min="2"
                max="50"
                value={maxDistanceKm > 50 ? 50 : maxDistanceKm}
                onChange={(e) => setMaxDistanceKm(Number(e.target.value))}
                className="w-full accent-indigo-600"
              />
              <span className="text-xs text-indigo-600 font-bold">{maxDistanceKm} km</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full p-2 text-xs border border-slate-200 rounded-xl bg-white"
              >
                {JOB_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => setFilterDrawerOpen(false)}
              className="w-full py-3 bg-indigo-600 text-white rounded-xl text-xs font-bold"
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

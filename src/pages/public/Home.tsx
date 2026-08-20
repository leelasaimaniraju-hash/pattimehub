import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  MapPin,
  Briefcase,
  Navigation,
  Sparkles,
  Building2,
  Clock,
  ShieldCheck,
  ArrowRight,
  TrendingUp,
  Award,
  Users,
} from 'lucide-react';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';
import { JobCard } from '../../components/common/JobCard';
import { useAuth } from '../../context/AuthContext';
import { Job } from '../../types';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { calculateHaversineDistance, JOB_CATEGORIES } from '../../utils/location';
import { getApprovedJobsWithFallback } from '../../services/seedData';

export const Home: React.FC = () => {
  const { userLocation, requestUserLocation } = useAuth();
  const [keyword, setKeyword] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [nearbyJobs, setNearbyJobs] = useState<Job[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function loadFeatured() {
      setLoadingJobs(true);
      try {
        const loaded = await getApprovedJobsWithFallback(
          userLocation?.latitude,
          userLocation?.longitude
        );

        // Sort by nearest
        loaded.sort((a, b) => (a.distanceKm || 999) - (b.distanceKm || 999));
        setNearbyJobs(loaded.slice(0, 6));
      } catch (err) {
        console.error('Error loading featured home jobs:', err);
      } finally {
        setLoadingJobs(false);
      }
    }

    loadFeatured();
  }, [userLocation]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (keyword) params.set('q', keyword);
    if (selectedCategory !== 'All Categories') params.set('cat', selectedCategory);
    navigate(`/jobs?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Navbar />

      {/* Hero Banner Section */}
      <section className="relative bg-slate-900 text-white overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28">
        {/* Glow & Background Gradient Accents */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full pointer-events-none opacity-20">
          <div className="absolute top-10 left-10 w-96 h-96 bg-indigo-500 rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-emerald-500 rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            {/* Location Pill Header */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-800/80 border border-slate-700/80 text-xs text-indigo-300 font-medium mb-6">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Location-Based Part Time Job Search</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
              Find Part-Time Jobs <br className="hidden sm:inline" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-emerald-400">
                Near You
              </span>
            </h1>

            <p className="mt-4 text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
              Discover flexible hourly shifts, weekend roles, and local employment opportunities sorted by real-time GPS distance.
            </p>

            {/* Interactive Location Search Box */}
            <form
              onSubmit={handleSearchSubmit}
              className="mt-8 bg-white p-2 sm:p-3 rounded-2xl shadow-2xl border border-slate-200 text-slate-900 flex flex-col sm:flex-row gap-2 max-w-2xl mx-auto"
            >
              <div className="flex-1 flex items-center gap-2 px-3 py-2 border-b sm:border-b-0 sm:border-r border-slate-200">
                <Search className="w-5 h-5 text-slate-400 shrink-0" />
                <input
                  type="text"
                  placeholder="Job title, keyword, or skill..."
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  className="w-full text-sm font-medium focus:outline-hidden bg-transparent"
                />
              </div>

              <div className="flex-1 flex items-center gap-2 px-3 py-2">
                <MapPin className="w-5 h-5 text-indigo-600 shrink-0" />
                <button
                  type="button"
                  onClick={() => requestUserLocation()}
                  className="text-left w-full text-xs font-semibold text-slate-700 truncate hover:text-indigo-600"
                >
                  {userLocation?.city || userLocation?.locationName || 'Detecting Location...'}
                </button>
              </div>

              <button
                type="submit"
                className="py-3 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-sm transition-all shadow-md shadow-indigo-500/20 flex items-center justify-center gap-2 shrink-0"
              >
                <span>Find Jobs</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Quick Radius Pills */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs text-slate-400">
              <span className="font-medium text-slate-300">Quick Distance:</span>
              {[2, 5, 10, 15, 25].map((km) => (
                <Link
                  key={km}
                  to={`/jobs?dist=${km}`}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors border border-slate-700"
                >
                  Within {km} km
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stats Counter Bar */}
      <section className="bg-white border-b border-slate-200/80 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
              <div className="text-2xl sm:text-3xl font-extrabold text-indigo-600">100%</div>
              <div className="text-xs text-slate-500 font-medium mt-1">Location Verified</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">10 km</div>
              <div className="text-xs text-slate-500 font-medium mt-1">Avg Search Radius</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
              <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600">24 Hrs</div>
              <div className="text-xs text-slate-500 font-medium mt-1">Fast Candidate Match</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
              <div className="text-2xl sm:text-3xl font-extrabold text-indigo-600">Free</div>
              <div className="text-xs text-slate-500 font-medium mt-1">For All Job Seekers</div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Nearby Jobs Section */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 uppercase tracking-wider mb-1">
              <Navigation className="w-4 h-4" /> Live GPS Radius
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Nearby Part-Time Vacancies
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Showing approved job posts closest to {userLocation?.city || 'your current position'}.
            </p>
          </div>

          <Link
            to="/jobs"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:text-indigo-700"
          >
            View All Jobs <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loadingJobs ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-xl p-6 border border-slate-200 animate-pulse space-y-4">
                <div className="h-4 bg-slate-200 rounded w-1/3"></div>
                <div className="h-6 bg-slate-200 rounded w-3/4"></div>
                <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                <div className="h-10 bg-slate-200 rounded"></div>
              </div>
            ))}
          </div>
        ) : nearbyJobs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {nearbyJobs.map((job) => (
              <JobCard key={job.jobId} job={job} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 max-w-lg mx-auto">
            <MapPin className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-900">No Nearby Jobs Found Yet</h3>
            <p className="text-xs text-slate-500 mt-1 mb-4">
              Try expanding your distance radius or search in a different city.
            </p>
            <Link
              to="/jobs"
              className="inline-block px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-xl"
            >
              Browse All Jobs
            </Link>
          </div>
        )}
      </section>

      {/* Popular Categories Grid */}
      <section className="bg-slate-100/70 py-16 border-y border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Explore Popular Categories
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              From retail and tutoring to evening food delivery and hospitality
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {JOB_CATEGORIES.filter((c) => c !== 'All Categories').map((cat) => (
              <Link
                key={cat}
                to={`/jobs?cat=${encodeURIComponent(cat)}`}
                className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all group"
              >
                <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl w-fit mb-3 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  <Briefcase className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
                  {cat}
                </h3>
                <p className="text-xs text-slate-400 mt-1">View vacancies →</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Simple 3-Step Process</span>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mt-1">
            How Part Time Hub Works
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xs relative">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white font-bold flex items-center justify-center text-base mb-4">
              1
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Enable Your Location</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Grant browser GPS permission or select your current city. Our distance engine instantly sorts open vacancies nearest to you.
            </p>
          </div>

          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xs relative">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white font-bold flex items-center justify-center text-base mb-4">
              2
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Filter & Apply</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Browse jobs by pay rate, shift hours, and skills. Submit your profile in 1-click with duplicate application prevention.
            </p>
          </div>

          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xs relative">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white font-bold flex items-center justify-center text-base mb-4">
              3
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Track & Connect</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Get real-time status updates when employers shortlist or accept your application.
            </p>
          </div>
        </div>
      </section>

      {/* Dual CTA Section */}
      <section className="bg-slate-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="p-8 rounded-3xl bg-slate-800/80 border border-slate-700 flex flex-col justify-between">
              <div>
                <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold">
                  For Job Seekers
                </span>
                <h3 className="text-2xl font-bold mt-4 mb-2">Looking for Extra Income Near You?</h3>
                <p className="text-xs text-slate-300 leading-relaxed mb-6">
                  Join thousands of local workers discovering flexible part-time shifts, weekend jobs, and hourly work close to home.
                </p>
              </div>
              <Link
                to="/register/job-seeker"
                className="w-fit px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-sm transition-all shadow-md shadow-indigo-500/30"
              >
                Create Seeker Account
              </Link>
            </div>

            <div className="p-8 rounded-3xl bg-slate-800/80 border border-slate-700 flex flex-col justify-between">
              <div>
                <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold">
                  For Employers & Businesses
                </span>
                <h3 className="text-2xl font-bold mt-4 mb-2">Hiring Local Part-Time Talent?</h3>
                <p className="text-xs text-slate-300 leading-relaxed mb-6">
                  Post job openings in minutes, connect with nearby applicants, shortlist candidates, and manage applications effortlessly.
                </p>
              </div>
              <Link
                to="/register/employer"
                className="w-fit px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-sm transition-all shadow-md shadow-emerald-500/30"
              >
                Post a Part-Time Job
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

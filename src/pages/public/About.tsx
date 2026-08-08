import React from 'react';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';
import { MapPin, Target, ShieldCheck, HeartHandshake, Award } from 'lucide-react';

export const About: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Navbar />

      <section className="bg-slate-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">About Part Time Hub</span>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight mt-2">
            Reimagining Local Part-Time Employment
          </h1>
          <p className="mt-4 text-slate-300 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed">
            Connecting neighborhood job seekers with local shops, cafes, tutoring centers, and businesses using real-time location discovery.
          </p>
        </div>
      </section>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12 flex-1">
        <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-xs space-y-4">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Target className="w-5 h-5 text-indigo-600" /> Our Mission
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Traditional job boards prioritize remote or full-time corporate roles, forcing part-time job seekers to wade through irrelevant listings far from home. Part Time Hub was built with a single primary focus: <strong>Location First</strong>. Whether you are a college student looking for morning barista shifts within 2 km or an evening delivery driver, Part Time Hub instantly matches you with verified local employers.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-2">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl w-fit">
              <MapPin className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">GPS Proximity</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Jobs are queried and sorted strictly based on real-time geohashes and Haversine distance.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-2">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl w-fit">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Verified Employers</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Every employer account and job submission undergoes administrative review before public publishing.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-2">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl w-fit">
              <HeartHandshake className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Free & Transparent</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              No hidden fees for job seekers. Transparent hourly rates and shift schedules listed upfront.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

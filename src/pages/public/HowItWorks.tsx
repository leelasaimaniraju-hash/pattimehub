import React from 'react';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';
import { UserCheck, Building2, Search, CheckCircle2, FileCheck, ShieldCheck } from 'lucide-react';

export const HowItWorks: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Navbar />

      <section className="bg-slate-900 text-white py-16 text-center">
        <div className="max-w-4xl mx-auto px-4">
          <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Step-by-Step Guide</span>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight mt-2">
            How Part Time Hub Works
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-2">
            Detailed workflow for both job seekers looking for local work and employers seeking part-time staff.
          </p>
        </div>
      </section>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12 flex-1">
        {/* Job Seeker Workflow */}
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">For Job Seekers</h2>
              <p className="text-xs text-slate-500">Find and apply for local part-time work near you</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
              <span className="text-xs font-bold text-indigo-600">Step 1</span>
              <h3 className="text-sm font-semibold text-slate-900">Set Location & Create Profile</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Register as a Job Seeker and enable location permission to auto-detect nearby job opportunities.
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
              <span className="text-xs font-bold text-indigo-600">Step 2</span>
              <h3 className="text-sm font-semibold text-slate-900">Browse & Apply</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Filter by distance radius, hourly pay, or shift times. Submit your profile in one click.
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
              <span className="text-xs font-bold text-indigo-600">Step 3</span>
              <h3 className="text-sm font-semibold text-slate-900">Track & Get Hired</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Receive instant in-app status updates when employers shortlist or accept your application.
              </p>
            </div>
          </div>
        </div>

        {/* Employer Workflow */}
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">For Employers</h2>
              <p className="text-xs text-slate-500">Post vacancies and recruit local part-time workers</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
              <span className="text-xs font-bold text-emerald-600">Step 1</span>
              <h3 className="text-sm font-semibold text-slate-900">Register Company</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Create an employer account with business location and address.
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
              <span className="text-xs font-bold text-emerald-600">Step 2</span>
              <h3 className="text-sm font-semibold text-slate-900">Post Vacancy</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Define title, pay rate, required skills, address, and shift hours.
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
              <span className="text-xs font-bold text-emerald-600">Step 3</span>
              <h3 className="text-sm font-semibold text-slate-900">Admin Approval</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Platform admins review and approve the post to publish it publicly.
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
              <span className="text-xs font-bold text-emerald-600">Step 4</span>
              <h3 className="text-sm font-semibold text-slate-900">Shortlist Candidates</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Review applicant profiles, shortlist top picks, and mark candidates as Accepted.
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

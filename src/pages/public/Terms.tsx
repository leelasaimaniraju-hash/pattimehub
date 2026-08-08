import React from 'react';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';

export const Terms: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-1 space-y-6">
        <h1 className="text-3xl font-extrabold text-slate-900">Terms & Conditions</h1>
        <div className="bg-white p-8 rounded-2xl border border-slate-200 text-xs text-slate-600 space-y-4 leading-relaxed">
          <p>
            Welcome to Part Time Hub. By accessing or using our website, you agree to be bound by these Terms and Conditions.
          </p>

          <h3 className="text-sm font-bold text-slate-900">1. User Accounts</h3>
          <p>
            Users must register as either a Job Seeker or an Employer. You are responsible for maintaining the confidentiality of your credentials and for all activities that occur under your account.
          </p>

          <h3 className="text-sm font-bold text-slate-900">2. Employer Job Postings</h3>
          <p>
            Employers agree to provide accurate job descriptions, honest pay rates, and genuine work addresses. Fraudulent or deceptive listings are strictly prohibited and subject to immediate suspension.
          </p>

          <h3 className="text-sm font-bold text-slate-900">3. Admin Moderation</h3>
          <p>
            Platform administrators reserve the right to approve, reject, hide, or terminate any job post or account violating community safety standards.
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
};

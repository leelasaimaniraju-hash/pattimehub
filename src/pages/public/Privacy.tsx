import React from 'react';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';

export const Privacy: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-1 space-y-6">
        <h1 className="text-3xl font-extrabold text-slate-900">Privacy Policy</h1>
        <div className="bg-white p-8 rounded-2xl border border-slate-200 text-xs text-slate-600 space-y-4 leading-relaxed">
          <p>
            At Part Time Hub, we respect your privacy. This Privacy Policy explains how we collect, use, and safeguard your personal information when you use our location-based part-time job marketplace.
          </p>

          <h3 className="text-sm font-bold text-slate-900">1. Information We Collect</h3>
          <p>
            We collect information you provide directly, such as your full name, email address, phone number, company information, and job application records. When enabled, we collect location coordinates (latitude and longitude) to calculate distance to nearby job vacancies.
          </p>

          <h3 className="text-sm font-bold text-slate-900">2. How We Use Your Location</h3>
          <p>
            Your browser GPS coordinates are converted into geohashes solely to sort and filter part-time jobs by proximity. We do not track your location continuously in the background or sell location data to third parties.
          </p>

          <h3 className="text-sm font-bold text-slate-900">3. Data Protection</h3>
          <p>
            All user authentication credentials and profile records are secured via Firebase Authentication and Cloud Firestore Security Rules, ensuring strict role-based access control.
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
};

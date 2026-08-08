import React, { useState } from 'react';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';
import { ChevronDown, HelpCircle } from 'lucide-react';

export const FAQ: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: 'How does location-based job discovery work?',
      a: 'When you allow browser location permissions or select your current city, Part Time Hub converts your coordinates into a geohash and calculates the exact Haversine distance in kilometers to every active job posting. Jobs closest to your current location are displayed first.',
    },
    {
      q: 'Is Part Time Hub free for job seekers?',
      a: 'Yes, 100% free! Job seekers can search nearby vacancies, save bookmarked jobs, apply, and track application statuses at no cost.',
    },
    {
      q: 'Why does my posted job show "Pending Review"?',
      a: 'To maintain platform trust and prevent spam, all employer posts undergo administrative review before going live publicly. Admin approvals usually take less than 24 hours.',
    },
    {
      q: 'Can employers apply for jobs?',
      a: 'No. Employer accounts are designed solely for company management and candidate recruitment. To apply for jobs, register or log in with a Job Seeker account.',
    },
    {
      q: 'What happens if I deny location access?',
      a: 'If location permission is denied, you can manually select any major city from our Location Picker dropdown or browse all approved listings.',
    },
    {
      q: 'How do I know if an employer has viewed my application?',
      a: 'You will receive in-app notifications whenever an employer updates your application status to Shortlisted, Accepted, or Rejected.',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Navbar />

      <section className="bg-slate-900 text-white py-16 text-center">
        <div className="max-w-4xl mx-auto px-4">
          <HelpCircle className="w-10 h-10 text-indigo-400 mx-auto mb-2" />
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Frequently Asked Questions</h1>
          <p className="text-xs text-slate-300 mt-2">
            Everything you need to know about searching, applying, and hiring on Part Time Hub.
          </p>
        </div>
      </section>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full flex-1 space-y-4">
        {faqs.map((faq, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div key={idx} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
              <button
                onClick={() => setOpenIndex(isOpen ? null : idx)}
                className="w-full flex items-center justify-between p-5 text-left font-semibold text-slate-900 text-sm hover:bg-slate-50 transition-colors"
              >
                <span>{faq.q}</span>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
              </button>

              {isOpen && (
                <div className="p-5 pt-0 text-xs text-slate-600 leading-relaxed border-t border-slate-100">
                  {faq.a}
                </div>
              )}
            </div>
          );
        })}
      </main>

      <Footer />
    </div>
  );
};

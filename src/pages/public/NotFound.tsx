import React from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';
import { MapPin, Home, Search } from 'lucide-react';

export const NotFound: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Navbar />

      <main className="max-w-md mx-auto px-4 py-20 text-center flex-1 flex flex-col justify-center items-center">
        <div className="p-4 bg-indigo-50 text-indigo-600 rounded-3xl mb-4">
          <MapPin className="w-12 h-12" />
        </div>
        <h1 className="text-4xl font-extrabold text-slate-900">404</h1>
        <h2 className="text-lg font-bold text-slate-800 mt-2">Page Off the Map</h2>
        <p className="text-xs text-slate-500 mt-2 mb-6 leading-relaxed">
          The requested route does not exist or has been relocated.
        </p>

        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-semibold flex items-center gap-2"
          >
            <Home className="w-4 h-4" /> Go Home
          </Link>
          <Link
            to="/jobs"
            className="px-4 py-2.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl text-xs font-semibold flex items-center gap-2 border border-slate-200"
          >
            <Search className="w-4 h-4" /> Browse Jobs
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
};

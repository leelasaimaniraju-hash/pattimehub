import React from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, MapPin, Mail, Phone, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-400 text-sm border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Brand Info */}
          <div className="space-y-4 md:col-span-1">
            <Link to="/" className="flex items-center gap-2">
              <div className="p-2 bg-indigo-600 rounded-xl text-white">
                <Briefcase className="w-5 h-5" />
              </div>
              <span className="font-bold text-lg text-white tracking-tight">
                PART TIME<span className="text-indigo-400">HUB</span>
              </span>
            </Link>
            <p className="text-xs leading-relaxed text-slate-400">
              The premier location-based part-time job marketplace. Connecting local talent with flexible hourly jobs and nearby verified employers.
            </p>
            <div className="flex items-center gap-2 text-xs text-indigo-400 font-medium">
              <MapPin className="w-4 h-4" />
              <span>Real-time GPS Distance Sorting</span>
            </div>
          </div>

          {/* Job Seekers Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200">For Job Seekers</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/jobs" className="hover:text-white transition-colors">
                  Search Nearby Jobs
                </Link>
              </li>
              <li>
                <Link to="/register/job-seeker" className="hover:text-white transition-colors">
                  Create Seeker Account
                </Link>
              </li>
              <li>
                <Link to="/how-it-works" className="hover:text-white transition-colors">
                  How Seeking Works
                </Link>
              </li>
              <li>
                <Link to="/faq" className="hover:text-white transition-colors">
                  Seeker FAQs
                </Link>
              </li>
            </ul>
          </div>

          {/* Employers Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200">For Employers</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/register/employer" className="hover:text-white transition-colors">
                  Post a Part-Time Job
                </Link>
              </li>
              <li>
                <Link to="/register/employer" className="hover:text-white transition-colors">
                  Employer Registration
                </Link>
              </li>
              <li>
                <Link to="/how-it-works" className="hover:text-white transition-colors">
                  Hiring Workflow
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-white transition-colors">
                  Verification Standards
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact & Support */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200">Platform & Legal</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/contact" className="hover:text-white transition-colors flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" /> Contact Support
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-white transition-colors">
                  Terms & Conditions
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} Part Time Hub Inc. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Built with <Heart className="w-3.5 h-3.5 text-rose-500 fill-current" /> for location-based workforce discovery.
          </p>
        </div>
      </div>
    </footer>
  );
};

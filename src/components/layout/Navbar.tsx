import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  MapPin,
  Briefcase,
  User,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Building2,
  ShieldAlert,
  Search,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { LocationPicker } from '../common/LocationPicker';

export const Navbar: React.FC = () => {
  const { currentUser, userProfile, role, logout, userLocation } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [locationPickerOpen, setLocationPickerOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getDashboardPath = () => {
    if (role === 'admin') return '/admin/dashboard';
    if (role === 'employer') return '/employer/dashboard';
    return '/seeker/dashboard';
  };

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Browse Jobs', path: '/jobs' },
    { name: 'How It Works', path: '/how-it-works' },
    { name: 'About', path: '/about' },
    { name: 'Contact', path: '/contact' },
    { name: 'FAQ', path: '/faq' },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Brand Logo & Location badge */}
            <div className="flex items-center gap-4">
              <Link to="/" className="flex items-center gap-2 group">
                <div className="p-2 bg-indigo-600 rounded-xl text-white shadow-md shadow-indigo-200 group-hover:scale-105 transition-transform">
                  <Briefcase className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-lg text-slate-900 leading-none tracking-tight">
                    PART TIME<span className="text-indigo-600 ml-1">HUB</span>
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium tracking-wide">
                    LOCATION-BASED JOBS
                  </span>
                </div>
              </Link>

              {/* Location Badge Trigger */}
              <button
                onClick={() => setLocationPickerOpen(true)}
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200/70 text-slate-700 text-xs font-medium rounded-full transition-colors border border-slate-200"
                title="Change location"
              >
                <MapPin className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                <span className="max-w-[130px] truncate">
                  {userLocation?.city || userLocation?.locationName || 'Near Me'}
                </span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>
            </div>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) => {
                const isActive = location.pathname === link.path;
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                      isActive
                        ? 'text-indigo-600 bg-indigo-50/80 font-semibold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    {link.name}
                  </Link>
                );
              })}
            </nav>

            {/* Role Action Buttons & Desktop Auth Section */}
            <div className="hidden md:flex items-center gap-2.5">
              {/* Job Seeker Action Button */}
              <Link
                to={currentUser && role === 'jobSeeker' ? '/seeker/jobs' : '/jobs'}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-indigo-600 hover:bg-slate-100/80 rounded-xl transition-colors border border-slate-200"
              >
                <Search className="w-3.5 h-3.5 text-indigo-600" />
                <span>Job Seeker</span>
              </Link>

              {/* Employer Action Button */}
              <Link
                to={currentUser && role === 'employer' ? '/employer/post-job' : '/register/employer'}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-indigo-700 bg-indigo-50/80 hover:bg-indigo-100 rounded-xl transition-colors border border-indigo-200/70"
              >
                <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                <span>For Employers</span>
              </Link>

              <div className="h-5 w-px bg-slate-200 mx-1"></div>

              {currentUser ? (
                <div className="relative">
                  <button
                    onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                    className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 transition-colors border border-slate-200"
                  >
                    <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-bold flex items-center justify-center text-xs shadow-xs">
                      {userProfile?.fullName?.charAt(0) || (role === 'admin' ? 'A' : 'U')}
                    </div>
                    <div className="text-left leading-none pr-1">
                      <div className="text-xs font-semibold text-slate-900 truncate max-w-[100px]">
                        {userProfile?.fullName || (role === 'admin' ? 'Admin' : 'User')}
                      </div>
                      <div className="text-[10px] text-slate-500 capitalize">{role || 'Member'}</div>
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </button>

                  {/* Profile Dropdown */}
                  {profileDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                      <div className="px-4 py-2.5 border-b border-slate-100">
                        <p className="text-xs font-semibold text-slate-900">{userProfile?.fullName || 'Signed In'}</p>
                        <p className="text-[11px] text-slate-500 truncate">{currentUser.email}</p>
                      </div>

                      <Link
                        to={getDashboardPath()}
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                      >
                        {role === 'admin' && <ShieldAlert className="w-4 h-4 text-indigo-600" />}
                        {role === 'employer' && <Building2 className="w-4 h-4 text-indigo-600" />}
                        {role === 'jobSeeker' && <User className="w-4 h-4 text-indigo-600" />}
                        Dashboard
                      </Link>

                      {role === 'jobSeeker' && (
                        <Link
                          to="/seeker/jobs"
                          onClick={() => setProfileDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                        >
                          <Search className="w-4 h-4 text-slate-400" />
                          Browse Jobs
                        </Link>
                      )}

                      {role === 'employer' && (
                        <Link
                          to="/employer/post-job"
                          onClick={() => setProfileDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                        >
                          <Briefcase className="w-4 h-4 text-slate-400" />
                          Post a Job
                        </Link>
                      )}

                      <button
                        onClick={() => {
                          setProfileDropdownOpen(false);
                          handleLogout();
                        }}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    to="/login"
                    className="px-3 py-2 text-xs font-semibold text-slate-700 hover:text-indigo-600 transition-colors"
                  >
                    Log In
                  </Link>
                  <Link
                    to="/register/seeker"
                    className="px-3.5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-xs"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile Hamburger Toggle */}
            <div className="flex items-center gap-2 md:hidden">
              <button
                onClick={() => setLocationPickerOpen(true)}
                className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                <MapPin className="w-5 h-5 text-indigo-600" />
              </button>

              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-2 pb-6 space-y-4 shadow-xl">
            {/* Quick Role Direct Access */}
            <div className="grid grid-cols-2 gap-2 pt-2">
              <Link
                to="/jobs"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center gap-2 p-2.5 bg-slate-50 border border-slate-200 hover:border-indigo-400 rounded-xl text-xs font-bold text-slate-800 text-center"
              >
                <Search className="w-4 h-4 text-indigo-600" />
                <span>Job Seeker</span>
              </Link>
              <Link
                to="/register/employer"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center gap-2 p-2.5 bg-indigo-50 border border-indigo-200 hover:border-indigo-400 rounded-xl text-xs font-bold text-indigo-700 text-center"
              >
                <Building2 className="w-4 h-4 text-indigo-600" />
                <span>For Employers</span>
              </Link>
            </div>

            <div className="space-y-1 py-1 border-t border-slate-100">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 text-sm font-medium text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg"
                >
                  {link.name}
                </Link>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-100 space-y-2">
              {currentUser ? (
                <>
                  <Link
                    to={getDashboardPath()}
                    onClick={() => setMobileMenuOpen(false)}
                    className="block w-full text-center py-2.5 px-4 bg-indigo-600 text-white rounded-xl font-bold text-xs shadow-sm"
                  >
                    Go to {role === 'admin' ? 'Admin' : role === 'employer' ? 'Employer' : 'Seeker'} Dashboard
                  </Link>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleLogout();
                    }}
                    className="block w-full text-center py-2.5 px-4 text-rose-600 bg-rose-50 rounded-xl font-bold text-xs"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-center py-2.5 px-4 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl"
                  >
                    Log In
                  </Link>
                  <Link
                    to="/register/seeker"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-center py-2.5 px-4 bg-indigo-600 text-white font-bold text-xs rounded-xl shadow-xs"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Location Picker Modal */}
      <LocationPicker isOpen={locationPickerOpen} onClose={() => setLocationPickerOpen(false)} />
    </>
  );
};

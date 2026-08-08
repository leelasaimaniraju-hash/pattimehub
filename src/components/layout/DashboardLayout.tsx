import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Search,
  Bookmark,
  FileCheck,
  Bell,
  User,
  PlusCircle,
  Briefcase,
  Users,
  Building2,
  CheckSquare,
  BarChart3,
  ListFilter,
  LogOut,
  Menu,
  X,
  MapPin,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase/config';

interface DashboardLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

interface NavItem {
  name: string;
  path: string;
  icon: React.ForwardRefExoticComponent<any>;
  badge?: number;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  title,
  subtitle,
}) => {
  const { userProfile, employerProfile, role, logout, userLocation } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();

  // Listen for unread notifications for the user
  useEffect(() => {
    if (!userProfile?.uid) return;
    const q = query(
      collection(db, 'notifications'),
      where('recipientUid', '==', userProfile.uid),
      where('isRead', '==', false)
    );
    const unsub = onSnapshot(q, (snap) => {
      setUnreadNotifications(snap.size);
    });
    return unsub;
  }, [userProfile?.uid]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Define sidebar items per role
  const seekerNav: NavItem[] = [
    { name: 'Dashboard', path: '/seeker/dashboard', icon: LayoutDashboard },
    { name: 'Search Nearby Jobs', path: '/seeker/jobs', icon: Search },
    { name: 'Saved Jobs', path: '/seeker/saved-jobs', icon: Bookmark },
    { name: 'Applied Jobs', path: '/seeker/applied-jobs', icon: FileCheck },
    { name: 'Application Status', path: '/seeker/application-status', icon: CheckSquare },
    { name: 'Notifications', path: '/seeker/notifications', icon: Bell, badge: unreadNotifications },
    { name: 'My Profile', path: '/seeker/profile', icon: User },
  ];

  const employerNav: NavItem[] = [
    { name: 'Dashboard', path: '/employer/dashboard', icon: LayoutDashboard },
    { name: 'Post New Job', path: '/employer/post-job', icon: PlusCircle },
    { name: 'Manage Jobs', path: '/employer/jobs', icon: Briefcase },
    { name: 'View Applications', path: '/employer/applications', icon: Users },
    { name: 'Shortlisted Candidates', path: '/employer/shortlisted', icon: CheckSquare },
    { name: 'Company Profile', path: '/employer/company-profile', icon: Building2 },
    { name: 'Notifications', path: '/employer/notifications', icon: Bell, badge: unreadNotifications },
  ];

  const adminNav: NavItem[] = [
    { name: 'Dashboard Overview', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Job Approvals Queue', path: '/admin/pending-jobs', icon: CheckSquare },
    { name: 'Manage Employers', path: '/admin/employers', icon: Building2 },
    { name: 'Manage Job Seekers', path: '/admin/seekers', icon: Users },
    { name: 'Activity Logs', path: '/admin/logs', icon: ListFilter },
  ];

  const getNavItems = () => {
    if (role === 'admin') return adminNav;
    if (role === 'employer') return employerNav;
    return seekerNav;
  };

  const navItems = getNavItems();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-900 text-slate-300 border-r border-slate-800 shrink-0 min-h-screen sticky top-0 h-screen">
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-800 flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2">
            <div className="p-2 bg-indigo-600 rounded-xl text-white shadow-md shadow-indigo-900">
              <Briefcase className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-base text-white tracking-tight leading-none">
                PART TIME<span className="text-indigo-400 ml-1">HUB</span>
              </span>
              <span className="text-[10px] text-indigo-300 font-medium tracking-wider uppercase mt-1">
                {role} Panel
              </span>
            </div>
          </Link>
        </div>

        {/* User Card */}
        <div className="p-4 mx-3 my-3 bg-slate-800/60 rounded-xl border border-slate-700/50 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-indigo-600 text-white font-bold flex items-center justify-center text-sm">
            {userProfile?.fullName?.charAt(0) || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white truncate">
              {role === 'employer' ? employerProfile?.companyName || userProfile?.fullName : userProfile?.fullName}
            </p>
            <p className="text-[10px] text-slate-400 truncate flex items-center gap-1">
              <MapPin className="w-3 h-3 text-indigo-400" />
              {userLocation?.city || 'Location set'}
            </p>
          </div>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto custom-scrollbar">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white font-semibold shadow-md shadow-indigo-900/40'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.name}</span>
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="px-2 py-0.5 text-[10px] font-bold bg-rose-500 text-white rounded-full">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-slate-800 space-y-2">
          <Link
            to="/"
            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
          >
            <ChevronRight className="w-4 h-4 text-indigo-400" />
            Back to Public Website
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-rose-400 hover:bg-rose-950/40 rounded-xl transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile Top Header */}
      <div className="md:hidden bg-slate-900 text-white p-4 flex items-center justify-between sticky top-0 z-30 shadow-md">
        <div className="flex items-center gap-2">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1.5 text-slate-300">
            {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
          <span className="font-bold text-base">PART TIME HUB</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="px-2 py-1 bg-indigo-600 rounded text-[10px] font-bold uppercase">{role}</span>
        </div>
      </div>

      {/* Mobile Sidebar Drawer */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-slate-900/80 backdrop-blur-xs flex">
          <div className="w-64 bg-slate-900 h-full p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <span className="font-bold text-white text-base">Menu Navigation</span>
                <button onClick={() => setSidebarOpen(false)} className="text-slate-400">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-1 mt-4">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium ${
                        isActive ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-4 h-4" />
                        <span>{item.name}</span>
                      </div>
                      {item.badge !== undefined && item.badge > 0 && (
                        <span className="px-2 py-0.5 text-[10px] font-bold bg-rose-500 text-white rounded-full">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 space-y-2">
              <Link
                to="/"
                onClick={() => setSidebarOpen(false)}
                className="block text-xs text-slate-300 hover:text-white py-2"
              >
                Back to Website
              </Link>
              <button
                onClick={handleLogout}
                className="w-full py-2 text-left text-xs font-medium text-rose-400 hover:text-rose-300"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Viewport */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full overflow-x-hidden">
        {/* Page Title & Subtitle Banner */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{title}</h1>
            {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            <div className="px-3 py-1.5 bg-slate-100 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-indigo-600" />
              <span>{userLocation?.city || 'Location Set'}</span>
            </div>
          </div>
        </div>

        {/* Dashboard Content */}
        {children}
      </main>
    </div>
  );
};

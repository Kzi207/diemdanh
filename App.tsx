import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation, Link, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, BookOpen, LogOut, Menu, X, BarChart3, Settings as SettingsIcon, Globe, QrCode } from 'lucide-react';
import { isLoggedIn, logout } from './services/storage';

// Pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ClassManagement from './pages/ClassManagement';
import ActivityManager from './pages/ActivityManager';
import AttendanceScanner from './pages/AttendanceScanner';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import GuestView from './pages/GuestView';
import QuickScan from './pages/QuickScan';

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return isLoggedIn() ? <>{children}</> : <Navigate to="/login" />;
};

const Sidebar: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const menuItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Tổng Quan' },
    { path: '/scan', icon: QrCode, label: 'Quét Nhanh' },
    { path: '/classes', icon: Users, label: 'Lớp Học & SV' },
    { path: '/activities', icon: BookOpen, label: 'Học Phần' }, 
    { path: '/reports', icon: BarChart3, label: 'Báo Cáo' },
    { path: '/settings', icon: SettingsIcon, label: 'Cài Đặt' },
  ];

  const overlayClass = isOpen ? "fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden" : "hidden";
  const sidebarClass = `fixed top-0 left-0 h-full w-64 bg-white shadow-xl z-30 transform transition-transform duration-300 md:translate-x-0 md:static md:shadow-none ${isOpen ? 'translate-x-0' : '-translate-x-full'} flex flex-col`;

  return (
    <>
      <div className={overlayClass} onClick={onClose}></div>
      <div className={sidebarClass}>
        <div className="h-16 flex items-center px-6 border-b border-gray-100 shrink-0">
          <h1 className="text-xl font-extrabold text-blue-600 tracking-tight">Kzi<span className="text-gray-400">.site</span></h1>
          <button onClick={onClose} className="ml-auto md:hidden text-gray-500"><X /></button>
        </div>
        
        <div className="px-4 py-2 text-xs font-semibold flex items-center justify-center gap-2 bg-indigo-50 text-indigo-700">
           <Globe size={14} /> Database Online
        </div>

        <nav className="p-4 space-y-2 flex-1 overflow-y-auto">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => { if(window.innerWidth < 768) onClose() }}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${location.pathname.startsWith(item.path) ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              <item.icon size={20} />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-100 shrink-0">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
          >
            <LogOut size={20} /> Đăng xuất
          </button>
        </div>
      </div>
    </>
  );
};

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const location = useLocation();
  const isScanner = location.pathname.includes('/attendance/');

  if (isScanner) return <>{children}</>;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white h-16 border-b border-gray-100 flex items-center px-4 md:hidden shrink-0">
          <button onClick={() => setIsSidebarOpen(true)} className="text-gray-600">
            <Menu />
          </button>
          <span className="ml-4 font-bold text-gray-700">Kzi</span>
        </header>
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/public" element={<GuestView />} />
        
        <Route path="/*" element={
          <PrivateRoute>
            <Layout>
              <Routes>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/scan" element={<QuickScan />} />
                <Route path="/classes" element={<ClassManagement />} />
                <Route path="/activities" element={<ActivityManager />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/attendance/:activityId" element={<AttendanceScanner />} />
                <Route path="*" element={<Navigate to="/dashboard" />} />
              </Routes>
            </Layout>
          </PrivateRoute>
        } />
      </Routes>
    </HashRouter>
  );
};

export default App;
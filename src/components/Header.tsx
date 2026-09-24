import React, { useState } from 'react';
import { Search, Bell, Check, Sparkles, UserCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  onOpenAuth?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  onOpenAuth
}) => {
  const { user } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const notifications = [
    { id: 1, title: 'New Announcement in CS101', time: '10m ago', unread: true },
    { id: 2, title: 'Reminder: Project Phase 1 due Friday', time: '1h ago', unread: true },
    { id: 3, title: 'Sarah Jenkins commented on your research script', time: '3h ago', unread: false }
  ];

  return (
    <header className="h-16 px-8 flex items-center justify-between border-b border-slate-100 bg-white/80 backdrop-blur-md sticky top-0 z-20">
      <div>
        {title ? (
          <div className="flex items-baseline gap-2">
            <h2 className="text-xl font-bold text-slate-900">{title}</h2>
            {subtitle && <span className="text-xs text-slate-400 font-medium">{subtitle}</span>}
          </div>
        ) : (
          <div className="relative w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search courses, professors, topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400"
            />
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        {/* Role badge */}
        {user ? (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100/90 text-slate-700 text-xs font-semibold rounded-full border border-slate-200/60">
            <span className={`w-2 h-2 rounded-full ${user.role === 'instructor' ? 'bg-indigo-600' : 'bg-emerald-500'}`}></span>
            <span>{user.role === 'instructor' ? 'อาจารย์ผู้สอน' : 'นิสิต / นักศึกษา'}</span>
          </div>
        ) : (
          <button
            onClick={onOpenAuth}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-full transition-colors cursor-pointer shadow-sm shadow-indigo-200"
          >
            <UserCircle className="w-4 h-4" />
            <span>เข้าสู่ระบบ</span>
          </button>
        )}

        {/* Notifications Popover */}
        <div className="relative">
          <button
            id="btn-notifications"
            onClick={() => setShowNotifications(!showNotifications)}
            className="w-10 h-10 rounded-full flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-colors relative cursor-pointer"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-indigo-600 rounded-full ring-2 ring-white"></span>
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 p-4 z-50 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="font-bold text-sm text-slate-900">Notifications</span>
                <span className="text-xs text-indigo-600 font-medium cursor-pointer hover:underline">Mark all read</span>
              </div>
              <div className="flex flex-col gap-2 mt-3">
                {notifications.map(n => (
                  <div key={n.id} className={`p-2.5 rounded-xl text-xs flex gap-2.5 ${n.unread ? 'bg-indigo-50/60' : 'hover:bg-slate-50'}`}>
                    <div className="w-2 h-2 rounded-full bg-indigo-600 mt-1.5 shrink-0"></div>
                    <div>
                      <p className="font-semibold text-slate-800">{n.title}</p>
                      <span className="text-slate-400 text-[10px]">{n.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User avatar or sign in */}
        {user ? (
          <img
            src={user.avatar}
            alt={user.name}
            className="w-9 h-9 rounded-full object-cover border-2 border-indigo-100"
            referrerPolicy="no-referrer"
          />
        ) : (
          <button
            onClick={onOpenAuth}
            className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-full shadow-sm"
          >
            Log In
          </button>
        )}
      </div>
    </header>
  );
};

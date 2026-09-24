import React from 'react';
import { 
  Plus, 
  Layers, 
  GraduationCap, 
  CalendarDays, 
  MessageSquare, 
  Settings as SettingsIcon, 
  HelpCircle, 
  LogOut,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';

export type ActiveTab = 'feed' | 'courses' | 'schedule' | 'messages' | 'settings';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenNewPost: () => void;
  onOpenAuth: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  onOpenNewPost,
  onOpenAuth
}) => {
  const { user, logout } = useAuth();
  const { unreadMessagesCount } = useData();

  return (
    <aside id="main-sidebar" className="w-64 bg-white border-r border-slate-100 flex flex-col justify-between h-screen sticky top-0 px-4 py-5 select-none z-30">
      {/* Brand & Main Nav */}
      <div className="flex flex-col gap-6">
        {/* Brand Logo */}
        <div 
          onClick={() => setActiveTab('feed')}
          className="flex items-center gap-3 px-2 cursor-pointer transition-opacity hover:opacity-90"
        >
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-100">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 leading-tight">Sochool</h1>
            <p className="text-xs text-slate-400 font-medium">Academic Hub</p>
          </div>
        </div>

        {/* New Post Button */}
        <button
          id="btn-sidebar-new-post"
          onClick={onOpenNewPost}
          className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full font-medium flex items-center justify-center gap-2 shadow-lg shadow-indigo-200 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
        >
          <Plus className="w-5 h-5 stroke-[2.5]" />
          <span>New Post</span>
        </button>

        {/* Navigation Items */}
        <nav className="flex flex-col gap-1">
          <button
            id="nav-feed"
            onClick={() => setActiveTab('feed')}
            className={`flex items-center gap-3.5 px-4 py-3 rounded-xl font-medium text-sm transition-colors cursor-pointer text-left ${
              activeTab === 'feed'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <Layers className="w-5 h-5" />
            <span>Feed</span>
          </button>

          <button
            id="nav-courses"
            onClick={() => setActiveTab('courses')}
            className={`flex items-center gap-3.5 px-4 py-3 rounded-xl font-medium text-sm transition-colors cursor-pointer text-left ${
              activeTab === 'courses'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <GraduationCap className="w-5 h-5" />
            <span>Courses</span>
          </button>

          <button
            id="nav-schedule"
            onClick={() => setActiveTab('schedule')}
            className={`flex items-center gap-3.5 px-4 py-3 rounded-xl font-medium text-sm transition-colors cursor-pointer text-left ${
              activeTab === 'schedule'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <CalendarDays className="w-5 h-5" />
            <span>ตารางเรียน</span>
          </button>

          <button
            id="nav-messages"
            onClick={() => setActiveTab('messages')}
            className={`flex items-center justify-between px-4 py-3 rounded-xl font-medium text-sm transition-colors cursor-pointer text-left ${
              activeTab === 'messages'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <div className="flex items-center gap-3.5">
              <MessageSquare className="w-5 h-5" />
              <span>Messages</span>
            </div>
            {unreadMessagesCount > 0 && (
              <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                activeTab === 'messages' ? 'bg-white text-indigo-600' : 'bg-indigo-600 text-white'
              }`}>
                {unreadMessagesCount}
              </span>
            )}
          </button>

          <button
            id="nav-settings"
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-3.5 px-4 py-3 rounded-xl font-medium text-sm transition-colors cursor-pointer text-left ${
              activeTab === 'settings'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <SettingsIcon className="w-5 h-5" />
            <span>Settings</span>
          </button>
        </nav>
      </div>

      {/* Bottom Section: Help, Logout, User Card */}
      <div className="flex flex-col gap-3 pt-4 border-t border-slate-100">
        <button
          id="btn-help"
          onClick={() => alert('Sochool Academic Hub:\n• Connect with classmates and faculty in real time.\n• Check assignments and submit homework files.\n• Plan your week with interactive schedule.\n• Firebase cloud synchronization active.')}
          className="flex items-center gap-3.5 px-4 py-2 text-slate-500 hover:text-slate-800 text-sm font-medium transition-colors cursor-pointer"
        >
          <HelpCircle className="w-5 h-5" />
          <span>Help</span>
        </button>

        {user ? (
          <button
            id="btn-logout"
            onClick={() => logout()}
            className="flex items-center gap-3.5 px-4 py-2 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-xl text-sm font-medium transition-colors cursor-pointer"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        ) : (
          <button
            id="btn-signin"
            onClick={onOpenAuth}
            className="flex items-center gap-3.5 px-4 py-2 text-indigo-600 hover:bg-indigo-50 rounded-xl text-sm font-medium transition-colors cursor-pointer"
          >
            <Sparkles className="w-5 h-5" />
            <span>Sign In / Register</span>
          </button>
        )}

        {/* User profile item */}
        {user ? (
          <div 
            onClick={() => setActiveTab('settings')}
            className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer mt-1"
          >
            <div className="relative">
              <img 
                src={user.avatar} 
                alt={user.name} 
                className="w-10 h-10 rounded-full object-cover border border-slate-200"
                referrerPolicy="no-referrer"
              />
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-white"></span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900 truncate leading-tight">{user.name}</p>
              <p className="text-xs text-slate-400 capitalize truncate">{user.gradeLevel || (user.role === 'instructor' ? 'Faculty Instructor' : 'Student')}</p>
            </div>
          </div>
        ) : (
          <button
            onClick={onOpenAuth}
            className="w-full py-2.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>เข้าสู่ระบบ / สมัครสมาชิก</span>
          </button>
        )}
      </div>
    </aside>
  );
};

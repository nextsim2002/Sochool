import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider, useData } from './context/DataContext';
import { Sidebar, ActiveTab } from './components/Sidebar';
import { Header } from './components/Header';
import { FeedView } from './components/FeedView';
import { CoursesView } from './components/CoursesView';
import { AssignmentDetailView } from './components/AssignmentDetailView';
import { ScheduleView } from './components/ScheduleView';
import { MessagesView } from './components/MessagesView';
import { SettingsView } from './components/SettingsView';
import { NewPostModal } from './components/NewPostModal';
import { AuthView } from './components/AuthView';

const MainAppContent: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<ActiveTab>('feed');
  const [isNewPostOpen, setIsNewPostOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  const { activeAssignmentId, setActiveAssignmentId, setActiveCourseId } = useData();

  // If user is not logged in, show the Login / Register screen as the first/landing page
  if (!user) {
    return <AuthView isStandalone={true} />;
  }

  const handleNavigateToCourse = (courseId: string) => {
    setActiveCourseId(courseId);
    setActiveAssignmentId(null);
    setActiveTab('courses');
  };

  const [assignmentInitialTab, setAssignmentInitialTab] = useState<'details' | 'submissions'>('details');

  const handleOpenAssignment = (assignmentId: string, initialTab: 'details' | 'submissions' = 'details') => {
    setActiveAssignmentId(assignmentId);
    setAssignmentInitialTab(initialTab);
    setActiveTab('courses');
  };

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] text-slate-900 font-sans">
      {/* Navigation Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveAssignmentId(null);
          setActiveTab(tab);
        }}
        onOpenNewPost={() => setIsNewPostOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header 
          title={
            activeTab === 'feed' ? undefined :
            activeTab === 'schedule' ? 'Weekly Schedule' :
            activeTab === 'messages' ? 'Direct & Group Messages' :
            activeTab === 'settings' ? 'Academic Hub Settings' :
            'Courses & Curriculum'
          }
          subtitle={
            activeTab === 'schedule' ? 'Fall 2024 Semester' :
            activeTab === 'messages' ? 'Real-time Study Groups' :
            undefined
          }
          onOpenAuth={() => setIsAuthOpen(true)}
        />

        <main className="flex-1 overflow-y-auto">
          {activeTab === 'feed' && (
            <FeedView
              onOpenNewPost={() => setIsNewPostOpen(true)}
              onNavigateToCourse={handleNavigateToCourse}
            />
          )}

          {activeTab === 'courses' && (
            activeAssignmentId ? (
              <AssignmentDetailView
                assignmentId={activeAssignmentId}
                onBack={() => setActiveAssignmentId(null)}
                initialTab={assignmentInitialTab}
              />
            ) : (
              <CoursesView
                onOpenAssignment={handleOpenAssignment}
                onOpenNewPost={() => setIsNewPostOpen(true)}
              />
            )
          )}

          {activeTab === 'schedule' && (
            <ScheduleView onNavigateToCourse={handleNavigateToCourse} />
          )}

          {activeTab === 'messages' && (
            <MessagesView />
          )}

          {activeTab === 'settings' && (
            <SettingsView />
          )}
        </main>
      </div>

      {/* Modals */}
      <NewPostModal
        isOpen={isNewPostOpen}
        onClose={() => setIsNewPostOpen(false)}
      />

      {isAuthOpen && (
        <AuthView
          onClose={() => setIsAuthOpen(false)}
        />
      )}
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <MainAppContent />
      </DataProvider>
    </AuthProvider>
  );
}

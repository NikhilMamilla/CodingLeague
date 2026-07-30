import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import PublicLayout from './layouts/PublicLayout';
import DashboardLayout from './layouts/DashboardLayout';
import AdminLayout from './layouts/AdminLayout';
import ProtectedRoute from './components/auth/ProtectedRoute';
import AdminRoute from './components/auth/AdminRoute';
import PageLoader from './components/ui/PageLoader';
import ScrollToTop from './components/ui/ScrollToTop';

// Public pages
const Home        = lazy(() => import('./pages/public/Home'));
const About       = lazy(() => import('./pages/public/About'));
const Schedule    = lazy(() => import('./pages/public/Schedule'));
const Leaderboard = lazy(() => import('./pages/public/Leaderboard'));
const Winners     = lazy(() => import('./pages/public/Winners'));
const HallOfFame     = lazy(() => import('./pages/public/HallOfFame'));
const FoundingMembers = lazy(() => import('./pages/public/FoundingMembers'));
const Rules       = lazy(() => import('./pages/public/Rules'));
const FAQs        = lazy(() => import('./pages/public/FAQs'));
const Gallery     = lazy(() => import('./pages/public/Gallery'));
const Login       = lazy(() => import('./pages/auth/Login'));
const Register    = lazy(() => import('./pages/auth/Register'));
const Profile           = lazy(() => import('./pages/public/Profile'));
const Sponsors          = lazy(() => import('./pages/public/Sponsors'));
const VerifyCertificate = lazy(() => import('./pages/public/VerifyCertificate'));

// Dashboard pages
const Dashboard           = lazy(() => import('./pages/dashboard/Dashboard'));
const CWCLGuide           = lazy(() => import('./pages/dashboard/CWCLGuide'));
const TopicRoadmap        = lazy(() => import('./pages/dashboard/TopicRoadmap'));
const MyProfile           = lazy(() => import('./pages/dashboard/MyProfile'));
const MyStats             = lazy(() => import('./pages/dashboard/MyStats'));
const MyCertificates      = lazy(() => import('./pages/dashboard/MyCertificates'));
const DashboardLeaderboard = lazy(() => import('./pages/dashboard/DashboardLeaderboard'));
const Announcements       = lazy(() => import('./pages/dashboard/Announcements'));
const Community           = lazy(() => import('./pages/dashboard/Community'));

// Admin pages
const AdminDashboard      = lazy(() => import('./pages/admin/AdminDashboard'));
const ManageCertificates  = lazy(() => import('./pages/admin/ManageCertificates'));
const ManageContests      = lazy(() => import('./pages/admin/ManageContests'));
const ImportResults       = lazy(() => import('./pages/admin/ImportResults'));
const ManageUsers         = lazy(() => import('./pages/admin/ManageUsers'));
const ManageBadges        = lazy(() => import('./pages/admin/ManageBadges'));
const ManageSponsors      = lazy(() => import('./pages/admin/ManageSponsors'));
const ManageAnnouncements = lazy(() => import('./pages/admin/ManageAnnouncements'));
const SeedContests        = lazy(() => import('./pages/admin/SeedContests'));
const CommunitySettings   = lazy(() => import('./pages/admin/CommunitySettings'));
const FoundingMemberSettings = lazy(() => import('./pages/admin/FoundingMemberSettings'));
const FoundingMembersAdmin   = lazy(() => import('./pages/admin/FoundingMembersAdmin'));

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#111827',
              color: '#fff',
              border: '1px solid rgba(0,229,255,0.2)',
              fontFamily: 'Inter, sans-serif',
            },
          }}
        />
        <ScrollToTop />
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Public */}
            <Route element={<PublicLayout />}>
              <Route index                         element={<Home />}        />
              <Route path="about"                  element={<About />}       />
              <Route path="schedule"               element={<Schedule />}    />
              <Route path="leaderboard"            element={<Leaderboard />} />
              <Route path="winners"                element={<Winners />}     />
              <Route path="hall-of-fame"           element={<HallOfFame />}     />
              <Route path="founding-members"       element={<FoundingMembers />} />
              <Route path="rules"                  element={<Rules />}          />
              <Route path="faqs"                   element={<FAQs />}        />
              <Route path="gallery"                element={<Gallery />}     />
              <Route path="sponsors"               element={<Sponsors />}    />
              <Route path="profile/:participantId" element={<Profile />}     />
              <Route path="verify/:certificateId"  element={<VerifyCertificate />} />
              <Route path="verify"                 element={<VerifyCertificate />} />
            </Route>

            {/* Auth */}
            <Route path="login"    element={<Login />}    />
            <Route path="register" element={<Register />} />

            {/* Participant Dashboard */}
            <Route element={<ProtectedRoute />}>
              <Route element={<DashboardLayout />}>
                <Route path="dashboard"                   element={<Dashboard />}             />
                <Route path="dashboard/guide"             element={<CWCLGuide />}             />
                <Route path="dashboard/roadmap"           element={<TopicRoadmap />}          />
                <Route path="dashboard/leaderboard"       element={<DashboardLeaderboard />}  />
                <Route path="dashboard/announcements"     element={<Announcements />}         />
                <Route path="dashboard/profile"           element={<MyProfile />}             />
                <Route path="dashboard/stats"             element={<MyStats />}               />
                <Route path="dashboard/certificates"      element={<MyCertificates />}        />
                <Route path="dashboard/community"         element={<Community />}             />
              </Route>
            </Route>

            {/* Admin */}
            <Route element={<AdminRoute />}>
              <Route element={<AdminLayout />}>
                <Route path="admin"                     element={<AdminDashboard />}      />
                <Route path="admin/certificates"        element={<ManageCertificates />}  />
                <Route path="admin/contests"            element={<ManageContests />}      />
                <Route path="admin/results"             element={<ImportResults />}       />
                <Route path="admin/users"               element={<ManageUsers />}         />
                <Route path="admin/badges"              element={<ManageBadges />}        />
                <Route path="admin/sponsors"            element={<ManageSponsors />}      />
                <Route path="admin/announcements"       element={<ManageAnnouncements />} />
                <Route path="admin/seed"                element={<SeedContests />}        />
                <Route path="admin/community"          element={<CommunitySettings />}   />
                <Route path="admin/founding-members"   element={<FoundingMemberSettings />} />
                <Route path="admin/founding-members-list" element={<FoundingMembersAdmin />} />
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

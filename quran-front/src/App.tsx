import { Routes, Route, Navigate } from 'react-router-dom';

import AdminLogin from './pages/AdminLogin';
import StudentLayout from './components/layout/StudentLayout';
import TeacherLayout from './components/layout/TeacherLayout';
import PublicLayout from './layouts/PublicLayout';
import ProtectedRoute from './components/auth/ProtectedRoute';
import PublicOnlyRoute from './components/auth/PublicOnlyRoute';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import LoginStudent from './pages/LoginStudent';
import LoginTeacher from './pages/LoginTeacher';
import RegisterStudent from './pages/RegisterStudent';
import RegisterTeacher from './pages/RegisterTeacher';
import Teachers from './pages/Teachers';
import TeacherProfile from './pages/TeacherProfile';
import AdminLayout from './layouts/AdminLayout';
import AdminOverview from './pages/admin/AdminOverview';
import AdminTeachers from './pages/admin/AdminTeachers';
import AdminStudents from './pages/admin/AdminStudents';
import AdminMessages from './pages/admin/AdminMessages';
import AdminBookings from './pages/admin/AdminBookings';
import AdminPackages from './pages/admin/AdminPackages';
import AdminPromoCodes from './pages/admin/AdminPromoCodes';
import WithdrawalRequests from './pages/admin/WithdrawalRequests';
import AdminPayouts from './pages/admin/AdminPayouts';
import AdminUsers from './pages/admin/AdminUsers';
import FinancialDashboard from './pages/admin/FinancialDashboard';
import AdminGuidePage from './pages/admin/AdminGuidePage';
import AdminSettings from './pages/admin/AdminSettings';
import Dashboard from './pages/student/Dashboard';
import StudentHome from './pages/student/StudentHome';
import TeacherHome from './pages/teacher/TeacherHome';
import TeacherDashboard from './pages/teacher/TeacherDashboard';
import TeacherPackages from './pages/teacher/TeacherPackages';
import TeacherBookings from './pages/teacher/TeacherBookings';
import TeacherStudents from './pages/teacher/TeacherStudents';
import Schedule from './pages/student/Schedule';
import StudentProgress from './pages/student/StudentProgress';
import Leaderboard from './pages/student/Leaderboard';
import ChatPage from './pages/common/ChatPage';
import ProfilePage from './pages/common/ProfilePage';
import WalletPage from './pages/common/WalletPage';
import Classroom from './pages/Sessions/Classroom';
import HowItWorks from './pages/public/HowItWorks';
import HowToUsePlatform from './pages/public/HowToUsePlatform';
import LandingPage from './pages/public/LandingPage';
import AboutUs from './pages/public/AboutUs';
import VerifyEmail from './pages/common/VerifyEmail';
import PrivacyPolicy from './pages/public/PrivacyPolicy';
import TermsOfUse from './pages/public/TermsOfUse';
import TeacherFinancialPolicy from './pages/public/TeacherFinancialPolicy';
import ContactPage from './pages/public/ContactPage';
import SuspendedPage from './pages/public/SuspendedPage';
import StudentRefundPolicy from './pages/public/StudentRefundPolicy';
import NotFound from './pages/public/NotFound';
import GoogleSSOCallback from './pages/public/GoogleSSOCallback';
import SignalRManager from './components/common/SignalRManager';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Toaster } from 'react-hot-toast';

import { GoogleOAuthProvider } from '@react-oauth/google';

const GOOGLE_CLIENT_ID = "570179879457-0dmed65utvam1fcqa9lhqnbvsrhj4jca.apps.googleusercontent.com";



function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        <ThemeProvider>
          <AuthProvider>
          <SignalRManager />
          <Toaster position="top-right" />
          <Routes>
            {/* Public Routes - Wrapped in PublicLayout */}
            <Route path="/" element={<PublicLayout />}>
              <Route index element={<LandingPage />} />
              <Route path="about-us" element={<AboutUs />} />
              <Route path="how-it-works" element={<HowItWorks />} />
              <Route path="how-to-use" element={<HowToUsePlatform />} />
              <Route path="privacy" element={<PrivacyPolicy />} />
              <Route path="terms" element={<TermsOfUse />} />
              <Route path="contact" element={<ContactPage />} />
              <Route path="teachers-public" element={<Teachers />} />
              <Route path="teacher/:id" element={<TeacherProfile />} />
              <Route path="verify-email" element={<VerifyEmail />} />
              <Route path="teacher-financial-policy" element={<TeacherFinancialPolicy />} />
              <Route path="suspended" element={<SuspendedPage />} />
              <Route path="student-refund-policy" element={<StudentRefundPolicy />} />
              <Route path="google-sso-callback" element={<GoogleSSOCallback />} />

              {/* Public Only Routes (Redirect if logged in) */}
              <Route element={<PublicOnlyRoute />}>
                <Route path="login" element={<Login />} />
                <Route path="forgot-password" element={<ForgotPassword />} />
                <Route path="reset-password" element={<ResetPassword />} />
                <Route path="student/login" element={<LoginStudent />} />
                <Route path="teacher/login" element={<LoginTeacher />} />
                <Route path="register/student" element={<RegisterStudent />} />
                <Route path="register/teacher" element={<RegisterTeacher />} />
                <Route path="secure-admin-portal" element={<AdminLogin />} />
              </Route>
            </Route>

            {/* Student Protected Routes */}
            <Route element={<ProtectedRoute allowedRoles={['Student']} />}>
              <Route path="/student" element={<StudentLayout />}>
                <Route path="home" element={<StudentHome />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="schedule" element={<Schedule />} />
                <Route path="progress" element={<StudentProgress />} />
                <Route path="leaderboard" element={<Leaderboard />} />
                <Route path="wallet" element={<WalletPage />} />
                <Route path="profile" element={<ProfilePage />} />
                <Route path="chat" element={<ChatPage />} />
                <Route path="classroom/:sessionId" element={<Classroom />} />
              </Route>
            </Route>

            {/* Teacher Protected Routes */}
            <Route element={<ProtectedRoute allowedRoles={['Teacher']} />}>
              <Route path="/teacher" element={<TeacherLayout />}>
                <Route path="home" element={<TeacherHome />} />
                <Route path="dashboard" element={<TeacherDashboard />} />
                <Route path="packages" element={<TeacherPackages />} />
                <Route path="bookings" element={<TeacherBookings />} />
                <Route path="students" element={<TeacherStudents />} />
                <Route path="schedule" element={<Schedule />} />
                <Route path="finance" element={<WalletPage />} />
                <Route path="finance" element={<WalletPage />} />
                <Route path="profile" element={<Navigate to="/teacher/dashboard?tab=settings" replace />} />
                <Route path="chat" element={<ChatPage />} />
                <Route path="classroom/:sessionId" element={<Classroom />} />
              </Route>
            </Route>

            {/* Admin Protected Routes */}
            {/* Admin Protected Routes */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={['Admin']}>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/admin/overview" replace />} />
              <Route path="dashboard" element={<Navigate to="/admin/overview" replace />} /> {/* Legacy Redirect */}
              <Route path="overview" element={<AdminOverview />} />
              <Route path="teachers" element={<AdminTeachers />} />
              <Route path="teachers/:teacherId/packages" element={<TeacherPackages />} />
              <Route path="students" element={<AdminStudents />} />
              <Route path="bookings" element={<AdminBookings />} />
              <Route path="packages" element={<AdminPackages />} />
              <Route path="payouts" element={<AdminPayouts />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="promo-codes" element={<AdminPromoCodes />} />
              <Route path="withdrawals" element={<WithdrawalRequests />} />
              <Route path="financial" element={<FinancialDashboard />} />
              <Route path="messages" element={<AdminMessages />} />
              <Route path="settings" element={<AdminSettings />} />
              <Route path="how-it-works" element={<AdminGuidePage />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </ThemeProvider>
    </GoogleOAuthProvider>
  );
}

export default App;

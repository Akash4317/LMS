import './App.css'
import { useSocket } from './hooks/useSocket';

// Layout
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { useAuthStore } from './store/authStore';

// Pages
import { Home } from './pages/Home';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { Layout } from './components/layout/Layout';
import { Dashboard } from './pages/Dashboard';
import { Courses } from './pages/Courses';
import { CourseDetail } from './pages/CourseDetail';
import { Assignments } from './pages/Assignments';
import { NotFound } from './pages/NotFound';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { MyCourses } from './pages/MyCourses';
import { LiveClasses } from './pages/LiveClasses';
import { Profile } from './pages/Profile';
import { Attendance } from './pages/Attendance';
import { Users } from './pages/Users';
import { ForgotPassword } from './pages/ForgotPassword';
import { ResetPassword } from './pages/ResetPassword';

function App() {

  const { isAuthenticated } = useAuthStore();
  useSocket();

  return (
    <>
      <BrowserRouter>
        <Routes>

          {/* public route */}
          <Route path='/' element={<Home />} />
          <Route path='/forgot-password' element={<ForgotPassword />} />
          <Route path='/reset-password/:token' element={<ResetPassword />} />
          <Route path='/login' element={isAuthenticated ? <Navigate to="/dashboard" /> : <Login />} />
          <Route path='/register' element={isAuthenticated ? <Navigate to="/dashboard" /> : <Register />} />

          {/* Protected Routes */}
          <Route path='/dashboard' element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
          <Route path='/courses' element={<ProtectedRoute><Layout><Courses /></Layout></ProtectedRoute>} />
          <Route path='/courses/:id' element={<ProtectedRoute><Layout><CourseDetail /></Layout></ProtectedRoute>} />
          <Route path="/my-courses" element={<ProtectedRoute allowedRoles={['STUDENT']}><Layout><MyCourses /></Layout></ProtectedRoute>} />
          <Route path='assignments' element={<ProtectedRoute><Layout><Assignments /></Layout></ProtectedRoute>} />
          <Route path="/live-classes" element={<ProtectedRoute><Layout><LiveClasses /></Layout></ProtectedRoute>} />
          <Route path="/attendance" element={<ProtectedRoute><Layout><Attendance /></Layout></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Layout><Profile /></Layout></ProtectedRoute>} />
          <Route path="/users" element={<ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN']}><Layout><Users /></Layout></ProtectedRoute>} />

          {/* 404 Not Found */}
          <Route path='*' element={<NotFound />} />

        </Routes>
      </BrowserRouter>
    </>
  )
}

export default App


import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';

import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

import Home from './pages/Home.jsx';
import Pets from './pages/Pets.jsx';
import PetDetail from './pages/PetDetail.jsx';
import PetForm from './pages/PetForm.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Messages from './pages/Messages.jsx';
import Notifications from './pages/Notifications.jsx';
import Donate from './pages/Donate.jsx';
import PaymentSuccess from './pages/PaymentSuccess.jsx';
import Favorites from './pages/Favorites.jsx';
import Quiz from './pages/Quiz.jsx';
import Stories from './pages/Stories.jsx';
import Admin from './pages/Admin.jsx';

// Scroll page to top whenever route changes
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant',
    });
  }, [pathname]);

  return null;
}

export default function App() {
  return (
    <>
      <ScrollToTop />

      <Navbar />

      <main>
        <Routes>

          {/* Public Routes */}
          <Route path="/" element={<Home />} />

          <Route path="/pets" element={<Pets />} />

          <Route path="/pets/:id" element={<PetDetail />} />

          <Route path="/login" element={<Login />} />

          <Route path="/register" element={<Register />} />

          <Route path="/donate" element={<Donate />} />

          <Route path="/match" element={<Quiz />} />

          <Route path="/stories" element={<Stories />} />


          {/* Protected Pet Routes */}
          <Route
            path="/pets/new"
            element={
              <ProtectedRoute>
                <PetForm />
              </ProtectedRoute>
            }
          />

          <Route
            path="/pets/:id/edit"
            element={
              <ProtectedRoute>
                <PetForm />
              </ProtectedRoute>
            }
          />


          {/* User Dashboard */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />


          {/* Favorites */}
          <Route
            path="/favorites"
            element={
              <ProtectedRoute>
                <Favorites />
              </ProtectedRoute>
            }
          />


          {/* Messages */}
          <Route
            path="/messages"
            element={
              <ProtectedRoute>
                <Messages />
              </ProtectedRoute>
            }
          />


          {/* Notifications */}
          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <Notifications />
              </ProtectedRoute>
            }
          />


          {/* Payment Success */}
          <Route
            path="/payment/success"
            element={
              <ProtectedRoute>
                <PaymentSuccess />
              </ProtectedRoute>
            }
          />


          {/* Admin */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <Admin />
              </ProtectedRoute>
            }
          />


          {/* 404 - Redirect to Home */}
          <Route
            path="*"
            element={<Navigate to="/" replace />}
          />

        </Routes>
      </main>

      <Footer />
    </>
  );
}

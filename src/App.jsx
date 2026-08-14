import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import GalleryManager from "./pages/GalleryManager";
import ProgramsManager from "./pages/ProgramsManager";
import TeamManager from "./pages/TeamManager";
import StoriesManager from "./pages/StoriesManager";
import EventsManager from "./pages/EventsManager";
import PrayerRequestsManager from "./pages/PrayerRequestsManager";
import Settings from "./pages/Settings";

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Login */}
        <Route path="/login" element={<Login />} />

        {/* Dashboard */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Gallery */}
        <Route
          path="/gallery"
          element={
            <ProtectedRoute>
              <Layout>
                <GalleryManager />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Programs */}
        <Route
          path="/programs"
          element={
            <ProtectedRoute>
              <Layout>
                <ProgramsManager />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Team */}
        <Route
          path="/team"
          element={
            <ProtectedRoute>
              <Layout>
                <TeamManager />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Stories */}
        <Route
          path="/stories"
          element={
            <ProtectedRoute>
              <Layout>
                <StoriesManager />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Events */}
        <Route
          path="/events"
          element={
            <ProtectedRoute>
              <Layout>
                <EventsManager />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Prayer Requests */}
        <Route
          path="/prayer-requests"
          element={
            <ProtectedRoute>
              <Layout>
                <PrayerRequestsManager />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Settings */}
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Layout>
                <Settings />
              </Layout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </AuthProvider>
  );
}
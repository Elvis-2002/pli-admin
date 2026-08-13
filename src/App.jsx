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
        <Route path="/login" element={<Login />} />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <Layout>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/gallery" element={<GalleryManager />} />
                  <Route path="/programs" element={<ProgramsManager />} />
                  <Route path="/team" element={<TeamManager />} />
                  <Route path="/stories" element={<StoriesManager />} />
                  <Route path="/events" element={<EventsManager />} />
                  <Route path="/prayer-requests" element={<PrayerRequestsManager />} />
                  <Route path="/settings" element={<Settings />} />
                </Routes>
              </Layout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </AuthProvider>
  );
}

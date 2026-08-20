import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import { ProtectedRoute } from "./components/layout/ProtectedRoute";
import { AppLayout } from "./components/layout/AppLayout";

import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { Dashboard } from "./pages/Dashboard";
import { Houses } from "./pages/Houses";
import { HouseDetails } from "./pages/HouseDetails";
import { Locations } from "./pages/Locations";
import { Assets } from "./pages/Assets";
import { AddEditAsset } from "./pages/AddEditAsset";
import { AssetDetails } from "./pages/AssetDetails";
import { Maintenance } from "./pages/Maintenance";
import { CalendarPage } from "./pages/Calendar";
import { ServiceHistory } from "./pages/ServiceHistory";
import { Settings } from "./pages/Settings";
import { NotFound } from "./pages/NotFound";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/houses" element={<Houses />} />
              <Route path="/houses/:id" element={<HouseDetails />} />
              <Route path="/locations" element={<Locations />} />
              <Route path="/assets" element={<Assets />} />
              <Route path="/assets/new" element={<AddEditAsset />} />
              <Route path="/assets/:id" element={<AssetDetails />} />
              <Route path="/assets/:id/edit" element={<AddEditAsset />} />
              <Route path="/maintenance" element={<Maintenance />} />
              <Route path="/calendar" element={<CalendarPage />} />
              <Route path="/service-history" element={<ServiceHistory />} />
              <Route path="/settings" element={<Settings />} />
            </Route>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

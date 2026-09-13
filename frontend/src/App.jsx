import React from "react";
import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "./AuthContext";
import Navbar from "./components/Navbar";
import { RequireAuth, RequireAdmin } from "./components/ProtectedRoute";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import CourseDetail from "./pages/CourseDetail";
import MyCourses from "./pages/MyCourses";
import Profile from "./pages/Profile";
import CodePlayground from "./pages/CodePlayground";
import StudyCourse from "./pages/StudyCourse";
import LessonPage from "./pages/LessonPage";
import Comments from "./pages/Comments";
import Admin from "./pages/Admin";
import AdminModules from "./pages/AdminModules";
import AdminLayout from "./components/AdminLayout";
import AdminDashboard from "./pages/AdminDashboard";
import AdminUsers from "./pages/AdminUsers";
import AdminSettings from "./pages/AdminSettings";

export default function App() {
  return (
    <AuthProvider>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/courses/:id" element={<CourseDetail />} />
        <Route path="/fikrlar" element={<Comments />} />
        <Route
          path="/playground"
          element={
            <RequireAuth>
              <CodePlayground />
            </RequireAuth>
          }
        />
        <Route
          path="/profile"
          element={
            <RequireAuth>
              <Profile />
            </RequireAuth>
          }
        />
        <Route
          path="/my-courses"
          element={
            <RequireAuth>
              <MyCourses />
            </RequireAuth>
          }
        />
        <Route
          path="/learn/:courseId"
          element={
            <RequireAuth>
              <StudyCourse />
            </RequireAuth>
          }
        />
        <Route
          path="/learn/:courseId/lessons/:lessonId"
          element={
            <RequireAuth>
              <LessonPage />
            </RequireAuth>
          }
        />
        <Route
          path="/admin"
          element={
            <RequireAdmin>
              <AdminLayout />
            </RequireAdmin>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="manage" element={<Admin />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>
        <Route
          path="/admin/courses/:id/modules"
          element={
            <RequireAdmin>
              <AdminModules />
            </RequireAdmin>
          }
        />
      </Routes>
    </AuthProvider>
  );
}

import React from "react";
import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import History from "./pages/History";

export default function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black animate-gradient">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/history" element={<History />} />
      </Routes>
    </div>
  );
}


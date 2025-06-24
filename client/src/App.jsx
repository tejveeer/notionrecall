import React from "react";
import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import FrontPage from "./pages/FrontPage";
import History from "./pages/History";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<FrontPage />} />
      <Route path="/home" element={<Home />} />
      <Route path="/history" element={<History />} />
    </Routes>
  );
}

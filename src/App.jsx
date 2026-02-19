import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Landing from "./pages/Landing";
import Coach from "./pages/Coach";
import History from "./pages/History";

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/coach" element={<Coach />} />
        <Route path="/history" element={<History />} />
      </Routes>
    </BrowserRouter>
  );
}

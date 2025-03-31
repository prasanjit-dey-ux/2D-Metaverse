import LandingPage from "./Pages/LandingPage/LandingPage.tsx";
import SignUp from "./Pages/SignUp/SignUp.tsx";
import { Route, Routes } from "react-router-dom";

function App() {
  return (
    <>
      <Routes>
        <Route path="*" element={<LandingPage />} />
        <Route path="/" element={<LandingPage />} />
        <Route path="/SignUp" element={<SignUp />} />
      </Routes>
    </>
  );
}

export default App;

import LandingPage from "./Pages/LandingPage/LandingPage.tsx";
import SignIn from "./Pages/SignUp/SignIn.tsx";
import { Route, Routes } from "react-router-dom";

function App() {
  return (
    <>
      <Routes>
        <Route path="*" element={<LandingPage />} />
        <Route path="/" element={<LandingPage />} />
        <Route path="/signin" element={<SignIn />} />
      </Routes>
    </>
  );
}

export default App;

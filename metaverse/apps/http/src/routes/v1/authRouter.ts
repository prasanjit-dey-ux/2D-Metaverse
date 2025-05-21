import { Router } from "express";
import { requestOtp, verifyOtp } from "../../controllers/authController";

export const authRouter = Router();

// Email auth routes

authRouter.post("/email/request-otp", requestOtp);
authRouter.post("/email/verify-otp", verifyOtp);

// OAuth routes

authRouter.get("/google", (req, res) => {
    res.json({ message: "Google OAuth not implemented yet" });
});

authRouter.get("/github", (req, res) => {
    res.json({ message: "GitHub OAuth not implemented yet" });
});

authRouter.get("/google/callback", (req, res) => {
    res.json({ message: "Google OAuth callback not implemented yet" });
});

authRouter.get("/github/callback", (req, res) => {
    res.json({ message: "GitHub OAuth callback not implemented yet" });
});

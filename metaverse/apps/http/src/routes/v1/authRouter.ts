import { Router } from "express";
import { handleGitHubCallback, handleGoogleCallback, redirectToGitHub, redirectToGoogle, requestOTP, verifyOTP } from "../../controllers/authController";


export const authRouter = Router();

// Email auth routes

authRouter.post("/email/request-otp", requestOTP )
authRouter.post("/email/verify-otp", verifyOTP )

// OAuth routes

authRouter.get("/oauth/google", redirectToGoogle)
authRouter.get("/oauth/github", redirectToGitHub)
authRouter.get("/oauth/google/callback", handleGoogleCallback)
authRouter.get("/oauth/github/callback", handleGitHubCallback)



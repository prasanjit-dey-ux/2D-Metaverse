import { Router } from "express";
import { googleAuth, requestOtp, verifyOtp } from "../../controllers/authController";

export const authRouter = Router();

// Email auth routes

authRouter.post("/email/request-otp", requestOtp);
authRouter.post("/email/verify-otp", verifyOtp);

// OAuth routes

authRouter.post("/google", googleAuth)

authRouter.get("/github", (req, res) => {
    res.json({ message: "GitHub OAuth not implemented yet" });
});



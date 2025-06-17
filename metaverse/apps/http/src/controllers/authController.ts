// apps/http/src/controllers/authController.ts
import { Request, Response } from "express";
import { googleAuthService, githubAuthService } from "../service/authService";
// Removed imports for requestOtpInput, verifyOtpInput as they are no longer in use
// import { RequestOtpInput, VerifyOtpInput } from "../types/authSchema"; // Assuming these were here previously


// This function handles Google OAuth callback/login
export const googleAuth = async (req: Request, res: Response): Promise<void> => {
    try {
        const { idToken } = req.body;
        if (!idToken) {
            res.status(400).json({ error: "Google ID token is required." });
            return;

        }
        const result = await googleAuthService(idToken);
        res.json(result);
    } catch (error: any) {
        console.error("Google Auth Error:", error);
        res.status(500).json({ error: error.message || "Google authentication failed." });
    }
};

// This function handles GitHub OAuth callback/login
export const githubAuth = async (req: Request, res: Response): Promise<void> => {
    try {
        const { code } = req.body;
        if (!code) {
            res.status(400).json({ error: "GitHub authorization code is required." });
            return
        }
        const result = await githubAuthService(code);
        res.json(result);
    } catch (error: any) {
        console.error("GitHub Auth Error:", error);
        res.status(500).json({ error: error.message || "GitHub authentication failed." });
    }
};


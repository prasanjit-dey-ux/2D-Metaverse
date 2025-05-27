import { RequestOtpInput, VerifyOtpInput } from "../types/authSchema.js";
import client, {AuthProvider} from "@metaverse/db/client"
import { generateOtp, generateUniqueTag } from "@metaverse/utils";
import { sendOtpEmail } from "@metaverse/email";
import { isBefore } from "date-fns";
import { generateJWT } from "@metaverse/utils";
import axios from "axios";
import { OAuth2Client } from "google-auth-library";


export const requestOtpInput = async (input: RequestOtpInput) => {
    const { email } = input; 

    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now

    // Store in DB
    await client.otp.create({
        data: {
            email,
            code: otp,
            expiresAt,
        },
    });

    // Send email
    await sendOtpEmail(email, otp);

    return { success: true, message: "OTP sent to email" }; 
};

export const verifyOtpInput = async (input: VerifyOtpInput) => {
    const { email, otp } = input;

    const dbOtp = await client.otp.findFirst({
        where:{ email },
        orderBy: { createdAt: "desc" } // Just in case multiple entries
    });

    if (!dbOtp) {
        throw new Error("No OTP found for this email.");
    }

    if(isBefore(dbOtp.expiresAt, new Date())) {
        throw new Error("OTP expired. Please request a new one.");
    }

    if(dbOtp.code !== otp) {
        throw new Error("Invalid OTP.");
    }

    // Optionally delete or clean up old OTPs
    await client.otp.deleteMany({
        where: {
            email,
        },
    });
    
    // Try to find an existing user by email
    const existingUser = await client.user.findUnique({ 
        where: { email } 
    });

    // If user doesnt exists, create a new one (onboarding)
    // ?? IS called nullish coalscing operation in JS/TS
    const user = existingUser ?? await client.user.create({
        data: {
            email, 
            username: email ,
            tag: await generateUniqueTag(email),
        },
    });

    // Generate JWT token for this user
    const token = generateJWT(user.id);


    return { 
        success: true, 
        message: "OTP verified",
        user,
        token
    };
};

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const googleAuthService = async (idToken: string) => {
    const ticket = await googleClient.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();

    if(!payload || !payload.email|| !payload.sub) {
        throw new Error("Invalid Google token");
    }

    const {email, sub, name, picture} = payload;

    // Check for existing user using provider + providerId
    let user = await client.user.findUnique({
        where: {
            provider_providerId: {
                provider: AuthProvider.GOOGLE,
                providerId: sub,
            }
        }
    });

    // If not dound, fall back to email based match (in case user signed up with OTP before)
    if (!user) {
        user = await client.user.findUnique({ where: { email }});

        if (user) {
            // Update to mark as Google User
            user = await client.user.update({
                where: { email },
                data: {
                    provider: AuthProvider.GOOGLE,
                    providerId: sub,
                    displayName: name ?? user.displayName,
                    profileImageUrl: picture ?? user.profileImageUrl,
                },
            });
        } else {
            // create new Google user
            user = await client.user.create({
                data: {
                    email,
                    username: email,
                    tag: await generateUniqueTag(email),
                    displayName: name ?? email,
                    profileImageUrl: picture ?? undefined,
                    provider: AuthProvider.GOOGLE,
                    providerId: sub,
                },
            });

        }
    }

    const token = generateJWT(user.id);

    return {
        success: true,
        message: "Google login successful",
        user,
        token
    };

};

export const githubAuthService = async (code: string) => {
    // exchange code for access token
    const tokenRes = await axios.post(
        "https://github.com/login/oauth/access_token",
        {
            client_id: process.env.GITHUB_CLIENT_ID,
            client_secret: process.env.GITHUB_CLIENT_SECRET,
            code,
        },
        {
            headers: {
                Accept: "application/json",
            },
        }
    );

    const accessToken = tokenRes.data.access_token;
    if (!accessToken) throw new Error("Failed to get Github access token");

    // Get user profile info from github
    const profileRes = await axios.get("https://api.github.com/user", {
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
    });

    const emailRes = await axios.get("https://api.github.com/user/emails", {
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
    });

    const primaryEmail = emailRes.data.find((e: any) => e.primary)?.email;
    if (!primaryEmail) throw new Error("Primary email not found");

    const { login, id: githubId, name, avatar_url } = profileRes.data;

    // Find or create user
    let user = await client.user.findUnique({
        where: {
            provider_providerId: {
                provider: AuthProvider.GITHUB,
                providerId: githubId.toString(),
            },
        },
    });

    if (!user) {
        // Fallback: user exist by email (signed up with OTP or Google)
        user = await client.user.findUnique({
            where: {
                email: primaryEmail
            }
        });

        if (user) {
            user = await client.user.update({
                where: { 
                    email: primaryEmail
                },
                data: {
                    provider: AuthProvider.GITHUB,
                    providerId: githubId.toString(),
                    displayName: name ?? user.displayName,
                    profileImageUrl: avatar_url ?? user.profileImageUrl,
                },
            });
        } else {
            user = await client.user.create({
                data: {
                    email: primaryEmail,
                    username: login,
                    tag: await generateUniqueTag(login),
                    displayName: name ?? login,
                    profileImageUrl : avatar_url,
                    provider: AuthProvider.GITHUB,
                    providerId: githubId.toString(),
                },
            });
        }
    }
    
    const token = generateJWT(user.id);

    return{
        success: true,
        message: "Github login successful",
        user,
        token
    };
};









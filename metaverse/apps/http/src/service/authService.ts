// apps/http/src/service/authService.ts

import client, { AuthProvider } from "@metaverse/db/client"
import { generateUniqueTag, generateJWT } from "@metaverse/utils"; 
import axios from "axios";
import { OAuth2Client } from "google-auth-library";

// (Your Email OTP functions would go here if you re-enable them)

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const googleAuthService = async (idToken: string) => {
    const ticket = await googleClient.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();

    if(!payload || !payload.email || !payload.sub) {
        throw new Error("Invalid Google token");
    }

    const { email, sub, name, picture } = payload;

    let user = await client.user.findUnique({
        where: {
            provider_providerId: {
                provider: AuthProvider.GOOGLE,
                providerId: sub,
            }
        }
    });

    if (!user) {
        // Scenario: User exists by EMAIL (e.g., from GitHub or OTP), but not yet linked to this Google provider.
        // Link the Google provider to this existing user.
        user = await client.user.findUnique({ where: { email }});

        if (user) {
            // User exists by email, update their provider info, but DO NOT OVERWRITE profile data
            user = await client.user.update({
                where: { email },
                data: {
                    provider: AuthProvider.GOOGLE,
                    providerId: sub,
                    // IMPORTANT: DO NOT implicitly update displayName, profileImageUrl, etc. here.
                    // Those should only be updated by the user through the /user/update-profile endpoint.
                },
            });
        } else {
            // Scenario: BRAND NEW USER via Google OAuth (email does not exist in DB)
            const derivedUsername = email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, ''); 
            const uniqueTag = await generateUniqueTag(derivedUsername); 

            user = await client.user.create({
                data: {
                    email,
                    username: derivedUsername, 
                    tag: uniqueTag, 
                    displayName: name ?? derivedUsername, // Initial display name from OAuth if available
                    profileImageUrl: picture ?? null, // Initial profile image from OAuth if available
                    provider: AuthProvider.GOOGLE,
                    providerId: sub,
                    isProfileComplete: false, // NEW: Set to false for a truly fresh OAuth user to force UserInfo setup
                    bio: '', // Initialize bio as empty string
                },
            });
        }
    }
    
    // Always update lastLoginAt
    user = await client.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() }
    });

    const token = generateJWT(user.id);

    return {
        success: true,
        message: "Google login successful",
        user, 
        token,
        profileComplete: user.isProfileComplete, // This flag correctly reflects if they completed the form
    };
};

export const githubAuthService = async (code: string) => {
    try {
        console.log("=== GitHub Auth Service Started ===");
        console.log("Code received:", code);

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
                    "Content-Type": "application/json",
                },
            }
        );

        if (tokenRes.data.error) {
            throw new Error(`GitHub OAuth error: ${tokenRes.data.error_description || tokenRes.data.error}`);
        }

        const accessToken = tokenRes.data.access_token;
        if (!accessToken) {
            throw new Error("Failed to get GitHub access token");
        }

        const profileRes = await axios.get("https://api.github.com/user", {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "User-Agent": "MetaverseApp",
            },
        });

        const emailRes = await axios.get("https://api.github.com/user/emails", {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "User-Agent": "MetaverseApp",
            },
        });

        const primaryEmail = emailRes.data.find((e: any) => e.primary && e.verified)?.email;
        if (!primaryEmail) {
            throw new Error("No verified primary email found in GitHub account. Please verify your email on GitHub.");
        }

        const { login, id: githubId, name, avatar_url } = profileRes.data;

        let user = await client.user.findUnique({
            where: {
                provider_providerId: {
                    provider: AuthProvider.GITHUB,
                    providerId: githubId.toString(),
                },
            },
        });

        if (!user) {
            // Scenario: User exists by EMAIL (e.g., from Google or OTP), but not yet linked to this GitHub provider.
            // Link the GitHub provider to this existing user.
            user = await client.user.findUnique({
                where: {
                    email: primaryEmail
                }
            });

            if (user) {
                // User exists by email, update their provider info, but DO NOT OVERWRITE profile data
                user = await client.user.update({
                    where: { 
                        email: primaryEmail
                    },
                    data: {
                        provider: AuthProvider.GITHUB,
                        providerId: githubId.toString(),
                        // IMPORTANT: DO NOT implicitly update displayName, profileImageUrl, etc. here.
                        // Those should only be updated by the user through the /user/update-profile endpoint.
                    },
                });
            } else {
                // Scenario: BRAND NEW USER via GitHub OAuth (email does not exist in DB)
                const derivedUsername = login.replace(/[^a-zA-Z0-9_]/g, ''); 
                const uniqueTag = await generateUniqueTag(derivedUsername); 

                user = await client.user.create({
                    data: {
                        email: primaryEmail,
                        username: derivedUsername, 
                        tag: uniqueTag, 
                        displayName: name ?? derivedUsername, 
                        profileImageUrl : avatar_url ?? null, 
                        provider: AuthProvider.GITHUB,
                        providerId: githubId.toString(),
                        isProfileComplete: false, // NEW: Set to false for a truly fresh OAuth user
                        bio: '', 
                    },
                });
            }
        } 
        
        // Always update lastLoginAt
        user = await client.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() }
        });

        const token = generateJWT(user.id);

        return {
            success: true,
            message: "GitHub login successful",
            user, 
            token,
            profileComplete: user.isProfileComplete, 
        };
    } catch (error) {
        console.error("=== GitHub Auth Service Error ===");
        console.error("Error details:", error);
        
        if (axios.isAxiosError(error)) {
            console.error("Axios error response (from GitHub API call):", error.response?.data);
            console.error("Axios error status (from GitHub API call):", error.response?.status);
            const errorMsg = error.response?.data?.error_description || 
                             error.response?.data?.error || 
                             error.message;
            throw new Error(`GitHub API error: ${errorMsg}`);
        } else {
            throw error;
        }
    }
};

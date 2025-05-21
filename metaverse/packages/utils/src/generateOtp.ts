import crypto from "crypto";

export function generateOtp(): string {
    const otp = crypto.randomInt(100000, 999999);
    console.log(`OTP: ${otp}`);
    return otp.toString();
}
import z from "zod";

// Schema for requesting OTP
export const requestOtpSchema = z.object({
    email: z.string().email({
        message: "Invalid email format"
    })
})

// Schema for verifying OTP

export const verifyOtpSchema = z.object({
    email: z.string().email({
        message: "Invalid email format",
    }),
    otp: z
    .string()
    .length(6, {message: "OTP must be exactly 6 digits"})
    .regex(/^\d+$/, {message: "OTP must be numeric"}),
});

// Inferred types (for use in controller/service)

export type RequestOtpInput = z.infer<typeof requestOtpSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>
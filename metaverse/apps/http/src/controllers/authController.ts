import { Request, Response}  from "express";
import { requestOtpSchema, verifyOtpSchema } from "../types/authSchema";
import { requestOtpInput, verifyOtpInput } from "../service/authService";
import { ZodError } from "zod";

export const requestOtp = async (req: Request, res: Response): Promise<void> => {
    try{
        // Validate req.body using Zod schema
        const input = requestOtpSchema.parse(req.body)
        
        // Call service with validated input
        const result = await requestOtpInput(input);

        res.status(200).json(result);
    } catch (err) {
          // If it's a Zod validation error, send a 400 response with validation details
        if (err instanceof ZodError) {
            res.status(400).json({ error: err.errors })
            return;
        }
        
        // If some other error, send a generic 500 Internal Server Error  
        if (err instanceof Error) {
            res.status(500).json({ error: err.message });
            return; 
          }

        //Catch-all fallback
        res.status(500).json({ error: "Internal Server Error" });
    }
}

export const verifyOtp  = async (req: Request, res: Response): Promise<void> => {
    try{
        const input = verifyOtpSchema.parse(req.body);
        const result = await verifyOtpInput(input);

        res.status(200).json(result);
    } catch (err) {
        if (err instanceof ZodError) {
            res.status(400).json({ error: err.errors})
            return;
        }

        if (err instanceof Error) {
            res.status(500).json({ error: err.message});
            return;
        }

        res.status(500).json({error: "Internal Server Error"})
    }
}
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET!;
if (!JWT_SECRET) throw new Error("Missing JWT_SECRET");


export interface JwtPayload {
    userId: string;
    iat: number;
    exp: number
}

export const generateJWT = (userId: string) => {
    return jwt.sign({ userId }, JWT_SECRET, {expiresIn:"7d"});
};

export const verifyJWT = (token: string): JwtPayload => {
    try {
        return jwt.verify(token, JWT_SECRET) as JwtPayload;
    } catch (err) {
        throw new Error ("Invalid or expired token");
    }
}





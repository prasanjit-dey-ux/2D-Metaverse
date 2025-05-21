import { Resend } from "resend";

export const resend = new Resend(process.env.RESEND_API_KEY! || "re_7QMHhU57_2yWYj16HnRWp2JpisUWLuets");
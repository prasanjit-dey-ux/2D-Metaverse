import { resend } from "./resend";
import OtpTemplate  from "../emails/OtpTemplate";
import { render } from "@react-email/render";

export const sendOtpEmail = async (email: string, otp: string) => {
  const html = await  render(<OtpTemplate otp={otp} />);

  try {
    const data = await resend.emails.send({
      from: 'Metaverse Auth <onboarding@resend.dev>',
      to: email,
      subject: "Your OTP Code",
      html,
    });

    return data;
  } catch (error) {
    console.error('Failed to send OTP email', error);
    throw new Error('Failed to send OTP email');
  }
}
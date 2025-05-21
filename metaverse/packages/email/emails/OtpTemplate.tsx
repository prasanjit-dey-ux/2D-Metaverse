import * as React from 'react';
import {
    Html,
    Head,
    Body,
    Container,
    Text,
    Heading,
    Preview,
    Section,
} from '@react-email/components';

interface OtpTemplateProps {
    otp: string;
}

    const OtpTemplate = ({ otp }: OtpTemplateProps) => {
    return (
        <Html>
            <Head />
            <Preview>Your OTP code is: {otp}</Preview>
            <Body style={main}>
                <Container style={container}>
                    <Section style={section}>
                        <Heading style={heading}>Your OTP Code</Heading>
                        <Text style={text}>Use the code below to log in:</Text>
                        <Text style={otpStyle}>{otp}</Text>
                        <Text style={text}>This code will expire in 5 minutes.</Text>
                    </Section>
                    <Text style={footer}>
                        If you didn’t request this, you can ignore this email.
                    </Text>
                </Container>
            </Body>
        </Html>
    );
};

export default OtpTemplate;

const main = {
    backgroundColor: "#f9f9f9",
    padding: "40px 0",
    fontFamily: "'Helvetica Neue', Arial, sans-serif",
};

const container = {
    backgroundColor: "#ffffff",
    borderRadius: "8px",
    padding: "30px",
    maxWidth: "480px",
    margin: "0 auto",
    boxShadow: "0 4px 10px rgba(0,0,0,0.05)",
};

const section = {
    textAlign: "center" as const,
};

const heading = {
    fontSize: "24px",
    marginBottom: "20px",
    color: "#786FFF",
};

const text = {
    fontSize: "16px",
    color: "#333",
    margin: "10px 0",
};

const otpStyle = {
    fontSize: "36px",
    fontWeight: "bold" as const,
    letterSpacing: "6px",
    color: "#000",
    backgroundColor: "#f1f1f1",
    padding: "10px 20px",
    borderRadius: "6px",
    display: "inline-block",
    margin: "20px 0",
};

const footer = {
    fontSize: "12px",
    color: "#999",
    textAlign: "center" as const,
    marginTop: "30px",
};

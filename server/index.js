import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { OAuth2Client } from "google-auth-library";

const app = express();

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

app.use(cors());
app.use(bodyParser.json());

const client = new OAuth2Client(process.env.CLIENT_ID);

app.get("/", (req, res) => {
  res.send("Backend is running 🚀");
});

app.post("/api/auth/google", async (req, res) => {
  const { token } = req.body;

  try {
    const User = await client.verifyIdToken({
      idToken: token,
      audience: process.env.CLIENT_ID,
    });

    const payload = User.getPayload();

    const { name, email, picture } = payload;

    res.status(200).json({
      success: true,
      user: { name, email, picture },
    });
  } catch (error) {
    console.error("Token verification error", error);
    res.status(401).json({ success: false, message: "Invalid token" });
  }
});

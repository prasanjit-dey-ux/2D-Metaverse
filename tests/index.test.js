
// // describe blocks
// // let you write test sweet together, if I want to write all the authentication endpoints,I will write it inside the describe block


// const axios = require("axios");

// const BACKEND_URL = "http://localhost:3000";

// describe("Authentication", () => {
//     const userEmail = "testuser@example.com" ;
//     const adminEmail = "admin@example.com" ;

//     // TEST OTP GENERATION
//     test("User should be able to request OTP", async () => {
//         const response = await axios.post(`${BACKEND_URL}/auth/send-otp`, {email: userEmail});

//         expect(response.status).toBe(200);
//         expect(response.data.message).toBe("OTP send successfully");
//     });

//     test("Should return 400 if email is already registered", async () => {
//         try {
//             await axios.post(`${BACKEND_URL}/auth/send-otp`, { email: userEmail });
//         } catch (error) {
//             expect(error.response.status).toBe(400);
//             expect(error.response.data.error).toBe("Email already registered");
//         }
//     });

//     //  Test OTP Verification
//     test("User should be able to verify OTP", async () => {
//         const otp = "123456";

//         const response = await axios.post(`${BACKEND_URL}/auth/verify-otp`, {
//             email: userEmail, 
//             otp,
//         });

//         expect(response.status).toBe(200);
//         expect(response.data.message).toBe("OTP verified successfully");
//         expect(response.data.isAdmin).toBe(false); // default user
//     });

//     test("Should return 400 for invalid OTP", async () => {
//         try {
//            await axios.post(`${BACKEND_URL}/auth/verify-otp`, {
//                 email: userEmail,
//                 otp: "000000", // Wrong OTP
//            });
//         } catch (error) {
//             expect(error.response.status).toBe(400);
//             expect(error.response.data.error).toBe("Invalid OTP");
//         }
//     });

//     // Admin user test
//     test("Admin should be verified and flagged correctly", async() => {
//         const otp = "121233" // assume this is valid OTP

//         // First send OTP to admin
//         await axios.post(`${BACKEND_URL}/auth/send-otp`, {email: adminEmail});

//         // Now verify the OTP
//         const response = await axios.post(`${BACKEND_URL}/auth/verify-otp`, {
//             email: adminEmail,
//             otp,
//         });

//         expect(response.status).toBe(200);
//         expect(response.data.message).toBe("OTP verified successfully");
//         expect(response.data.isAdmin).toBe("true") // Admin check
//     });

//     // TEST TOKEN VALIDATION
//     test("should return user info with valid token", async () => {
//         const loginRes = await axios.post(`${BACKEND_URL}/auth/verify-otp`, {
//             email: userEmail, 
//             otp: "123456"
//         });

//         const token = loginRes.data.token;

//         const response = await axios.get(`${BACKEND_URL}/auth/me`, {
//             headers: {
//                 Authorization: `Bearer ${token}`
//             }
//         });

//         expect(response.status).toBe(200);
//         expect(response.data).toHaveProperty("email", userEmail);
//         expect(response.data).toHaveProperty("id");
//     });

//     // TEST IF NO TOKEN IS PROVIDED
//     test("Should return 400 when no token is provided", async () => {
//         try {
//             await axios.get(`${BACKEND_URL}/auth/me`);
//        } catch (error) {
//             expect(error.response.status).toBe(403);
//             expect(error.response.data.error).toBe("Token required");            
//         }
//     });

// });

const axios = require("axios");

const BACKEND_URL = "http://localhost:3000";

const userEmail = "testuser@example.com";
const adminEmail = "admin@example.com";

let userToken = "";
let adminToken = "";

describe("Authentication", () => {
  beforeAll(async () => {
    // Send OTPs before tests
    await axios.post(`${BACKEND_URL}/auth/send-otp`, { email: userEmail });
    await axios.post(`${BACKEND_URL}/auth/send-otp`, { email: adminEmail });
  });

  // -------------------- OTP GENERATION --------------------

  test("User should be able to request OTP", async () => {
    const res = await axios.post(`${BACKEND_URL}/auth/send-otp`, {
      email: "newuser@example.com",
    });

    expect(res.status).toBe(200);
    expect(res.data.message).toBe("OTP send successfully");
  });

  test("Should return 400 if email is already registered", async () => {
    try {
      await axios.post(`${BACKEND_URL}/auth/send-otp`, { email: userEmail });
    } catch (err) {
      expect(err.response.status).toBe(400);
      expect(err.response.data.error).toBe("Email already registered");
    }
  });

  // -------------------- OTP VERIFICATION --------------------

  test("User should be able to verify OTP", async () => {
    const res = await axios.post(`${BACKEND_URL}/auth/verify-otp`, {
      email: userEmail,
      otp: "123456",
    });

    expect(res.status).toBe(200);
    expect(res.data.message).toBe("OTP verified successfully");
    expect(res.data.isAdmin).toBe(false);
    userToken = res.data.token; // Save token for later
  });

  test("Should return 400 for invalid OTP", async () => {
    try {
      await axios.post(`${BACKEND_URL}/auth/verify-otp`, {
        email: userEmail,
        otp: "000000",
      });
    } catch (err) {
      expect(err.response.status).toBe(400);
      expect(err.response.data.error).toBe("Invalid OTP");
    }
  });

  test("Admin should be verified and flagged correctly", async () => {
    const res = await axios.post(`${BACKEND_URL}/auth/verify-otp`, {
      email: adminEmail,
      otp: "123456",
    });

    expect(res.status).toBe(200);
    expect(res.data.message).toBe("OTP verified successfully");
    expect(res.data.isAdmin).toBe(true);
    adminToken = res.data.token; // Save admin token
  });

  // -------------------- TOKEN VERIFICATION --------------------

  test("Should return user info with valid token", async () => {
    const res = await axios.get(`${BACKEND_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${userToken}`,
      },
    });

    expect(res.status).toBe(200);
    expect(res.data).toHaveProperty("email", userEmail);
    expect(res.data).toHaveProperty("id");
  });

  test("Should return 403 when no token is provided", async () => {
    try {
      await axios.get(`${BACKEND_URL}/auth/me`);
    } catch (err) {
      expect(err.response.status).toBe(403);
      expect(err.response.data.error).toBe("Token required");
    }
  });
});

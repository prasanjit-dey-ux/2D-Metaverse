import "dotenv/config";
import express from "express";
import { router as v1Router} from "./routes/v1";
import cors from "cors";
import client from "@metaverse/db/client"


const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
    origin: "http://localhost:5173"
}))

app.use(express.json());

app.use("/api/v1",v1Router);

app.listen(PORT, () => {
    console.log(`Server is runninng on PORT ${PORT}`);  
});

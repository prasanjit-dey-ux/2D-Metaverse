import express from "express";
import { router } from "./routes/v1/index";

const app = express();
const PORT = process.env.PORT

app.use(express.json()); // to parse json
app.use("/api/v1", router);


app.listen(PORT || 3000, () => {
    console.log(`Server is running ${PORT || 3000}`);
    
});
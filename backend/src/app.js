import express from 'express'
import cors from 'cors'
import authRoute from "./routes/auth.routes.js"

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoute)

export default app;
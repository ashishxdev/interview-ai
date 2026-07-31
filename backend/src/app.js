import express from 'express'
import cors from 'cors'
import authRoute from "./routes/auth.routes.js"
import resumeRoute from "./routes/resume.routes.js"
import interviewRoutes from "./routes/interview.routes.js";
import dashboardRoute from "./routes/dashboard.routes.js"

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoute)
app.use('/api/resume', resumeRoute)
app.use("/api/interview", interviewRoutes);
app.use("/api/dashboard", dashboardRoute);

export default app;
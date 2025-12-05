import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import http from "http";
import cluster from "cluster";
import os from "os";
import connectDB from "./db/index.js";
import { rateLimit } from "express-rate-limit";
import xss from "xss";
import helmet from "helmet";
import validator from "validator";
import setUpJobs from "./utils/jobs.js";
import { routes } from "./routes/routes.js";
import https from "https";

const PORT = process.env.PORT || 3000;

const numCPUs = os.cpus().length;
const useCluster = process.env.USE_CLUSTER === 'true';

if (useCluster && cluster.isPrimary) {
    console.log(`Master process is running. Spawning ${numCPUs} worker processes...`);

    for (let i = 0; i < numCPUs; i++) {
        cluster.fork();
    }

    cluster.on('exit', (worker, code, signal) => {
        console.log(`Worker ${worker.process.pid} died`);
    });
} else {
    const app = express();
    connectDB();
    app.use(express.json());

    app.use(cors({
        origin: "*",
        methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
        credentials: false,
    }));

    const limiter = rateLimit({
        windowMs: 15 * 60 * 1000,
        limit: 1000,
        standardHeaders: 'draft-7',
        validate: { xForwardedForHeader: false }
    });

    app.use(limiter);

    app.use(helmet());

    app.use((req, res, next) => {
        req.body = JSON.parse(JSON.stringify(req.body), (key, value) =>
            typeof value === 'string' ? xss(value) : value
        );
        req.query = JSON.parse(JSON.stringify(req.query), (key, value) =>
            typeof value === 'string' ? xss(value) : value
        );
        req.params = JSON.parse(JSON.stringify(req.params), (key, value) =>
            typeof value === 'string' ? xss(value) : value
        );
        next();
    });

    const sanitizeInput = (data) => {
        if (typeof data === 'string') {
            return validator.escape(data);
        }
        if (typeof data === 'object' && data !== null) {
            for (const key in data) {
                data[key] = sanitizeInput(data[key]);
            }
        }
        return data;
    };

    app.use((req, res, next) => {
        req.body = sanitizeInput(req.body);
        req.query = sanitizeInput(req.query);
        req.params = sanitizeInput(req.params);
        next();
    });

    Object.values(routes).forEach((route) => {
        app.use(route);
    });

    const server = http.createServer(app);

    server.listen(PORT, () => {
        console.log(`Worker ${process.pid} is running on http://localhost:${PORT}`);
        setUpJobs();
    });

    if (process.env.ENABLE_KEEP_ALIVE === 'true') {
        setInterval(() => {
            https.get(process.env.SERVER_URL, (res) => {
                console.log("Pinging server to keep alive");
            }).on("error", (err) => {
                console.error("Error pinging server: ", err.message);
            });
        }, 10 * 60 * 1000);
    }
}
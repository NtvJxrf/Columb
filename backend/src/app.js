import express from "express"
import cors from "cors"
import helmet from "helmet"
import morgan from "morgan"
import routes from "./routes/index.js"
import { errorConverter, errorHandler } from "./middlewares/error.middleware.js"
import config from "./config/index.js"
import logger from "./utils/logger.js"
import cookieParser from 'cookie-parser'

// import path from "path"
// import { fileURLToPath } from "url"
// const __dirname = path.dirname(fileURLToPath(import.meta.url))

import { initModels } from "./databases/db.js"
await initModels()

const app = express()

app.use(
  morgan(config.env === "development" ? "dev" : "combined", {
    stream: { write: (message) => logger.info(message.trim()) },
  })
)
app.use(helmet())
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())
app.set('trust proxy', true);
app.use('/', routes)
// Error handling
app.use(errorConverter)
app.use(errorHandler)

export default app

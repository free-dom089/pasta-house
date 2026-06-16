const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const env = require("./env");
const routes = require("../routes");
const notFound = require("../middleware/notFound");
const errorHandler = require("../middleware/errorHandler");

const app = express();

const corsOptions = {
  origin(origin, callback) {
    if (!origin || env.CLIENT_ORIGINS.length === 0 || env.CLIENT_ORIGINS.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true
};

const jsonParser = express.json({ limit: "1mb" });

app.use(helmet());
app.use(cors(corsOptions));
app.use((req, res, next) => {
  if (req.originalUrl === "/api/payments/webhook" || req.originalUrl === "/api/payments/paystack/webhook") {
    return next();
  }
  return jsonParser(req, res, next);
});
app.use(express.urlencoded({ extended: true }));

if (env.NODE_ENV !== "test") {
  app.use(morgan("dev"));
}

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Pasta House API is running"
  });
});

app.use("/api", routes);
app.use(notFound);
app.use(errorHandler);

module.exports = app;

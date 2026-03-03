import express from 'express';
import connectDB from './config/db.js';
import cors from 'cors';
import 'dotenv/config';
// import './utils/cron.js';
import helmet from "helmet";
import morgan from "morgan";
import fs from "fs";
import swaggerUI from "swagger-ui-express";
import { rateLimiter } from './utils/rateLimiter.js';

// Read swagger json
const swaggerDocument = JSON.parse(
  fs.readFileSync("./docs/swagger.json", "utf8")
);

// Route Imports
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import independentProRoutes from './routes/independentProRoutes.js';
import stateCityRoutes from './routes/StateCityRoutes.js';
import salesExecutiveRoutes from './routes/salesExecutiveRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import salonRoutes from './routes/salonRoutes.js';
import serviceItemRoutes from './routes/serviceItemRoutes.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(helmet());
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());
app.use(rateLimiter);

// Swagger UI (your external docs)
app.use("/api-docs", swaggerUI.serve, swaggerUI.setup(swaggerDocument));

connectDB().then(() => {
  app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
  });
}).catch((error) => {
  console.error('Error connecting to the database:', error);
  process.exit(1);
});


// Default Route
app.get('/', (req, res) => {
  res.send('Testing , Welcome to the Glownify API Server.');
});

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/salons', salonRoutes); // For salon related routes (like getSalonByID)
app.use('/api/v1/independent-pro', independentProRoutes);
app.use('/api/v1/service-items', serviceItemRoutes); // For service item related routes (like getSalonServiceItems)
app.use('/api/v1/reviews', reviewRoutes);

app.use('/api/v1/state-city', stateCityRoutes);
app.use('/api/v1/sales-executive', salesExecutiveRoutes);
app.use('/api/v1/bookings', bookingRoutes);
app.use('/api/v1/categories', categoryRoutes);


app.use((req, res) => {
  res.status(404).json({ message: 'The requested route does not exist.' });
});

import errorHandler from './middlewares/errorHandler.js';
// Global Error Handler
app.use(errorHandler);

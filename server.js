import express from 'express';
import connectDB from './config/db.js';
import cors from 'cors';
import 'dotenv/config';
import './utils/cron.js';

import fs from "fs";
import swaggerUI from "swagger-ui-express";

// Read swagger json
const swaggerDocument = JSON.parse(
  fs.readFileSync("./docs/swagger.json", "utf8")
);

// Route Imports
import authRoutes from './routes/authRoutes.js';
import salonAdminRoutes from './routes/salonAdminRoutes.js';
import superAdminRoutes from './routes/superAdminRoutes.js';
import userRoutes from './routes/userRoutes.js';
import independentProRoutes from './routes/independentProRoutes.js';
import stateCityRoutes from './routes/StateCityRoutes.js';
import salesmanRoutes from './routes/salesmanRoutes.js';
import salesExecutiveRoutes from './routes/salesExecutiveRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

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
  res.send('Hello From Server');
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/super-admin', superAdminRoutes);
app.use('/api/salon-admin', salonAdminRoutes);
app.use('/api/user', userRoutes);
app.use('/api/independent-pro', independentProRoutes);
app.use('/api/state-city', stateCityRoutes);
app.use('/api/salesman', salesmanRoutes);
app.use('/api/sales-executive', salesExecutiveRoutes);
app.use('/api/booking', bookingRoutes);

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

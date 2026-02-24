import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';

import dashboardRouter from './routes/dashboard';
import routesRouter from './routes/routes';
import customersRouter from './routes/customers';
import ordersRouter from './routes/orders';
import productsRouter from './routes/products';
import driversRouter from './routes/drivers';
import deliveriesRouter from './routes/deliveries';
import reportsRouter from './routes/reports';

const app = express();

app.use(helmet());
app.use(cors({ origin: '*' }));
app.use(compression());
app.use(morgan('dev'));
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', app: 'RouteFlow API', version: '1.0.0' });
});

app.use('/api/dashboard', dashboardRouter);
app.use('/api/routes', routesRouter);
app.use('/api/customers', customersRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/products', productsRouter);
app.use('/api/drivers', driversRouter);
app.use('/api/deliveries', deliveriesRouter);
app.use('/api/reports', reportsRouter);

app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

export default app;

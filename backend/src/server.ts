import { initializeDatabase } from './db/database';
import app from './app';

const PORT = parseInt(process.env.PORT || '3001', 10);

initializeDatabase();

app.listen(PORT, () => {
  console.log(`RouteFlow API running on http://localhost:${PORT}`);
});

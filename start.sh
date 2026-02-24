#!/usr/bin/env bash
set -e

echo ""
echo "  RouteFlow — startup"
echo "  ==================="
echo ""

# Install dependencies if node_modules are missing
if [ ! -d "backend/node_modules" ] || [ ! -d "frontend/node_modules" ]; then
  echo "Installing dependencies..."
  npm run install:all
fi

# Seed the database only on first run
if [ ! -f "backend/data/routeflow.db" ]; then
  echo "Seeding demo database..."
  npm run seed
fi

# Build the frontend into backend/dist so a single server handles everything
echo "Building frontend..."
npm run build:frontend

# Detect local IP for iPad access hint
if command -v ipconfig &>/dev/null; then
  LOCAL_IP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || echo "")
else
  LOCAL_IP=$(hostname -I 2>/dev/null | awk '{print $1}' || echo "")
fi

echo ""
echo "  Starting server on port 3001..."
echo ""
echo "  Open in browser:"
echo "    Mac / PC  →  http://localhost:3001"
if [ -n "$LOCAL_IP" ]; then
  echo "    iPad      →  http://$LOCAL_IP:3001"
  echo ""
  echo "  (iPad must be on the same Wi-Fi network as this computer)"
fi
echo ""

npm run dev:backend

FROM node:22 AS builder

WORKDIR /app

COPY package*.json ./
COPY backend/package.json ./backend/
COPY frontend/package.json ./frontend/
RUN npm ci -w backend

COPY backend ./backend
RUN npm run build -w backend

FROM node:22

WORKDIR /app

COPY package*.json ./
COPY backend/package.json ./backend/
COPY frontend/package.json ./frontend/
RUN npm ci -w backend --only=production

COPY --from=builder /app/backend/dist ./backend/dist

WORKDIR /app/backend

EXPOSE 3000

CMD ["node", "dist/index.js"]

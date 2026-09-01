FROM node:26 AS builder

WORKDIR /app

COPY package*.json ./
COPY backend/package.json ./backend/
COPY frontend/package.json ./frontend/
RUN npm ci -w frontend

COPY frontend ./frontend
RUN npm run build -w frontend

FROM nginx:1.31

COPY --from=builder /app/frontend/dist /usr/share/nginx/html

EXPOSE 80

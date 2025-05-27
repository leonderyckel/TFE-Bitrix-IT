# Build du frontend (React)
FROM node:18 AS frontend-build
WORKDIR /app/frontend
COPY client/package*.json ./
RUN npm install
COPY client/ .
RUN npm run build

# Backend (Node.js)
FROM node:18
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
COPY --from=frontend-build /app/frontend/build ./client/build
EXPOSE 5001
CMD ["npm", "start"] 
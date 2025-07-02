FROM node:20-bullseye-slim
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN apt-get update && apt-get upgrade -y && apt-get clean && rm -rf /var/lib/apt/lists/*
EXPOSE 5000
CMD ["node", "server.js"]
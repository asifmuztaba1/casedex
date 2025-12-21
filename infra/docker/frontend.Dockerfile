FROM node:22-bullseye-slim

RUN npm install -g corepack && corepack enable

WORKDIR /app

EXPOSE 3000

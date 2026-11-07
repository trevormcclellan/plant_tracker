FROM node:24-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production PORT=4000
COPY package*.json ./
RUN npm ci --omit=dev
COPY index.js server.js database.js ./
USER node
EXPOSE 4000
CMD ["node", "index.js"]

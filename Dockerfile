FROM node:26-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production PORT=4000
COPY package*.json ./
RUN npm ci --omit=dev
COPY index.js server.js database.js ./
USER node
EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:' + (process.env.PORT || 4000) + '/api/health', { signal: AbortSignal.timeout(4000) }).then(response => process.exit(response.status === 200 ? 0 : 1)).catch(() => process.exit(1))"
CMD ["node", "index.js"]

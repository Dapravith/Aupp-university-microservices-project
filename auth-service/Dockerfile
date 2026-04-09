FROM node:24-alpine

ENV NODE_ENV=production

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY . .

# Create logs directory for volume mount
RUN mkdir -p /app/logs

EXPOSE 5004

CMD ["node", "index.js"]

FROM node:20-alpine
WORKDIR /app
RUN apk add --no-cache dumb-init
COPY package*.json ./
RUN npm ci --only=production
RUN npm install -g pm2
COPY . .
EXPOSE 5000
CMD ["dumb-init", "pm2-runtime", "index.js", "-i", "max"]

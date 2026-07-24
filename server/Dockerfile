FROM node:20-alpine
RUN addgroup -g 1001 -S oriveo && adduser -S oriveo -u 1001 -G oriveo
WORKDIR /app
RUN apk add --no-cache dumb-init
COPY package*.json ./
RUN npm ci --only=production
RUN npm install -g pm2
COPY . .
RUN chown -R oriveo:oriveo /app
USER oriveo
EXPOSE 5000
CMD ["dumb-init", "pm2-runtime", "pm2.config.cjs"]

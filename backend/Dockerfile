FROM node:20-alpine AS deps

WORKDIR /app

COPY package.json package-lock.json* ./

RUN npm ci --only=production --frozen-lockfile

FROM node:20-alpine AS production

RUN apk add --no-cache dumb-init curl

ENV NODE_ENV=production

WORKDIR /app

RUN addgroup -g 1001 nodejs && \
    adduser -D -u 1001 -G nodejs nodeuser

COPY --from=deps --chown=nodeuser:nodejs /app/node_modules ./node_modules

COPY --chown=nodeuser:nodejs . .

USER nodeuser

EXPOSE 5000

HEALTHCHECK --interval=15s --timeout=5s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:5000/health || exit 1

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server.js"]
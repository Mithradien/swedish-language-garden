# ---- byggstage: installerar och bygger appen för egen server ----
FROM node:22-alpine AS builder
WORKDIR /app

# Installerar beroenden (package-lock.json finns inte i projektet, därför npm install)
COPY package.json ./
RUN npm install --no-audit --no-fund

# Kopierar koden och bygger med Node.js-målet
COPY . .
ENV NITRO_PRESET=node-server
RUN npm run build

# ---- körstage: bara den färdiga bygget, ingen kod och inga beroenden ----
FROM node:22-alpine
WORKDIR /app
ENV PORT=3000 HOST=0.0.0.0 NODE_ENV=production
COPY --from=builder /app/.output ./.output
EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]

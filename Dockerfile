FROM node:20-slim AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# VITE_* vars are inlined into the JS bundle at build time, not read at
# runtime — must be passed as build args, and changing one requires a rebuild.
ARG VITE_API_URL
ARG VITE_PUBLIC_WEBHOOK_URL
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_PUBLIC_WEBHOOK_URL=$VITE_PUBLIC_WEBHOOK_URL
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80

# ── build stage ──────────────────────────────────────────────
FROM node:20-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

ARG VITE_API_BASE_URL=http://localhost:18080
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

RUN npm run build

# ── production stage ────────────────────────────────────────
FROM nginx:alpine

# remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

COPY nginx.conf /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html

# BACKEND_URL is resolved at container startup by envsubst (built into nginx image)
ENV BACKEND_URL=http://host.docker.internal:18080

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

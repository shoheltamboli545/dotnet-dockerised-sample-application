# Build the static React application
FROM node:16-alpine AS build
WORKDIR /app
COPY package.json ./
RUN npm install
COPY public ./public
COPY src ./src
RUN npm run build

# Serve the build and proxy API calls to the backend service
FROM nginx:1.25-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/build /usr/share/nginx/html
EXPOSE 80 443

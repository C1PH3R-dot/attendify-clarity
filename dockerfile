From node:18-alpine AS build
WORKDIR /app
copy package*.json ./
RUN npm install
copy . .
RUN npm run build
From nginx:alpine
copy --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
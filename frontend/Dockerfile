# Etapa 1: Construcción de la aplicación React SPA con Vite
FROM node:20-alpine AS build

WORKDIR /app

# Copiar manifiestos de dependencias
COPY package*.json ./

# Instalar dependencias limpias
RUN npm ci || npm install

# Copiar el código fuente completo del frontend
COPY . .

# Argumento para URL base de la API (configurable en tiempo de build)
ARG VITE_API_URL=http://localhost:8000/api
ENV VITE_API_URL=$VITE_API_URL

# Compilar frontend
RUN npm run build

# Etapa 2: Servidor Web Nginx de alto rendimiento
FROM nginx:alpine

# Copiar configuración personalizada de Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiar archivos estáticos compilados
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

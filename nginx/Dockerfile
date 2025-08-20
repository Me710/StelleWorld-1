# Dockerfile pour Nginx (développement)
FROM nginx:1.25-alpine

# Copier la configuration Nginx
COPY nginx.conf /etc/nginx/nginx.conf

# Créer les répertoires nécessaires
RUN mkdir -p /var/www/static /var/www/uploads

# Exposer les ports
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

FROM nginx:alpine

# envsubst is in the gettext package
RUN apk add --no-cache gettext

# (Optional for dev hot-reload) inotify-tools
# RUN apk add --no-cache inotify-tools

# Put templates and entrypoint into the image
COPY templates/ /templates/
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Nginx expects its conf under /etc/nginx
# We'll render into /etc/nginx/conf.d at runtime
ENTRYPOINT ["/entrypoint.sh"]

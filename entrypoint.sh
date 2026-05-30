#!/bin/sh

# Replace build-time placeholders with runtime values
if [ -n "$VITE_API_URL" ]; then
  find /usr/share/nginx/html/assets -name '*.js' -exec sed -i "s|http://localhost:3000|${VITE_API_URL}|g" {} +
fi

if [ -n "$VITE_APP_NAME" ]; then
  find /usr/share/nginx/html/assets -name '*.js' -exec sed -i "s|__APP_NAME_PLACEHOLDER__|${VITE_APP_NAME}|g" {} +
else
  find /usr/share/nginx/html/assets -name '*.js' -exec sed -i "s|__APP_NAME_PLACEHOLDER__|Open|g" {} +
fi

if [ -n "$VITE_APP_SUBTITLE" ]; then
  find /usr/share/nginx/html/assets -name '*.js' -exec sed -i "s|__APP_SUBTITLE_PLACEHOLDER__|${VITE_APP_SUBTITLE}|g" {} +
else
  find /usr/share/nginx/html/assets -name '*.js' -exec sed -i "s|__APP_SUBTITLE_PLACEHOLDER__|Helpdesk|g" {} +
fi

exec nginx -g 'daemon off;'

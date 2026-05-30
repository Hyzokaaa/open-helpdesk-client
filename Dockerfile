FROM node:22-alpine AS build

WORKDIR /app

ARG VITE_API_URL=http://localhost:3000
ARG VITE_APP_NAME=__APP_NAME_PLACEHOLDER__
ARG VITE_APP_SUBTITLE=__APP_SUBTITLE_PLACEHOLDER__

ENV VITE_API_URL=$VITE_API_URL
ENV VITE_APP_NAME=$VITE_APP_NAME
ENV VITE_APP_SUBTITLE=$VITE_APP_SUBTITLE

COPY package.json ./

RUN npm install

COPY . .

RUN npm run build


FROM nginx:alpine AS production

COPY --from=build /app/dist /usr/share/nginx/html

COPY nginx.conf /etc/nginx/conf.d/default.conf

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 80

ENTRYPOINT ["/entrypoint.sh"]

FROM node:16.13.2-alpine3.15 as builder

COPY ./src /ui/src
COPY ./public /ui/public
COPY package.json /ui/
COPY package-lock.json /ui/
COPY tsconfig.json /ui/
WORKDIR /ui

RUN npm i
RUN npm run build

FROM nginx:1.23.2

COPY --from=builder /ui/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

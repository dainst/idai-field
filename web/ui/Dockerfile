FROM node:lts as builder

COPY ./src /ui/src
COPY ./public /ui/public
COPY package.json /ui/
COPY package-lock.json /ui/
COPY tsconfig.json /ui/
WORKDIR /ui

RUN npm i
RUN npm run build

FROM nginx

COPY --from=builder /ui/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

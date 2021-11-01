#!/usr/bin/env bash

npx http-server -p 8000 dist &
#disown
sleep 3
until $(curl --output /dev/null --silent --head --fail http://127.0.0.1:8000/android-index.json); do
  printf '.'
  sleep 5
done
#curl http://127.0.0.1:8000/android-index.json

turtle build:android \
  --type apk \
  --keystore-path ./keystore.jks \
  --keystore-alias "keyalias" \
  --allow-non-https-public-url \
  --public-url http://127.0.0.1:8000/android-index.json \
  --build-dir ./build-container

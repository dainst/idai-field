#!/usr/bin/env bash

python3 -m http.server -d dist &
disown
sleep 3
curl http://127.0.0.1:8000/android-index.json

turtle build:android \
  --type apk \
  --keystore-path ./keystore.jks \
  --keystore-alias "keyalias" \
  --allow-non-https-public-url \
  --public-url http://127.0.0.1:8000/android-index.json \
  --build-dir ./build-container

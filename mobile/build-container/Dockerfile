
FROM openjdk:8

RUN curl -fsSL https://deb.nodesource.com/setup_14.x | bash -
RUN apt-get install -y nodejs

RUN npm install --global --unsafe-perm turtle-cli


RUN turtle setup:android --sdk-version 40.0.0

ENV EXPO_ANDROID_KEYSTORE_PASSWORD="keystorepassword"
ENV EXPO_ANDROID_KEY_PASSWORD="keypassword"

WORKDIR /mobile
ENTRYPOINT [ "sh","./build-container/entrypoint.sh" ]
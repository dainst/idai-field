FROM elixir:1.14.1
# This comes with imagemagick 6.9, including delegates jp2, jpeg, png

COPY . /opt/src/api

RUN apt-get update && apt-get install -y curl gnupg
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
RUN apt-get install -y nodejs

WORKDIR "/opt/src/api/assets/js"

RUN npm install
RUN npm run build

WORKDIR "/opt/src/api"

RUN ["mix", "local.hex", "--force"]
RUN ["mix", "local.rebar", "--force"]
RUN ["mix", "deps.get"]
RUN ["mix", "deps.compile"]

ENTRYPOINT ["mix", "run", "--no-halt"]

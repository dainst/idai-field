FROM elixir:1.14.1
# currently (September 2020) this comes with imagemagick 6.9, including delegates jp2, jpeg, png

COPY . /opt/src/api

RUN apt-get update
RUN apt-get install nodejs -y
RUN apt-get install npm -y

WORKDIR "/opt/src/api/assets/js"

RUN npm install
RUN npm run build

WORKDIR "/opt/src/api"

RUN ["mix", "local.hex", "--force"]
RUN ["mix", "local.rebar", "--force"]
RUN ["mix", "deps.get"]
RUN ["mix", "deps.compile"]

ENTRYPOINT ["mix", "run", "--no-halt"]

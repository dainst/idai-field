FROM elixir:latest

COPY . /opt/src/server

WORKDIR "/opt/src/server"

RUN ["mix", "local.hex", "--force"]
RUN ["mix", "local.rebar", "--force"]
RUN ["mix", "deps.get"]
RUN ["mix", "deps.compile"]

ENTRYPOINT ["mix", "phx.server"]
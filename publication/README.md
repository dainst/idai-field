# FieldPublication

## Getting started

### Docker containers

```
$ docker-compose up elasticsearch
$ docker-compose up api
```

### Phoenix server

To start your Phoenix server:

  * Run `mix setup` to install and setup dependencies
  * Start Phoenix endpoint with `mix phx.server` or inside IEx with `iex -S mix phx.server`

Now you can visit [`localhost:4000`](http://localhost:4000) from your browser.

Ready to run in production? Please [check our deployment guides](https://hexdocs.pm/phoenix/deployment.html).

## Troubleshooting

### Problem with MacOS Sonoma

Problem: `$ mix setup` responded with `zsh: bus error  mix setup`.

Remedy is doing

```
export KERL_CONFIGURE_OPTIONS="--disable-jit"
asdf install erlang 25.3.2.6
```

Solution found [here](https://github.com/erlang/otp/issues/7687#issuecomment-1737297515).

## Learn more

  * Official website: https://www.phoenixframework.org/
  * Guides: https://hexdocs.pm/phoenix/overview.html
  * Docs: https://hexdocs.pm/phoenix
  * Forum: https://elixirforum.com/c/phoenix-forum
  * Source: https://github.com/phoenixframework/phoenix

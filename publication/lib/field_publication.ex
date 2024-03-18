defmodule FieldPublication do
  @moduledoc """
  FieldPublication keeps the contexts that define your domain
  and business logic.

  Contexts are also responsible for managing your data, regardless
  if it comes from the database, an external API or others.
  """

  def cantaloupe_url() do
    Application.get_env(:field_publication, :cantaloupe_url)
  end
end

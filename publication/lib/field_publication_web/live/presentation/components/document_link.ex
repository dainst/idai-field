defmodule FieldPublicationWeb.Presentation.Components.DocumentLink do
  use Phoenix.Component

  alias FieldPublication.Publications
  alias FieldPublication.Publications.Data

  def show(assigns) do
    ~H"""
    <.link
      class="text-[0.8125rem] leading-6 text-zinc-900 font-semibold hover:text-zinc-700"
      patch={"/#{@project}/#{@date}/#{@lang}/#{@uuid}"}
    >
      <% publication = Publications.get!(@project, @date) %>
      <%= Data.get_document(@uuid, publication) |> Data.get_field_values("identifier") %>
    </.link>
    """
  end
end

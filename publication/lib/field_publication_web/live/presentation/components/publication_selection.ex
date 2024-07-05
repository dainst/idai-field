defmodule FieldPublicationWeb.Presentation.Components.PublicationSelection do
  use FieldPublicationWeb, :html
  use FieldPublicationWeb, :verified_routes

  def render(assigns) do
    ~H"""
    <div class="flex flex-row gap-2 items-center">
      <.link navigate={~p"/"}>
        <.icon name="hero-globe-europe-africa-solid" />
      </.link>
      <div>/</div>
      <div><%= @current_publication.project_name %></div>
      <div>/</div>
      <%= render_publication_dropdown(assigns) %>
      <div>/</div>
      <%= render_language_dropdown(assigns) %>
      <div>/</div>
      <.link patch={
        ~p"/projects/#{@current_publication.project_name}/#{@current_publication.draft_date}/#{@selected_lang}"
      }>
        <.icon name="hero-home-solid" />
      </.link>
      <%= if @identifier do %>
        <div>/</div>
        <div>
          <%= @identifier %>
        </div>
      <% end %>
    </div>
    """
  end

  defp render_publication_dropdown(assigns) do
    ~H"""
    <div class="group relative">
      <%= @current_publication.draft_date %>
      <%= if Enum.count(@publications) > 1 do %>
        <.icon name="hero-chevron-down-mini" />

        <div class="z-10 bg-white p-2 outline outline-1 absolute hidden group-hover:block w-max">
          <div class="font-semibold mb-2">Available publications</div>
          <%= for publication <- @publications do %>
            <% url =
              ~p"/projects/#{publication.project_name}/#{publication.draft_date}/#{@selected_lang}"

            url =
              if Map.has_key?(assigns, :uuid) do
                "#{url}/#{@uuid}"
              else
                url
              end %>
            <div class={"#{if publication.draft_date == @current_publication.draft_date, do: "bg-slate-100 outline outline-1 outline-slate-500", else: ""} p-1"}>
              <.link patch={url}>
                Project state <%= publication.draft_date %>
                <%= if publication.publication_date do %>
                  <span>, published <%= publication.publication_date %></span>
                <% else %>
                  <span>, not yet published.</span>
                <% end %>
              </.link>
            </div>
          <% end %>
        </div>
      <% end %>
    </div>
    """
  end

  defp render_language_dropdown(assigns) do
    ~H"""
    <div class="group relative">
      <%= @selected_lang %>

      <%= if Enum.count(@current_publication.languages) > 1 do %>
        <.icon name="hero-chevron-down-mini" />
        <div class="z-10 bg-white p-2 outline outline-1 absolute hidden group-hover:block w-max">
          <div class="font-semibold mb-2">Available languages</div>
          <%= for language <- @current_publication.languages do %>
            <% url =
              ~p"/projects/#{@current_publication.project_name}/#{@current_publication.draft_date}/#{language}"

            url =
              if Map.has_key?(assigns, :uuid) do
                "#{url}/#{@uuid}"
              else
                url
              end %>

            <div class={"#{if language == @selected_lang, do: "bg-slate-100 outline outline-1 outline-slate-500", else: ""} p-1"}>
              <.link patch={url}>
                <%= language %>
              </.link>
            </div>
          <% end %>
        </div>
      <% end %>
    </div>
    """
  end
end

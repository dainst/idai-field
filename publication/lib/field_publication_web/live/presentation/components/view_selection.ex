defmodule FieldPublicationWeb.Presentation.Components.ViewSelection do
  use FieldPublicationWeb, :html
  use FieldPublicationWeb, :verified_routes

  def render(assigns) do
    ~H"""
    <div class="pl-4 flex flex-row gap-4">
      <.link navigate={~p"/#{@project}/#{@date}/#{@lang}/#{@uuid}"}>
        <span class="hero-table-cells"></span> Details
      </.link>
      <.link navigate={~p"/#{@project}/#{@date}/#{@lang}/map/#{@uuid}"}>
        <span class="hero-map"></span> Map
      </.link>
      <.link navigate={~p"/#{@project}/#{@date}/#{@lang}/hierarchy/#{@uuid}"}>
        <span class="hero-view-columns"></span> Hierarchy
      </.link>
      <.link navigate={~p"/#{@project}/#{@date}/#{@lang}/search/#{@uuid}"}>
        <span class="hero-magnifying-glass"></span> Search
      </.link>
    </div>
    """
  end
end
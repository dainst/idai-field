defmodule FieldPublicationWeb.Presentation.Components.ViewSelection do
  use FieldPublicationWeb, :html
  use FieldPublicationWeb, :verified_routes

  def render(assigns) do
    ~H"""
    <div class="pl-4 flex flex-row gap-4">
      <.link
        navigate={~p"/#{@project}/#{@date}/#{@lang}/#{@uuid}"}
        class={
          if @current == :detail,
            do: "outline outline-offset-2 outline-4 outline-blue-500 bg-slate-500/10 rounded"
        }
      >
        <span class="hero-table-cells"></span> Details
      </.link>
      <.link
        navigate={~p"/#{@project}/#{@date}/#{@lang}/hierarchy/#{@uuid}"}
        class={
          if @current == :hierarchy,
            do: "outline outline-offset-2 outline-4 outline-blue-500 bg-slate-500/10 rounded"
        }
      >
        <span class="hero-view-columns"></span> Hierarchy
      </.link>
    </div>
    """
  end
end

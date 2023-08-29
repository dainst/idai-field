defmodule FieldPublicationWeb.PublicationLive.ProgressBarComponent do
  use Phoenix.Component

  attr :status, :map, required: true
  def display(assigns) do
    ~H"""
    <div class="bg-slate-600 relative h-4 w-full text-xs font-semibold text-white">
      <div
        class="bg-indigo-500 absolute top-0 left-0 flex h-full items-center justify-center"
        style={"width: #{@status.percentage}%"}
      ></div>
      <div class="w-full absolute text-center">
        <%= @status.counter %> / <%= @status.overall %>
      </div>
    </div>
    """
  end
end

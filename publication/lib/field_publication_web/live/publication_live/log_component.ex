defmodule FieldPublicationWeb.PublicationLive.LogComponent do
  use Phoenix.Component

  attr :logs, :list, required: true
  def list(assigns) do
    ~H"""
    <div>
      <%= for {severity, _id, datetime, msg} <- @logs do %>
        <div class="flex">
          <%= case severity do %>
            <% :error -> %>
              <div class="mt-2 ml-1 mr-2 h-2 w-2 bg-red-500 rounded-2xl"></div>
            <% :ok -> %>
              <div class="mt-2 ml-1 mr-2 h-2 w-2 bg-green-500 rounded-2xl"></div>
          <% end %>
          <div><pre><%= datetime %> | <%= msg %></pre></div>
        </div>
      <% end %>
    </div>
    """
  end
end

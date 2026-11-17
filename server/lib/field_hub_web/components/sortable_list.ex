defmodule FieldHubWeb.Components.SortableTable do
  use FieldHubWeb, :html

  slot :column do
    attr(:heading, :string, required: true)
    attr(:sort_key, :string, required: true)
  end

  attr(:rows, :list, default: [])
  attr(:event, :string, required: true)
  attr(:current_column, :string)
  attr(:current_direction, :atom)

  def sortable_table(assigns) do
    ~H"""
    <table style="table-layout: fixed;">
      <thead>
        <tr>
          <th
            :for={col <- @column}
            class={"sortable-list-heading #{if @current_column == col.sort_key, do: @current_direction}"}
            phx-click={@event}
            phx-value-column={col.sort_key}
          >
            {col.heading}
          </th>
        </tr>
      </thead>

      <tbody>
        <tr :for={row <- @rows}>
          <td :for={col <- @column}>{render_slot(col, row)}</td>
        </tr>
      </tbody>
    </table>
    """
  end
end

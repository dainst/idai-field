defmodule Api.Worker.Images.TilesTemplateTest do
  use ExUnit.Case
  alias Api.Worker.Images.TilesTemplate

  test "500x500;256" do
    template = TilesTemplate.create({500, 500}, 256)
    assert template == [
      {{250.0, [%{x_index: 0, x_pos: 0, y_index: 0, y_pos: 0}]}, 0},
      {{500,
        [
          %{x_index: 0, x_pos: 0, y_index: 0, y_pos: 0},
          %{x_index: 0, x_pos: 0, y_index: 1, y_pos: 256},
          %{x_index: 1, x_pos: 256, y_index: 0, y_pos: 0},
          %{x_index: 1, x_pos: 256, y_index: 1, y_pos: 256}
        ]}, 1}
    ]
  end
end

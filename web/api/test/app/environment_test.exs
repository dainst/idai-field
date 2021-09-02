defmodule Api.AppTest.EnvironmentTest do
  use ExUnit.Case, async: true
  use Plug.Test

  test "test imagemagick" do
    assert Api.Worker.Images.ImageMagickImageConverter.environment_ready()
  end
end

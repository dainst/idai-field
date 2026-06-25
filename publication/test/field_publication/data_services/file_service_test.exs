defmodule FieldPublication.FileServiceTest do
  use ExUnit.Case, async: false

  alias FieldPublication.FileService

  @custom_images_path "data/file_store/custom_assets/images"

  setup do
    File.mkdir_p!(@custom_images_path)
    File.rm(Path.join(@custom_images_path, "safe_upload.png"))

    source_path =
      Path.join(System.tmp_dir!(), "field-publication-upload-#{System.unique_integer([:positive])}.png")

    File.write!(source_path, "image")

    on_exit(fn ->
      File.rm(source_path)
      File.rm(Path.join(@custom_images_path, "safe_upload.png"))
    end)

    %{source_path: source_path}
  end

  test "rejects admin image uploads with path-like names", %{source_path: source_path} do
    assert {:error, :invalid_name} =
             FileService.store_admin_image_upload(source_path, "../safe_upload.png")

    assert {:error, :invalid_name} =
             FileService.store_admin_image_upload(source_path, "..\\safe_upload.png")
  end

  test "rejects svg admin image uploads", %{source_path: source_path} do
    assert {:error, :unsupported_extension} =
             FileService.store_admin_image_upload(source_path, "safe_upload.svg")
  end

  test "stores admin image uploads with sanitized safe names", %{source_path: source_path} do
    assert {:ok, "safe_upload.png"} =
             FileService.store_admin_image_upload(source_path, "safe upload.PNG")

    assert File.exists?(Path.join(@custom_images_path, "safe_upload.png"))
  end
end

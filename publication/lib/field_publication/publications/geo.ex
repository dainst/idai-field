defmodule FieldPublication.Publications.Geo do
  alias FieldPublication.{
    CouchService,
    FileService,
    Publications
  }

  alias FieldPublication.Publications.Data

  alias FieldPublication.DatabaseSchema.Publication

  def read_and_set_epsg_code(%Publication{database: db} = publication) do
    {:ok, %{status: 200, body: body}} = CouchService.get_document("project", db)

    case Jason.decode!(body) do
      %{"resource" => %{"epsgId" => id}} ->
        Publications.put(publication, %{epsg_code: id})

      _epsgId_key_not_present ->
        Publications.put(publication, %{epsg_code: nil})
    end
  end

  def get_projection(epsg_code) do
    Path.join([
      Application.app_dir(:field_publication),
      "priv",
      "epsg_projections.json"
    ])
    |> File.read!()
    |> Jason.decode!()
    |> Map.get("#{epsg_code}")
  end

  def generate_normalized_geometries(
        %Publication{project_identifier: project_identifier, draft_date: draft_date, database: db} =
          publication
      ) do
    project_epsg_id =
      Data.get_raw_document("project", publication)
      |> case do
        %{"resource" => %{"epsgId" => id}} ->
          id

        _ ->
          nil
      end

    config = Publications.get_configuration(publication)

    geometry_collection =
      CouchService.get_document_stream(%{selector: %{}}, db)
      |> Stream.reject(fn
        %{"resource" => %{"geometry" => val}} when not is_nil(val) ->
          false

        _other ->
          true
      end)
      |> Enum.map(&Data.apply_project_configuration(&1, config, publication))
      |> Enum.reduce(
        %{
          type: "FeatureCollection",
          features: [],
          name: "Vector geometries for #{publication._id}."
        },
        fn
          %Data.Document{
            geometry: geometry,
            category: %Data.Category{} = category_info
          } = doc,
          geometry_collection ->
            updated_features =
              geometry_collection.features ++
                [
                  %{
                    type: "Feature",
                    geometry: geometry,
                    properties: %{
                      uuid: doc.id,
                      type: geometry["type"],
                      identifier: doc.identifier,
                      description: doc.description,
                      category: category_info.name
                    }
                  }
                ]

            geometry_collection
            |> Map.put(:features, updated_features)
            |> Map.update(
              :properties,
              %{category_metadata: [category_info]},
              fn existing ->
                # TODO: add info to list if not already there
                Enum.find(existing.category_metadata, fn %{name: name} ->
                  name == category_info.name
                end)
                |> case do
                  nil ->
                    Map.put(
                      existing,
                      :category_metadata,
                      existing.category_metadata ++ [category_info]
                    )

                  _ ->
                    existing
                end
              end
            )

          _failed_to_apply_config, geometry_collection ->
            geometry_collection
        end
      )

    temp_path =
      Path.join([
        System.tmp_dir!(),
        "field_publication_#{project_identifier}_#{draft_date}_geo_normalization"
      ])

    File.mkdir_p(temp_path)

    if project_epsg_id do
      # To set the OGC urn in the geo json's "crs" field, we trigger a "reprojection" to the same ESPG code.
      reproject_geo_json(
        geometry_collection,
        Path.join([temp_path, "vector_geometries_EPSG-#{project_epsg_id}.geojson"]),
        project_epsg_id,
        project_epsg_id
      )

      if project_epsg_id != 4326 do
        # When there is no EPSG code given, assume custom crs and do not attempt any reprojections.
        reproject_geo_json(
          geometry_collection,
          Path.join([temp_path, "vector_geometries_EPSG-4326.geojson"]),
          project_epsg_id,
          4326
        )
      end
    else
      # When there is no EPSG code given, assume custom crs and do not attempt any reprojections.
      File.write(
        Path.join([temp_path, "vector_geometries_custom-crs.geojson"]),
        Jason.encode!(geometry_collection)
      )
    end

    final_path = FileService.geo_data_path(publication)

    File.mkdir_p!(final_path)
    File.cp_r!(temp_path, final_path)
    File.rm_rf!(temp_path)
  end

  defp reproject_geo_json(
         %{properties: collection_properties} = geo_json,
         output_file,
         input_epsg,
         output_epsg
       )
       when is_number(input_epsg) and is_number(output_epsg) do
    temp_file =
      output_file
      |> Path.dirname()
      |> Path.join("temp.geojson")

    File.write!(temp_file, Jason.encode!(geo_json))

    result =
      System.cmd(
        "gdal",
        [
          "vector",
          "reproject",
          "--input-crs",
          "EPSG:#{input_epsg}",
          "--output-crs",
          "EPSG:#{output_epsg}",
          "--overwrite",
          temp_file,
          output_file
        ],
        stderr_to_stdout: true
      )
      |> case do
        {_, 0} ->
          # GDAL leaves quite a lot of whitespace in the result files, this makes sure the whitespace gets minimized by `Jason.encode!/2`.
          minimized =
            File.read!(output_file)
            |> Jason.decode!()
            # GDAL does not keep the FeatureCollection properties when reprojecting, properties on FeatureCollections is not a GeoJSON standard.
            # We re-add them manually again here.
            |> Map.put(:properties, collection_properties)
            |> Jason.encode!()

          File.write!(output_file, minimized)
          File.write!("#{output_file}.gz", minimized |> :zlib.gzip())
          File.write!("#{output_file}.br", minimized |> ExBrotli.compress!())
          :ok

        {msg, code} ->
          {:error, {msg, code}}
      end

    File.rm!(temp_file)

    result
  end

  def vector_geometries(%Publication{} = publication, epsg_code) do
    case FileService.geo_vector_data_path(publication, epsg_code, :none) do
      {:ok, path} ->
        path
        |> File.read!()
        |> Jason.decode()

      _ ->
        {:error, :found}
    end
  end

  def uuid_to_epsg_4326_feature_mapping(%Publication{} = publication) do
    Publications.Geo.vector_geometries(publication, 4326)
    |> case do
      {:ok, feature_collection} ->
        feature_collection
        |> Map.get("features")
        |> Enum.map(fn %{"geometry" => geometry, "properties" => %{"uuid" => uuid}} ->
          {uuid, geometry}
        end)
        |> Enum.into(%{})

      _ ->
        %{}
    end
  end
end

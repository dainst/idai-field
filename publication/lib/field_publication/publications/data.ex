defmodule FieldPublication.Publications.Data do
  require FieldPublicationWeb.Gettext

  alias FieldPublication.{
    Publications,
    CouchService
  }

  alias FieldPublication.DatabaseSchema.Publication

  defmodule Document do
    @derive Jason.Encoder
    @enforce_keys [:id, :identifier, :category, :project, :publication]
    defstruct [
      :id,
      :identifier,
      :project,
      :publication,
      :category,
      groups: [],
      relations: [],
      image_uuids: []
    ]
  end

  defmodule Category do
    @derive Jason.Encoder
    @enforce_keys [:name, :labels, :color]
    defstruct [:name, :labels, :color]
  end

  defmodule Group do
    @derive Jason.Encoder
    @enforce_keys [:name, :labels]
    defstruct [:name, :labels, fields: []]
  end

  defmodule RelationGroup do
    @derive Jason.Encoder
    @enforce_keys [:name, :labels]
    defstruct [:name, :labels, docs: []]
  end

  defmodule Field do
    @derive Jason.Encoder
    @enforce_keys [:name, :value, :labels, :input_type]
    defstruct [:name, :value, :labels, :value_labels, :input_type]
  end

  def document_map_to_struct(map) do
    %Document{
      id: map["id"],
      identifier: map["identifier"],
      project: map["project"],
      publication: map["publication"],
      category: %Category{
        name: map["category"]["name"],
        labels: map["category"]["labels"],
        color: map["category"]["color"]
      },
      groups:
        map
        |> Map.get("groups", [])
        |> Enum.map(fn group ->
          %Group{
            name: group["name"],
            labels: group["labels"],
            fields:
              Enum.map(group["fields"], fn field ->
                %Field{
                  name: field["name"],
                  value: field["value"],
                  labels: field["labels"],
                  value_labels: field["value_labels"],
                  input_type: field["input_type"]
                }
              end)
          }
        end),
      relations:
        map
        |> Map.get("relations", [])
        |> Enum.map(fn relation_group ->
          %RelationGroup{
            name: relation_group["name"],
            labels: relation_group["labels"],
            docs: Enum.map(relation_group["docs"], &document_map_to_struct/1)
          }
        end),
      image_uuids: map["image_uuids"]
    }
  end

  def get_all_subcategories(publication, category_name) do
    publication
    |> Publications.get_configuration()
    |> Enum.find(fn %{"item" => item} ->
      category_name == item["name"]
    end)
    |> then(fn entry ->
      flatten_category_tree(entry)
    end)
  end

  def document_exists?(uuid, %Publication{database: db}) do
    CouchService.head_document(uuid, db)
    |> case do
      {:ok, %{status: 200}} ->
        true

      _ ->
        false
    end
  end

  def get_doc_count(%Publication{database: db}) do
    CouchService.get_database(db)
    |> then(fn {:ok, %{status: 200, body: body}} ->
      body
      |> Jason.decode!()
      |> Map.get("doc_count", 0)
    end)
  end

  def get_raw_document(uuid, %Publication{database: db}) do
    CouchService.get_document(uuid, db)
    |> then(fn {:ok, %{body: body}} ->
      Jason.decode!(body)
    end)
  end

  def get_raw_documents(uuids, %Publication{database: db}) do
    CouchService.get_documents(uuids, db)
    |> then(fn {:ok, %{body: body}} ->
      Jason.decode!(body)
      |> Map.get("results", [])
    end)
    |> Enum.map(fn %{"docs" => docs} ->
      Enum.map(docs, fn doc ->
        case doc do
          %{"ok" => doc} ->
            doc

          other ->
            {:error, other}
        end
      end)
    end)
    |> List.flatten()
  end

  def get_extended_document(uuid, %Publication{} = publication, include_relations \\ false)
      when is_binary(uuid) do
    config = Publications.get_configuration(publication)

    get_raw_document(uuid, publication)
    |> apply_project_configuration(config, publication, include_relations)
  end

  def get_extended_documents(
        uuids,
        %Publication{database: db} = publication,
        include_relations \\ false
      ) do
    config = Publications.get_configuration(publication)

    get_raw_documents(uuids, %Publication{database: db})
    |> Enum.map(&apply_project_configuration(&1, config, publication, include_relations))
  end

  def get_doc_stream_for_categories(%Publication{database: database}, categories)
      when is_list(categories) do
    query =
      %{
        selector: %{
          "$or":
            Enum.map(categories, fn category ->
              %{"resource.category" => category}
            end)
        }
      }

    run_query(query, database)
  end

  def get_doc_stream_for_georeferenced(%Publication{database: database}) do
    query = %{
      selector: %{
        "resource.georeference": %{
          "$ne": nil
        }
      }
    }

    run_query(query, database)
  end

  def get_doc_stream_for_all(%Publication{database: database}) do
    run_query(
      %{
        selector: %{}
      },
      database
    )
  end

  def get_project_map_layers(%Publication{database: database}) do
    %{
      selector: %{
        "resource.relations.isMapLayerOf": %{
          "$elemMatch": %{
            "$eq": "project"
          }
        }
      }
    }
    |> run_query(database)
    |> Enum.to_list()
  end

  def get_field_value(doc, name) do
    doc
    |> get_field(name)
    |> case do
      nil ->
        nil

      %Field{} = field ->
        field.value
    end
  end

  def get_field_labels(doc, name) do
    doc
    |> get_field(name)
    |> case do
      nil ->
        nil

      %Field{} = field ->
        field.labels
    end
  end

  def get_field(%Document{groups: groups} = _doc, name) when is_list(groups) do
    Enum.map(groups, fn %Group{} = group ->
      Enum.find(group.fields, fn %Field{name: current} ->
        current == name
      end)
      |> case do
        nil ->
          nil

        %Field{} = field ->
          field
      end
    end)
    |> Enum.reject(fn val -> val == nil end)
    |> List.first()
  end

  # Better solution if doc is used without groups?
  def get_field(_, _) do
    nil
  end

  def get_relation(%Document{relations: relations} = _doc, name) do
    Enum.find(relations, fn relation ->
      relation.name == name
    end)
  end

  def get_relation(_, _) do
    nil
  end

  def apply_project_configuration(
        %{"resource" => resource} = _document,
        configuration,
        %Publication{} = publication,
        include_relations \\ false
      ) do
    category_configuration = search_category_tree(configuration, resource["category"])

    image_categories = get_all_subcategories(publication, "Image")

    image_uuids =
      if resource["category"] in image_categories do
        # Add own uuid as shorthand list
        [resource["id"]]
      else
        # Otherwise evaluate the isDepictedIn relations
        resource
        |> Map.get("relations", %{})
        |> Map.get("isDepictedIn", [])
      end

    doc =
      %Document{
        id: resource["id"],
        identifier: resource["identifier"],
        project: publication.project_name,
        publication: publication.draft_date,
        category: extend_category(category_configuration["item"], resource),
        groups: extend_field_groups(category_configuration["item"], resource),
        image_uuids: image_uuids
      }

    if include_relations do
      child_task_pid =
        Task.async(fn ->
          create_child_relations(resource["id"], publication)
        end)

      other_relations = extend_relations(category_configuration["item"], resource, publication)

      child_relations = Task.await(child_task_pid)

      all_relations =
        if child_relations.docs != [] do
          other_relations ++ [child_relations]
        else
          other_relations
        end

      %Document{doc | relations: all_relations}
    else
      doc
    end
  end

  defp extend_category(category_configuration, resource) do
    %Category{
      name: resource["category"],
      labels: category_configuration["label"],
      color: category_configuration["color"]
    }
  end

  defp extend_field_groups(category_configuration, resource) do
    resource_keys = Map.keys(resource)

    category_configuration["groups"]
    |> Enum.map(fn group ->
      group["fields"]
      |> Enum.map(&extend_field(&1, resource_keys, resource))
      |> Enum.reject(fn val -> val == nil end)
      |> case do
        [] ->
          # This group was defined in the configuration, but for the current document there are no
          # values present.
          nil

        fields_with_data ->
          %Group{name: group["name"], labels: group["label"], fields: fields_with_data}
      end
    end)
    |> Enum.reject(fn group -> group == nil end)
  end

  defp extend_field(field, resource_keys, resource) do
    if(field["name"] in resource_keys) do
      base_fields = %Field{
        name: field["name"],
        value: resource[field["name"]],
        labels: field["label"],
        input_type: field["inputType"]
      }

      if field["valuelist"] do
        %Field{base_fields | value_labels: field["valuelist"]["values"]}
      else
        base_fields
      end
    else
      nil
    end
  end

  defp extend_relations(category_configuration, resource, %Publication{} = publication) do
    relations = Map.get(resource, "relations", %{})

    # Load all related documents from CouchDB in one go...
    related_documents =
      relations
      |> Map.values()
      |> List.flatten()
      |> get_extended_documents(publication, false)

    # ...then sort them into their respective relation groups, including the translated labels for those groups.
    relation_types = Map.keys(relations)

    category_configuration["groups"]
    |> Enum.map(fn group ->
      group["fields"]
      |> Stream.map(fn group_field ->
        if group_field["name"] in relation_types do
          %RelationGroup{
            name: group_field["name"],
            labels: group_field["label"],
            docs:
              Enum.filter(related_documents, fn %Document{id: uuid} ->
                uuid in relations[group_field["name"]]
              end)
          }
        end
      end)
      |> Enum.reject(fn val -> val == nil end)
    end)
    |> List.flatten()
  end

  defp create_child_relations(uuid, publication) do
    %RelationGroup{
      name: "contains",
      labels:
        Gettext.known_locales(FieldPublicationWeb.Gettext)
        |> Enum.map(fn locale ->
          {
            locale,
            Gettext.with_locale(
              FieldPublicationWeb.Gettext,
              locale,
              fn ->
                FieldPublicationWeb.Gettext.gettext("Contains")
              end
            )
          }
        end)
        |> Enum.into(%{}),
      docs:
        publication
        |> Publications.get_hierarchy()
        |> Map.get(uuid, %{})
        |> Map.get("children", [])
        |> get_extended_documents(publication)
    }
  end

  defp run_query(query, database) do
    CouchService.get_document_stream(query, database)
  end

  defp flatten_category_tree(%{"item" => %{"name" => name}, "trees" => child_categories}) do
    ([name] ++ Enum.map(child_categories, &flatten_category_tree/1))
    |> List.flatten()
  end

  defp flatten_category_tree(nil) do
    []
  end

  defp search_category_tree(configuration, category_name) do
    configuration
    |> Stream.map(&search_category_branch(&1, category_name))
    |> Enum.filter(fn val -> val != :not_found end)
    |> List.first(:not_found)
  end

  defp search_category_branch(
         %{"item" => %{"name" => name}, "trees" => child_categories} = category,
         category_name
       ) do
    if name == category_name do
      category
    else
      child_categories
      |> Stream.map(&search_category_branch(&1, category_name))
      |> Enum.filter(fn val -> val != :not_found end)
      |> List.first(:not_found)
    end
  end
end

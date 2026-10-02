defmodule FieldPublication.Publication.Category do
  @derive Jason.Encoder
  @enforce_keys [:name, :labels, :color]
  defstruct [:name, :labels, :color]
end

defmodule FieldPublication.Publication.FieldGroup do
  @derive Jason.Encoder
  @enforce_keys [:name, :labels]
  defstruct [:name, :labels, fields: []]
end

defmodule FieldPublication.Publication.RelationGroup do
  @derive Jason.Encoder
  @enforce_keys [:name, :labels]
  defstruct [:name, :labels, docs: []]
end

defmodule FieldPublication.Publication.Field do
  @derive Jason.Encoder
  @enforce_keys [:name, :value, :labels, :input_type]
  defstruct [:name, :value, :labels, :value_labels, :input_type]
end

defmodule FieldPublication.Publication.Document do
  @derive Jason.Encoder
  @enforce_keys [:id, :identifier, :category, :project_identifier, :publication_draft_date]
  defstruct [
    :id,
    :identifier,
    :project_identifier,
    :publication_draft_date,
    :category,
    :geometry,
    description: %{},
    groups: [],
    relations: [],
    image_uuids: [],
    default_map_layers: [],
    map_layers: []
  ]

  alias FieldPublication.Publication.{
    Category,
    FieldGroup,
    Field,
    RelationGroup
  }

  def get_field_value(%__MODULE__{} = doc, name) when is_binary(name) do
    doc
    |> get_field(name)
    |> case do
      nil ->
        nil

      %Field{} = field ->
        field.value
    end
  end

  def get_field_labels(%__MODULE__{} = doc, name) when is_binary(name) do
    doc
    |> get_field(name)
    |> case do
      nil ->
        nil

      %Field{} = field ->
        field.labels
    end
  end

  def get_field(%__MODULE__{groups: groups} = _doc, name) when is_binary(name) do
    Enum.map(groups, fn %FieldGroup{} = group ->
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

  def get_relation(%__MODULE__{relations: relations} = _doc, name) when is_binary(name) do
    Enum.find(relations, fn relation ->
      relation.name == name
    end)
  end

  def get_relation(_, _) do
    nil
  end

  def from_map(map) when is_map(map) do
    %__MODULE__{
      id: map["id"],
      identifier: map["identifier"],
      project_identifier: map["project_identifier"],
      publication_draft_date: map["publication_draft_date"],
      description: map["description"],
      category: %Category{
        name: map["category"]["name"],
        labels: map["category"]["labels"],
        color: map["category"]["color"]
      },
      geometry: map["geometry"],
      groups:
        map
        |> Map.get("groups", [])
        |> Enum.map(fn group ->
          %FieldGroup{
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
            docs: Enum.map(relation_group["docs"], &from_map/1)
          }
        end),
      image_uuids: map["image_uuids"]
    }
  end
end

defmodule Api.Core.Filters do

  def get_filters(), do: [
    %{
      field: "project",
      label: %{ de: "Projekt", en: "Project" },
      labeled_value: false,
      size: 1000
    },
    %{
      field: "resource.category",
      label: %{ de: "Kategorie", en: "Category" },
      labeled_value: true,
      size: 1000
    }
  ]

  def get_filter_name(filter) do
    if filter.labeled_value do
      "#{filter.field}.name"
    else
      filter.field
    end
  end


  def get_literature(), do: [
    %{
      field: "resource.literature0.zenonId.keyword",
      label: %{ de: "Literatur", en: "Literature" },
      labeled_value: false,
      size: 100
    }
  ]

  def get_literature_name(literature) do
    if literature.labeled_value do
      "#{literature.field}"
    else
      literature.field
    end
  end
end

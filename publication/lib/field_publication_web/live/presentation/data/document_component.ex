defmodule FieldPublicationWeb.Presentation.DocumentComponent do
  use Phoenix.Component
  alias FieldPublicationWeb.CoreComponents

  alias FieldPublication.Publications.Data

  alias FieldPublicationWeb.Presentation.Data.{
    I18n,
    Image
  }

  def project(assigns) do
    ~H"""
    <div>
      <CoreComponents.header>
        <I18n.text values={Data.get_field_values_by_name(@doc, "shortName")} lang={@lang} />
      </CoreComponents.header>

      <I18n.markdown values={Data.get_field_values_by_name(@doc, "description")} lang={@lang} />

      <%= if @doc["resource"]["relations"]["isDepictedIn"] do %>
        <Image.show
          project={@project_name}
          uuid={List.first(@doc["resource"]["relations"]["isDepictedIn"])}
        />
      <% end %>
    </div>
    """
  end

  def general(assigns) do
    ~H"""
    <div>Hello</div>
    """
  end
end

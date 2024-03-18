defmodule FieldPublicationWeb.Presentation.DocumentComponent do
  use Phoenix.Component
  alias FieldPublicationWeb.Presentation.IIIFComponent
  alias FieldPublicationWeb.CoreComponents

  alias FieldPublication.Publications.Data

  alias FieldPublicationWeb.Presentation.Data.{
    I18n,
    Image
  }

  FieldPublicationWeb.Presentation.IIIFComponent

  def project(assigns) do
    ~H"""
    <div>
      <CoreComponents.header>
        <I18n.text values={Data.get_field_values_by_name(@doc, "shortName")} lang={@lang} />
      </CoreComponents.header>

      <I18n.markdown values={Data.get_field_values_by_name(@doc, "description")} lang={@lang} />

      <%= for uuid <- Map.get(Data.get_relation_by_name(@doc, "hasMapLayer"), "values", []) do %>
        <div class="flex flex-row">
          <.live_component
            module={IIIFComponent}
            id={"#{uuid}_iiif"}
            project={@name}
            uuid={uuid}
            class="h-[32rem] w-1/2"
          />
          <Image.show project={@name} uuid={uuid} quality="gray" rotation={40} class="w-1/2" />
        </div>
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

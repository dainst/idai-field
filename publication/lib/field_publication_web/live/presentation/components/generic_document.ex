defmodule FieldPublicationWeb.Presentation.Components.GenericDocument do
  use Phoenix.Component

  alias FieldPublicationWeb.Presentation.Components.{
    Image,
    IIIFViewer
  }

  alias FieldPublication.Publications.Data

  import FieldPublicationWeb.Presentation.Components.Typography

  def render(assigns) do
    ~H"""
    <div>
      <.document_heading><%= Data.get_field_values(@doc, "identifier") %></.document_heading>
      <div>
        <%= Data.get_field_values(@doc, "shortDescription") %>
      </div>
      <div class="flex flex-row">
        <div class="basis-1/3 m-5">
          <.live_component
            module={IIIFViewer}
            id="b8ba2520-6b06-4532-a2f8-3de7fc79c8cf_iiif"
            project={@project_name}
            uuid="b8ba2520-6b06-4532-a2f8-3de7fc79c8cf"
          />
        </div>

        <div class="basis-1/3 m-5">
          <Image.show project={@project_name} uuid="b8ba2520-6b06-4532-a2f8-3de7fc79c8cf" />
        </div>

        <div class="basis-1/3 m-5">
          <Image.show project={@project_name} uuid="unknown" />
        </div>
      </div>
    </div>
    """
  end
end

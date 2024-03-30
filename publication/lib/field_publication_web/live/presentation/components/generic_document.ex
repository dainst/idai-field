defmodule FieldPublicationWeb.Presentation.Components.GenericDocument do
  use Phoenix.Component

  alias FieldPublicationWeb.Presentation.Components.{
    I18n,
    Image,
    IIIFViewer,
    GenericField
  }

  alias FieldPublication.Publications.Data

  import FieldPublicationWeb.Presentation.Components.Typography

  def render(assigns) do
    ~H"""
    <div>
      <.document_heading>
        <%= Data.get_field_values(@doc, "identifier") %>
      </.document_heading>

      <div class="grid grid-cols-4 gap-4">
        <%= for group <- @doc["groups"] do %>
          <div>
            <.group_heading>
              <I18n.text values={group["labels"]} />
            </.group_heading>
            <dl>
              <%= for field <- group["fields"] |> Enum.reject(fn(%{"key" => key}) -> key == "identifier" end)  do %>
                <GenericField.render
                  values={field["values"]}
                  labels={field["labels"]}
                  lang={@lang}
                  type={field["type"]}
                />
              <% end %>
            </dl>
          </div>
        <% end %>
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

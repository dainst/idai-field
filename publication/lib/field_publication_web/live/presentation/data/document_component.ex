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
      <h1 class="text-5xl">
        <I18n.text values={Data.get_field_values_by_name(@doc, "shortName")} lang={@lang} />
      </h1>
      <div class="flex flex-row">
        <div class="basis-1/2 m-5">
          <CoreComponents.header>
            About this project
          </CoreComponents.header>
          <I18n.markdown values={Data.get_field_values_by_name(@doc, "description")} lang={@lang} />
        </div>

        <div class="basis-1/2 m-5">
          <CoreComponents.header>
            About this publication
          </CoreComponents.header>
          <I18n.markdown values={@publication_comments} lang={@lang} />
        </div>
      </div>

      <div class="flex flex-row">
        <div class="basis-1/3 m-5">
          <.live_component
            module={IIIFComponent}
            id="b12a6d38-1df9-403f-af2b-7a44170a99c7_iiif"
            project={@name}
            uuid="b12a6d38-1df9-403f-af2b-7a44170a99c7"
          />
        </div>

        <div class="basis-1/3 m-5">
          <Image.show project={@name} uuid="b12a6d38-1df9-403f-af2b-7a44170a99c7" />
        </div>

        <div class="basis-1/3 m-5">
          <Image.show project={@name} uuid="unknown" />
        </div>
      </div>
    </div>
    """
  end

  def general(assigns) do
    ~H"""
    <div>Hello</div>
    """
  end
end

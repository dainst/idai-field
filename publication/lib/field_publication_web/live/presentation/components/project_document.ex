defmodule FieldPublicationWeb.Presentation.Components.ProjectDocument do
  use FieldPublicationWeb, :html

  alias FieldPublicationWeb.Presentation.Components.{
    I18n
  }

  alias FieldPublication.Publications.Data

  import FieldPublicationWeb.Presentation.Components.Typography

  def render(assigns) do
    ~H"""
    <div>
      <.document_heading>
        <I18n.text values={Data.get_field_values_by_name(@doc, "shortName")} lang={@lang} />
      </.document_heading>
      <div class="flex flex-row">
        <div class="basis-1/2 m-5">
          <.header>
            About this project
          </.header>
          <I18n.markdown values={Data.get_field_values_by_name(@doc, "description")} lang={@lang} />
        </div>

        <div class="basis-1/2 m-5">
          <.header>
            About this publication
          </.header>
          <I18n.markdown values={@publication_comments} lang={@lang} />
        </div>
      </div>
    </div>
    """
  end
end

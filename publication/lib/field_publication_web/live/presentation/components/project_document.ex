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
        <I18n.text values={Data.get_field_values(@doc, "shortName")} lang={@lang} />
      </.document_heading>
      <div class="flex flex-row">
        <div class="basis-2/3 m-5">
          <.header>
            About this project
          </.header>
          <I18n.markdown values={Data.get_field_values(@doc, "description")} lang={@lang} />

          <.header>
            About this publication
          </.header>
          <I18n.markdown values={@publication_comments} lang={@lang} />
        </div>

        <div class="basis-1/3 m-5">
          <dl>
            <dt class="font-semibold">
              <I18n.text values={Data.get_field_labels(@doc, "institution")} lang="en" />
            </dt>
            <dd class="ml-2">
              <%= Data.get_field_values(@doc, "institution") %>
            </dd>
            <dt class="font-semibold">
              <I18n.text values={Data.get_field_labels(@doc, "projectSupervisor")} lang="en" />
            </dt>
            <dd class="ml-2">
              <%= Data.get_field_values(@doc, "projectSupervisor") %>
            </dd>
            <dt class="font-semibold">
              <I18n.text values={Data.get_field_labels(@doc, "contactPerson")} lang="en" />
            </dt>
            <dd class="ml-2">
              <%= Data.get_field_values(@doc, "contactPerson") %> (<%= Data.get_field_values(
                @doc,
                "contactMail"
              ) %>)
            </dd>
          </dl>
        </div>
      </div>
    </div>
    """
  end
end

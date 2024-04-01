defmodule FieldPublicationWeb.Presentation.Components.GenericDocument do
  use Phoenix.Component

  alias FieldPublicationWeb.Presentation.Components.{
    I18n,
    Image,
    GenericField,
    DocumentLink
  }

  alias FieldPublication.Publications.Data

  import FieldPublicationWeb.Presentation.Components.Typography

  def render(assigns) do
    ~H"""
    <div>
      <.document_heading>
        <%= Data.get_field_values(@doc, "identifier") %>
      </.document_heading>

      <div class="flex flex-row">
        <div class="basis-2/3 m-5">
          <%= for group <- @doc["groups"] do %>
            <section>
              <.group_heading>
                <I18n.text values={group["labels"]} />
              </.group_heading>

              <dl class="grid grid-cols-4 gap-1 mt-2">
                <%= for field <- group["fields"] |> Enum.reject(fn(%{"key" => key}) -> key in ["identifier", "category"] end)  do %>
                  <div class="border-2 p-0.5">
                    <GenericField.render
                      values={field["values"]}
                      labels={field["labels"]}
                      lang={@lang}
                      type={field["type"]}
                    />
                  </div>
                <% end %>
              </dl>
            </section>
          <% end %>
        </div>
        <div class="basis-1/3">
          <% depicted_in = Data.get_relation_by_name(@doc, "isDepictedIn") %>
          <%= if depicted_in do %>
            <.group_heading>
              <I18n.text values={depicted_in["labels"]} />
            </.group_heading>
            <div class="grid grid-cols-3 gap-1 mt-2">
              <%= for uuid <- depicted_in["values"] do %>
                <.link patch={"/#{@project_name}/#{@publication_date}/#{@lang}/#{uuid}"} class="p-1">
                  <Image.show size="300," project={@project_name} uuid={uuid} />
                </.link>
              <% end %>
            </div>
          <% end %>
          <%= for other_relation <- @doc["relations"]
                  |> Enum.reject(fn %{"key" => key} -> key in ["isDepictedIn"] end)  do %>
            <.group_heading>
              <I18n.text values={other_relation["labels"]} />
            </.group_heading>
            <div class="grid grid-cols-3 gap-1 mt-2">
              <%= for uuid <- other_relation["values"] do %>
                <DocumentLink.show
                  project={@project_name}
                  date={@publication_date}
                  lang={@lang}
                  uuid={uuid}
                />
              <% end %>
            </div>
          <% end %>
        </div>
      </div>
    </div>
    """
  end
end

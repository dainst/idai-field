defmodule FieldPublicationWeb.Presentation.Components.DocumentLink do
  use FieldPublicationWeb, :html
  use FieldPublicationWeb, :verified_routes

  alias FieldPublication.Publications.Data
  alias FieldPublication.Publications.Data.Document

  alias FieldPublicationWeb.Presentation.Components.{
    Image,
    I18n
  }

  attr :doc, Document, required: true
  attr :lang, :string, required: true
  attr :image_count, :integer, default: 0
  attr :image_height, :integer, default: 64
  attr :geometry_indicator, :boolean, default: false
  attr :focus, :atom, default: :default

  def show(assigns) do
    ~H"""
    <div class="flex mb-[2px]">
      <.link
        navigate={~p"/search?#{%{filters: %{"category" => @doc.category.name}}}"}
        class="rounded-tl pl-2 rounded-bl"
        style={"background-color: #{desaturate(@doc.category.color)}; border-color: #{desaturate(@doc.category.color)}; border-width: 1px 1px 1px 0px;"}
      >
        <div class="h-full bg-white/70 hover:bg-white/40  pl-2 pr-2 pt-3 pb-3 font-thin hover:text-black text-gray-800">
          <I18n.text values={@doc.category.labels} />
        </div>
      </.link>
      <.link
        class="grow p-3 rounded-tr rounded-br hover:bg-(--primary-color)/10 "
        style={"border-color: #{desaturate(@doc.category.color)}; border-width: 1px 1px 1px 0px;"}
        patch={construct_doc_link(@doc.project, @doc.publication, @lang, @doc.id, @focus)}
      >
        <div>
          <span class="text-slate-600">{@doc.identifier}</span>
          <% shortdescription = Data.get_field(@doc, "shortDescription") %>
          <small class="ml-2 text-slate-600">
            <%= if shortdescription do %>
              <I18n.text values={shortdescription.value} />
            <% end %>
            <.icon
              :if={@geometry_indicator and Data.get_field(@doc, "geometry") != nil}
              name="hero-map"
              class="mb-1"
            />
          </small>
          <% uuids = Enum.take(@doc.image_uuids, @image_count) %>
          <div class="flex items-center overflow-x-auto">
            <%= for uuid <- uuids do %>
              <Image.show
                size={"^,#{@image_height}"}
                class="p-1 inline"
                project={@doc.project}
                uuid={uuid}
                alt_text={"An image depicting '#{@doc.identifier}'"}
              />
            <% end %>
            <%= if uuids== [] and @image_count > 0 do %>
              <small class="text-black">no images</small>
            <% end %>
          </div>
        </div>
      </.link>
    </div>
    """
  end

  defp construct_doc_link(project_name, draft_date, lang, uuid, focus_parameter) do
    uuid = if uuid == "project", do: "", else: uuid

    query =
      case focus_parameter do
        :map ->
          %{focus: "map"}

        _ ->
          %{}
      end

    ~p"/projects/#{project_name}/#{draft_date}/#{lang}/#{uuid}?#{query}"
  end

  defp desaturate(color) do
    "hsl(from  #{color} h calc(s * 0.5) l)"
  end
end

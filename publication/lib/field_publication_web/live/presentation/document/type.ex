defmodule FieldPublicationWeb.Presentation.Document.Type do
  use FieldPublicationWeb, :live_component

  import FieldPublicationWeb.Components.Data.{
    DocumentLink,
    Field,
    Image
  }

  alias FieldPublication.Publications.Data

  alias FieldPublication.Publications.Data.{
    Document,
    RelationGroup
  }

  def render(assigns) do
    # IO.inspect(assigns)
    ~H"""
    <div class="flex flex-row gap-4" >
      <div class="basis-1/3">
        {@todo} #{@doc.id} #{@doc.identifier}
      </div>
      <div class="basis-2/3">
        t9999
      </div>
    </div>
    """
  end

  def update(
        %{doc: %Document{} = doc, publication: publication} = _assigns,
        socket
      ) do
    todo = "todo "
    # url =  {Data.get_field_value(@doc, "projectURI")}
    # IO.inspect(url)
    {
      :ok,
      socket
      |> assign(:doc, doc)
      |> assign(:todo, todo)
      |> assign(:publication, publication)
      #  |> assign(:url, url)
    }
  end
end

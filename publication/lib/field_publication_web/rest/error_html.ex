defmodule FieldPublicationWeb.ErrorHTML do
  use FieldPublicationWeb, :html

  alias FieldPublicationWeb.Presentation.DocumentLive.UnknownPublicationDocumentError

  def render("404.html", %{reason: %UnknownPublicationDocumentError{}} = assigns) do
    ~H"""
    <pre>
      {@reason.message}
    </pre>
    """
  end

  def render(template, _assigns) do
    Phoenix.Controller.status_message_from_template(template)
  end
end

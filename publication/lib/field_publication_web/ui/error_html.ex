defmodule FieldPublicationWeb.UI.ErrorHTML do
  use FieldPublicationWeb, :html

  alias FieldPublicationWeb.UI.DocumentLive.UnknownPublicationDocumentError

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

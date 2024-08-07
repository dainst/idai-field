defmodule FieldPublicationWeb.UnknownUUIDException do
  defexception message: "unknown uuid", plug_status: 404
end

defmodule FieldPublicationWeb.UnknownPublicationLanguageException do
  defexception message: "unknown publication language", plug_status: 404
end

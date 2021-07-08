defmodule Api.IdaiConsoleLogger do
  require Date

  def format(level, message, datetime, metadata) do
    mfa = Keyword.get metadata, :mfa
    if level == :info or level == :warn do
      "#{format_datetime(datetime)} #{format_level(level)} - #{message}\n"
    else
      "#{format_datetime(datetime)} #{format_level(level)} (#{format_mfa(mfa)}) - #{message}\n"
    end
  rescue
    _ -> "could not format #{inspect({level, message, datetime, metadata})}\n"
  end

  defp format_datetime({date, {hh, mm, ss, ms}}) do
    with {:ok, timestamp} <- NaiveDateTime.from_erl({date, {hh, mm, ss}}, {ms * 1000, 3}),
         result <- NaiveDateTime.to_iso8601(timestamp)
      do
      "#{result}Z"
    end
  end

  defp format_level(level) do
    String.pad_leading("[" <> Atom.to_string(level) <> "]", 8)
  end

  defp format_mfa({module, function, arity}) do
    "#{module}.#{function}/#{arity}"
  end
  defp format_mfa(nil), do: "<no metadata>"

 end

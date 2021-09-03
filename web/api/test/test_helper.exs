ExUnit.start()

{:ok, files} = File.ls("./test/app/support")

Enum.each files, fn(file) ->
  Code.require_file "app/support/#{file}", __DIR__
end

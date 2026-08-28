defmodule FieldPublicationWeb.ApiDocControllerHTML do
  use FieldPublicationWeb, :html

  def show(assigns) do
    ~H"""
    <link rel="stylesheet" href="/swagger-ui-5.32.14/swagger-ui.css" />
    <div id="swagger-ui"></div>
    <script src="/swagger-ui-5.32.14/swagger-ui-bundle.js" />
    <script src="/swagger-ui-5.32.14/swagger-ui-standalone-preset.js" />
    <script>
      window.onload = () => {
        window.ui = SwaggerUIBundle({
          url: '/api/spec',
          dom_id: '#swagger-ui',
          presets: [
            SwaggerUIBundle.presets.apis,
            SwaggerUIStandalonePreset
          ],
          layout: "StandaloneLayout",
        });
      };
    </script>
    """
  end
end

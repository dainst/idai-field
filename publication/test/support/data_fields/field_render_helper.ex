defmodule FieldRenderHelper do
  use FieldPublicationWeb, :live_view

  alias FieldPublication.DatabaseSchema.Publication

  import FieldPublicationWeb.Components.Data.Field

  @field_examples [
    {
      %FieldPublication.Publications.Data.Field{
        name: "shortDescription",
        value: %{
          "de" =>
            "Ausdehnung der Grabungen bis 2018 an der Fundstelle Los Castillejos de Alcorrín",
          "es" =>
            "Extensión de las excavaciónes en el yacimiento de Los Castillejos de Alcorrín hasta 2018"
        },
        labels: %{
          "de" => "Kurzbeschreibung",
          "en" => "Short description",
          "es" => "Descripción breve",
          "fr" => "Description sommaire",
          "it" => "Descrizione breve",
          "pt" => "Descrição breve",
          "tr" => "Kısa açıklama",
          "uk" => "Короткий опис"
        },
        value_labels: nil,
        input_type: "input"
      },
      "General `input` input with translated field label and translated values."
    },
    {
      %FieldPublication.Publications.Data.Field{
        name: "gazId",
        value: 2_282_719,
        labels: %{
          "de" => "Gazetteer-ID",
          "en" => "Gazetteer ID",
          "es" => "Gazetteer ID",
          "fr" => "No. d'index géographique",
          "it" => "Gazetteer-ID",
          "pt" => "Gazetteer ID",
          "tr" => "Gazetteer ID",
          "uk" => "Ідентифікатор ID"
        },
        value_labels: nil,
        input_type: "unsignedInt"
      },
      "Input type unsignedInt with translated field label."
    },
    {
      %FieldPublication.Publications.Data.Field{
        name: "excavationHistory",
        value: %{
          "de" =>
            "1987 Prospektionen durch Marco Vásquez Candiles und Fernando Villaseca Díaz, Erstellung einer archäologischen Fundstellenkarte der Gemeinde Manilva\n1989 erste archäologische Untersuchungen in Alcorrín durch Fernando Villaseca Díaz und Antonio Garrido Luque (Schnitt 3x3m)\n2004 Ausgrabungen in Alcorrín unter José Suárez Padilla (zwei Sondagen an der Ostfront der äußeren Befestigungsmauer)\n2008, 2010, 2012, 2014, 2016 und 2018 Ausgrabungen in Alcorrín als Kooperationsprojekt des Deutschen Archäologischen Instituts (Abt. Madrid), des Zentrums für phönizischen und punische Forschungen (Centro de Estudios Fenicios y Púnicos, Madrid) und der Gemeinde Manilva (Ayuntamiento Manilva, Málaga)",
          "es" =>
            "1987 Prospecciones de Marco Vásquez Candiles y Fernando Villaseca Díaz, elaboración de un mapa de yacimientos arqueológicos del municipio de Manilva\n1989 Primeras investigaciones arqueológicas en Alcorrín por Fernando Villaseca Díaz y Antonio Garrido Luque (corte 3x3m)\n2004 Excavaciones en Alcorrín a cargo de José Suárez Padilla (dos sondeos en el frente oriental de la muralla exterior)\n2008, 2010, 2012, 2014, 2016 y 2018 Excavaciones en Alcorrín como proyecto de cooperación del Instituto Arqueológico Alemán (Departamento de Madrid), el Centro de Estudios Fenicios y Púnicos (Madrid) y el Ayuntamiento de Manilva (Málaga)"
        },
        labels: %{
          "de" => "Ausgrabungsgeschichte",
          "en" => "Excavation history",
          "es" => "Historia de las excavaciones",
          "fr" => "Historique de la fouille",
          "it" => "Storia degli scavi",
          "pt" => "História das escavações",
          "tr" => "Kazı tarihçesi",
          "uk" => "Історія розкопкu"
        },
        value_labels: nil,
        input_type: "text"
      },
      "General `text` input with with translated field label and translated values."
    },
    {%FieldPublication.Publications.Data.Field{
       name: "period",
       value: %{"endValue" => "Früheisenzeitlich", "value" => "Spätbronzezeitlich"},
       labels: %{
         "de" => "Grobdatierung",
         "en" => "Period",
         "es" => "Período",
         "fr" => "Période",
         "it" => "Datazione approssimativa",
         "pt" => "Período de datação",
         "tr" => "Dönem",
         "uk" => "Приблизне датування"
       },
       value_labels: %{
         "Spätbronzezeitlich" => %{
           "de" => "spätbronzezeitlich",
           "es" => "Edad del Bronce final"
         }
       },
       input_type: "dropdownRange"
     },
     "General `dropdownRange` input with with translated field label and translated value labels."},
    {
      %FieldPublication.Publications.Data.Field{
        name: "storagePlace",
        value: "Landesamt",
        labels: %{
          "de" => "Aufbewahrungsort",
          "en" => "Storage place",
          "es" => "Lugar de almacenamiento",
          "fr" => "Lieu de conservation",
          "it" => "Luogo di conservazione",
          "pt" => "Depósito",
          "tr" => "Depolandığı yer",
          "uk" => "Місце збереження"
        },
        value_labels: %{
          "Landesamt" => %{
            "de" => "Landesamt",
            "it" => "Ufficio statale",
            "uk" => "Державне Управління"
          }
        },
        input_type: "radio"
      },
      "General `radio` input with with translated field label and translated value labels."
    }
  ]

  @impl true
  def mount(_params, _session, socket) do
    {
      :ok,
      socket
      # set current_user to allow navigation to render
      |> assign(:current_user, nil)
      |> assign(:examples, @field_examples)
      |> assign(:publication, %Publication{
        project_identifier: "test",
        draft_date: Date.from_iso8601!("2026-07-22")
      })
    }
  end
end

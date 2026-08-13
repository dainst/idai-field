defmodule FieldRenderHelper do
  use FieldPublicationWeb, :live_view

  alias FieldPublication.DatabaseSchema.Publication
  alias FieldPublication.Publications.Data.Field, as: FieldData
  import FieldPublicationWeb.Components.Data.Field

  defmodule FieldExample do
    @enforce_keys [:data, :description]
    defstruct [:data, :description]

    def all() do
      [
        boolean(),
        checkboxes(),
        dropdown(),
        dropdown_range(),
        input(),
        radio(),
        simple_input(),
        text(),
        unsigned_int()
      ]
      |> Enum.concat()
    end

    def boolean() do
      [
        %__MODULE__{
          data: %FieldData{
            name: "hasDisturbance",
            value: true,
            labels: %{
              "de" => "Störung",
              "en" => "Disturbance",
              "es" => "Alteraciones",
              "fr" => "Perturbations",
              "it" => "Disturbo",
              "pt" => "Distúrbio",
              "tr" => "Tahribat",
              "uk" => "Пошкодження"
            },
            value_labels: nil,
            input_type: "boolean"
          },
          description: "`boolean` input with translated field label"
        }
      ]
    end

    def checkboxes do
      [
        %__MODULE__{
          data: %FieldData{
            name: "color",
            value: ["braun", "schwarz", "dunkel-"],
            labels: %{
              "de" => "Farbe und Intensität",
              "en" => "Color and intensity",
              "es" => "Color e intensidad",
              "fr" => "Couleur et intensité",
              "it" => "Colore ed intensità",
              "pt" => "Cor e intensidade",
              "tr" => "Rengi ve tonu",
              "uk" => "Колір і інтенсивність"
            },
            value_labels: %{
              "braun" => %{
                "de" => "braun",
                "en" => "brown",
                "es" => "marrón",
                "it" => "marrone",
                "pt" => "castanho",
                "tr" => "kahverengi",
                "uk" => "коричневий"
              },
              "dunkel-" => %{
                "de" => "dunkel-",
                "en" => "dark-",
                "es" => "oscuro-",
                "it" => "scuro",
                "pt" => "escuro",
                "tr" => "koyu",
                "uk" => "темно-"
              },
              "schwarz" => %{
                "de" => "schwarz",
                "en" => "black",
                "es" => "negro",
                "it" => "nero",
                "pt" => "preto",
                "tr" => "siyah",
                "uk" => "чорний"
              }
            },
            input_type: "checkboxes"
          },
          description:
            "`checkboxes` input with translated field label and translated value labels"
        },
        %__MODULE__{
          data: %FieldData{
            name: "processor",
            value: ["Angelika Wunderbar"],
            labels: %{
              "de" => "Bearbeiterin/Bearbeiter",
              "en" => "Processor",
              "es" => "Responsable",
              "fr" => "Auteur",
              "it" => "Responsabile",
              "pt" => "Editor/editora",
              "tr" => "Sorumlu",
              "uk" => "Виконавець"
            },
            value_labels: nil,
            input_type: "checkboxes"
          },
          description:
            "`checkboxes` input with translated field label without translated value labels"
        }
      ]
    end

    def date() do
      [
        %__MODULE__{
          data: %FieldData{
            name: "date",
            value: "26.02.2021",
            labels: %{
              "de" => "Datum",
              "en" => "Date",
              "es" => "Fecha",
              "fr" => "Date",
              "it" => "Data",
              "pt" => "Data",
              "tr" => "Tarih",
              "uk" => "Дата"
            },
            value_labels: nil,
            input_type: "date"
          },
          description: "`date` input"
        }
      ]
    end

    def dropdown() do
      [
        %__MODULE__{
          data: %FieldData{
            name: "siteClassification",
            value: "Siedlung",
            labels: %{
              "de" => "Klassifikation Fundplatz",
              "en" => "Site classification",
              "es" => "Clasificación del sitio",
              "fr" => "Classification du site",
              "it" => "Classificazione sito",
              "pt" => "Classificação do sítio",
              "tr" => "Yerleşim yeri sınıflandırması",
              "uk" => "Класифікація місцевості знахідки"
            },
            value_labels: %{
              "Siedlung" => %{
                "de" => "Siedlung",
                "en" => "settlement",
                "it" => "Insediamento",
                "tr" => "Yerleşme",
                "uk" => "Поселення"
              }
            },
            input_type: "dropdown"
          },
          description: "`dropdown` with translated field label and translated value labels."
        }
      ]
    end

    def dropdown_range() do
      [
        %__MODULE__{
          data: %FieldData{
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
          description:
            "`dropdownRange` input with with translated field label and translated value labels"
        }
      ]
    end

    def input() do
      [
        %__MODULE__{
          data: %FieldData{
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
          description: "`input` input with translated field label and translated values"
        },
        %__MODULE__{
          data: %FieldData{
            name: "shortDescription",
            value: %{"de" => "Das Siedlungsgebiet von Testopolis"},
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
          description:
            "`input` input with translated field label and only a single translated value"
        },
        %__MODULE__{
          data: %FieldData{
            name: "shortDescription",
            value: "Zerstörungshorizont Mauer 4044",
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
          description:
            "`input` input with translated field label and only a single non-translated value"
        }
      ]
    end

    def radio() do
      [
        %__MODULE__{
          data: %FieldData{
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
          description:
            "`radio` input with with translated field label and translated value labels"
        },
        %__MODULE__{
          data: %FieldData{
            name: "storagePlace",
            value: "Scherbenhalle TAX Kiste HBW",
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
            value_labels: %{},
            input_type: "radio"
          },
          description:
            "`radio` input with with translated field label and without translated value labels"
        }
      ]
    end

    def simple_input() do
      [
        %__MODULE__{
          data: %FieldData{
            name: "originalFilename",
            value: "D_DAI_HB_2018_4063_704_5.JPG",
            labels: %{
              "de" => "Ursprünglicher Dateiname",
              "en" => "Original filename",
              "es" => "Nombre original del archivo",
              "pt" => "Nome de ficheiro original",
              "tr" => "Orijinal dosya adı"
            },
            value_labels: nil,
            input_type: "simpleInput"
          },
          description: "`simpleInput` input with translated field label"
        }
      ]
    end

    def text() do
      [
        %__MODULE__{
          data: %FieldData{
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
          description: "`text` input with with translated field label and translated values."
        },
        %__MODULE__{
          data: %FieldData{
            name: "description",
            value:
              "Bodenplatte von 1,8 cm Stärke. Auf der einen Seite geweißelt, auf der anderen Seite geglättet. Der Ton ist rotbraun und grob gemagert. Originalkanten sind nicht erhalten.",
            labels: %{
              "de" => "Beschreibung",
              "en" => "Description",
              "es" => "Descripción",
              "fr" => "Description",
              "it" => "Descrizione",
              "pt" => "Descrição",
              "tr" => "Açıklama",
              "uk" => "Опис"
            },
            value_labels: nil,
            input_type: "text"
          },
          description:
            "`text` input with with translated field label and without translated values."
        }
      ]
    end

    def unsigned_int() do
      [
        %__MODULE__{
          data: %FieldData{
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
          description: "`unsignedInt` input with translated field label."
        }
      ]
    end
  end

  @impl true
  def mount(_params, _session, socket) do
    {
      :ok,
      socket
      # set current_user to allow navigation to render
      |> assign(:current_user, nil)
      |> assign(:page_title, "Field Render Helper")
      |> assign(:examples, FieldExample.all())
      |> assign(:publication, %Publication{
        project_identifier: "test",
        draft_date: Date.from_iso8601!("2026-07-22")
      })
    }
  end
end

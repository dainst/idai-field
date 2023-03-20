defmodule Api.Worker.Enricher.I18NFieldConverterTest do

  use ExUnit.Case, async: true
  use Plug.Test
  alias Api.Worker.Enricher.I18NFieldConverter

  test "convert" do
    change = %{
        doc: %{
          created: %{date: "2023-03-20T14:05:41.836Z", user: "anonymous"},
          modified: [%{date: "2023-03-20T14:06:33.138Z", user: "anonymous"}],
          project: "devtest-daniel-de-en",
          resource: %{
            category: %{
              label: %{
                de: "Schnitt",
                en: "Trench",
                es: "Corte",
                fr: "Tranchée/zone de fouille ?",
                it: "Saggio",
                uk: "Розріз"
              },
              name: "Trench"
            },
            id: "511b8275-01db-4668-bb96-3217a80c6143",
            identifier: "one-trench",
            relations: %{},
            # shortDescription: %{de: "Ein Schnitt", en: "A Trench"},
            shortDescription: "hallo",
            spatialLocation: %{de: "Irgendwo", en: "Somewhere"}
          },
          sort: "one-trench"
        },
        id: "511b8275-01db-4668-bb96-3217a80c6143",
        key: "511b8275-01db-4668-bb96-3217a80c6143",
        value: %{rev: "2-4fe825a312474b9c93778af5afbe6bdd"}
      }
  category_definition =
    %{
        categoryLabel: %{
          de: "Schnitt",
          en: "Trench",
          es: "Corte",
          fr: "Tranchée/zone de fouille ?",
          it: "Saggio",
          uk: "Розріз"
        },
        color: "blue",
        customFields: ["spatialLocation"],
        defaultColor: "blue",
        defaultLabel: %{
          de: "Schnitt",
          en: "Trench",
          es: "Corte",
          fr: "Tranchée/zone de fouille ?",
          it: "Saggio",
          uk: "Розріз"
        },
        description: %{},
        groups: [
          %{
            defaultLabel: %{
              de: "Stammdaten",
              en: "Core",
              es: "Datos maestros",
              fr: "Noyau",
              it: "Dati base",
              uk: "Базові дані"
            },
            fields: [
              %{
                defaultConstraintIndexed: false,
                defaultDescription: %{
                  de: "Eindeutiger Bezeichner dieser Ressource",
                  en: "Unique identifier of this resource",
                  es: "Identificador único de este recurso",
                  fr: "Identifiant unique pour cette ressource",
                  it: "Identificatore unico di questa risorsa",
                  uk: "Однозначний ідентифікатор цього ресурсу"
                },
                defaultLabel: %{
                  de: "Bezeichner",
                  en: "Identifier",
                  es: "Identificador",
                  fr: "Identifiant",
                  it: "Identificatore",
                  uk: "Індентифікатор"
                },
                description: %{
                  de: "Eindeutiger Bezeichner dieser Ressource",
                  en: "Unique identifier of this resource",
                  es: "Identificador único de este recurso",
                  fr: "Identifiant unique pour cette ressource",
                  it: "Identificatore unico di questa risorsa",
                  uk: "Однозначний ідентифікатор цього ресурсу"
                },
                editable: true,
                fixedInputType: true,
                fulltextIndexed: true,
                inputType: "identifier",
                label: %{
                  de: "Bezeichner",
                  en: "Identifier",
                  es: "Identificador",
                  fr: "Identifiant",
                  it: "Identificatore",
                  uk: "Індентифікатор"
                },
                mandatory: true,
                name: "identifier",
                selectable: true,
                visible: false
              },
              %{
                defaultConstraintIndexed: false,
                defaultDescription: %{},
                defaultLabel: %{
                  de: "Kategorie",
                  en: "Category",
                  es: "Categoría",
                  fr: "Catégorie",
                  it: "Categoria",
                  uk: "Категорія"
                },
                description: %{},
                editable: false,
                fixedInputType: true,
                inputType: "category",
                label: %{
                  de: "Kategorie",
                  en: "Category",
                  es: "Categoría",
                  fr: "Catégorie",
                  it: "Categoria",
                  uk: "Категорія"
                },
                name: "category",
                selectable: true,
                visible: true
              },
              %{
                defaultConstraintIndexed: false,
                defaultDescription: %{},
                defaultLabel: %{
                  de: "Kurzbeschreibung",
                  en: "Short description",
                  es: "Breve descripción",
                  fr: "Description sommaire",
                  it: "Descrizione breve",
                  uk: "Короткий опис"
                },
                description: %{},
                editable: true,
                fulltextIndexed: true,
                inputType: "input",
                label: %{
                  de: "Kurzbeschreibung",
                  en: "Short description",
                  es: "Breve descripción",
                  fr: "Description sommaire",
                  it: "Descrizione breve",
                  uk: "Короткий опис"
                },
                name: "shortDescription",
                selectable: true,
                visible: true
              },
              %{
                defaultConstraintIndexed: false,
                defaultDescription: %{
                  de: "Beschreibung der Position innerhalb der Fundstelle, des Schnittes oder des Befundes",
                  it: "Descrizione della posizione all'interno del sito, del saggio o del ritrovamento",
                  uk: "Опис позиції в межах розрізу знахідки, чи знахідки"
                },
                defaultLabel: %{
                  de: "Beschreibung der räumlichen Lage",
                  en: "Spatial location",
                  es: "Descripción de la ubicación",
                  fr: "Localisation spatiale",
                  it: "Descrizione della posizione spaziale",
                  uk: "Опис просторового розташування"
                },
                description: %{
                  de: "Beschreibung der Position innerhalb der Fundstelle, des Schnittes oder des Befundes",
                  it: "Descrizione della posizione all'interno del sito, del saggio o del ritrovamento",
                  uk: "Опис позиції в межах розрізу знахідки, чи знахідки"
                },
                editable: true,
                inputType: "input",
                label: %{
                  de: "Beschreibung der räumlichen Lage",
                  en: "Spatial location",
                  es: "Descripción de la ubicación",
                  fr: "Localisation spatiale",
                  it: "Descrizione della posizione spaziale",
                  uk: "Опис просторового розташування"
                },
                name: "spatialLocation",
                selectable: true,
                source: "common",
                visible: true
              }
            ],
            label: %{
              de: "Stammdaten",
              en: "Core",
              es: "Datos maestros",
              fr: "Noyau",
              it: "Dati base",
              uk: "Базові дані"
            },
            name: "stem"
          },
          %{
            defaultLabel: %{
              de: "Lage / Kontext",
              en: "Position / Context",
              es: "Ubicación / contexto",
              fr: "Position / Contexte",
              it: "Posizione",
              uk: "Розташування / Контекст"
            },
            fields: [
              %{
                defaultConstraintIndexed: false,
                defaultDescription: %{},
                defaultLabel: %{
                  de: "Geometrie",
                  en: "Geometry",
                  fr: "Géométrie",
                  it: "Geometria",
                  uk: "Геометрія"
                },
                description: %{},
                editable: true,
                inputType: "geometry",
                label: %{
                  de: "Geometrie",
                  en: "Geometry",
                  fr: "Géométrie",
                  it: "Geometria",
                  uk: "Геометрія"
                },
                name: "geometry",
                selectable: true,
                source: "common",
                visible: false
              }
            ],
            label: %{
              de: "Lage / Kontext",
              en: "Position / Context",
              es: "Ubicación / contexto",
              fr: "Position / Contexte",
              it: "Posizione",
              uk: "Розташування / Контекст"
            },
            name: "position"
          }
        ],
        isAbstract: false,
        label: %{
          de: "Schnitt",
          en: "Trench",
          es: "Corte",
          fr: "Tranchée/zone de fouille ?",
          it: "Saggio",
          uk: "Розріз"
        },
        libraryId: "Trench",
        name: "Trench",
        required: false,
        source: "builtIn",
        userDefinedSubcategoriesAllowed: false
    }
    result = (I18NFieldConverter.convert_category change, category_definition).doc.resource.shortDescription
    assert %{ unspecifiedLanguage: "hallo" } == result
  end
end

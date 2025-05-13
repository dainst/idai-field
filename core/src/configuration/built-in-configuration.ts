import { Map } from 'tsfun';
import { Field } from '../model/configuration/field';
import { Groups } from '../model/configuration/group';
import { Relation } from '../model/configuration/relation';
import { BuiltInCategoryDefinition } from './model/category/built-in-category-definition';
import { BuiltInFieldDefinition } from './model/field/built-in-field-definition';
import { DateConfiguration } from '../model/configuration/date-configuration';


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class BuiltInConfiguration {

    public commonFields: Map<BuiltInFieldDefinition> = {
        period: {
            inputType: Field.InputType.DROPDOWNRANGE,
            constraintIndexed: true,
            valuelistId: 'periods-default-1'
        },
        dating: {
            inputType: Field.InputType.DATING
        },
        diary: {
            inputType: Field.InputType.INPUT,
            constraintIndexed: true
        },
        area: {
            inputType: Field.InputType.UNSIGNEDFLOAT,
            constraintIndexed: true
        },
        dimensionLength: {
            inputType: Field.InputType.DIMENSION,
            valuelistId: 'position-values-expansion-default'
        },
        dimensionWidth: {
            inputType: Field.InputType.DIMENSION,
            valuelistId: 'position-values-expansion-default'
        },
        dimensionHeight: {
            inputType: Field.InputType.DIMENSION,
            valuelistId: 'position-values-expansion-default'
        },
        dimensionDepth: {
            inputType: Field.InputType.DIMENSION,
            valuelistId: 'position-values-expansion-default'
        },
        dimensionDiameter: {
            inputType: Field.InputType.DIMENSION,
            valuelistId: 'position-values-expansion-default'
        },
        dimensionPerimeter: {
            inputType: Field.InputType.DIMENSION,
            valuelistId: 'position-values-expansion-default'
        },
        dimensionThickness: {
            inputType: Field.InputType.DIMENSION,
            valuelistId: 'position-values-expansion-default'
        },
        dimensionVerticalExtent: {
            inputType: Field.InputType.DIMENSION,
            inputTypeOptions: { validation: { permissive: true } },
            valuelistId: 'position-values-edge-default'
        },
        dimensionOther: {
            inputType: Field.InputType.DIMENSION,
            valuelistId: 'position-values-expansion-default'
        },
        processor: {
            inputType: Field.InputType.CHECKBOXES,
            valuelistFromProjectField: 'staff',
            constraintIndexed: true,
            fixedInputType: true
        },
        campaign: {
            inputType: Field.InputType.CHECKBOXES,
            valuelistFromProjectField: 'campaigns',
            allowOnlyValuesOfParent: true,
            constraintIndexed: true,
            fixedInputType: true
        },
        description: {
            inputType: Field.InputType.TEXT
        },
        date: {
            inputType: Field.InputType.DATE,
            dateConfiguration: {
                dataType: DateConfiguration.DataType.OPTIONAL,
                inputMode: DateConfiguration.InputMode.OPTIONAL
            }
        },
        spatialLocation: {
            inputType: Field.InputType.INPUT
        },
        provenance: {
            inputType: Field.InputType.DROPDOWN,
            constraintIndexed: true,
            valuelistId: 'provenance-default-1'
        },
        orientation: {
            inputType: Field.InputType.DROPDOWN,
            constraintIndexed: true,
            valuelistId: 'orientation-default-1'
        },
        literature: {
            inputType: Field.InputType.LITERATURE
        },
        geometry: {
            inputType: Field.InputType.GEOMETRY,
            visible: false
        },
        notes: {
            inputType: Field.InputType.TEXT
        },
        damage: {
            inputType: Field.InputType.FLOAT
        },
        webGisId: {
            inputType: Field.InputType.UNSIGNEDINT
        },
        shortDescriptionAddendum: {
            inputType: Field.InputType.INPUT
        },
        phase: {
            inputType: Field.InputType.INPUT
        },
        'archaeoDox:documentationUnit': {
            inputType: Field.InputType.SIMPLE_MULTIINPUT,
            selectable: false
        },
    };
    

    public builtInCategories: Map<BuiltInCategoryDefinition> = {
        Project: {
            required: true,
            fields: {
                identifier: {
                    inputType: Field.InputType.IDENTIFIER,
                    editable: false,
                    visible: false
                },
                shortName: {
                    inputType: Field.InputType.INPUT,
                    fixedInputType: true,
                    maxCharacters: 50
                },
                coordinateReferenceSystem: {
                    inputType: Field.InputType.DROPDOWN,
                    valuelistId: 'coordinate-reference-system-default-1',
                    fixedInputType: true
                },
                staff: {
                    inputType: Field.InputType.VALUELIST_MULTIINPUT,
                    fixedInputType: true
                },
                campaigns: {
                    inputType: Field.InputType.VALUELIST_MULTIINPUT,
                    fixedInputType: true
                }
            },
            minimalForm: {
                valuelists: {
                    coordinateReferenceSystem: 'coordinate-reference-system-default-1'
                },
                groups: [
                    {
                        name: Groups.STEM,
                        fields: ['shortName', 'category', 'shortDescription']
                    },
                    {
                        name: Groups.PROPERTIES,
                        fields: ['staff', 'campaigns', 'coordinateReferenceSystem']
                    }
                ]
            }
        },
        Operation: {
            supercategory: true,
            abstract: true,
            fields: {
                supervisor: {
                    inputType: Field.InputType.CHECKBOXES,
                    valuelistFromProjectField: 'staff',
                    constraintIndexed: true,
                    fixedInputType: true
                }
            },
            minimalForm: {
                groups: [
                    {
                        name: Groups.STEM,
                        fields: ['identifier', 'category', 'shortDescription']
                    },
                    {
                        name: Groups.HIERARCHY,
                        fields: ['hasChildren']
                    },
                    {
                        name: Groups.POSITION,
                        fields: ['geometry']
                    }
                ]
            }
        },
        Building: {
            parent: 'Operation',
            fields: {},
            minimalForm: {
                groups: [
                    {
                        name: Groups.STEM,
                        fields: ['identifier', 'category', 'shortDescription']
                    },
                    {
                        name: Groups.HIERARCHY,
                        fields: ['hasChildren']
                    },
                    {
                        name: Groups.POSITION,
                        fields: ['geometry']
                    }
                ]
            }
        },
        Survey: {
            parent: 'Operation',
            fields: {},
            minimalForm: {
                groups: [
                    {
                        name: Groups.STEM,
                        fields: ['identifier', 'category', 'shortDescription']
                    },
                    {
                        name: Groups.HIERARCHY,
                        fields: ['hasChildren']
                    },
                    {
                        name: Groups.POSITION,
                        fields: ['geometry']
                    }
                ]
            }
        },
        Trench: {
            parent: 'Operation',
            fields: {},
            minimalForm: {
                groups: [
                    {
                        name: Groups.STEM,
                        fields: ['identifier', 'category', 'shortDescription']
                    },
                    {
                        name: Groups.HIERARCHY,
                        fields: ['hasChildren']
                    },
                    {
                        name: Groups.POSITION,
                        fields: ['geometry']
                    }
                ]
            }
        },
        ExcavationArea: {
            parent: 'Operation',
            fields: {},
            minimalForm: {
                groups: [
                    {
                        name: Groups.STEM,
                        fields: ['identifier', 'category', 'shortDescription']
                    },
                    {
                        name: Groups.HIERARCHY,
                        fields: ['hasChildren']
                    },
                    {
                        name: Groups.POSITION,
                        fields: ['geometry']
                    }
                ]
            }
        },
        Profile: {
            fields: {},
            minimalForm: {
                groups: [
                    {
                        name: Groups.STEM,
                        fields: ['identifier', 'category', 'shortDescription']
                    },
                    {
                        name: Groups.POSITION,
                        fields: ['geometry', 'includesStratigraphicalUnits']
                    }
                ]
            }
        },
        Planum: {
            fields: {},
            minimalForm: {
                groups: [
                    {
                        name: Groups.STEM,
                        fields: ['identifier', 'category', 'shortDescription']
                    },
                    {
                        name: Groups.POSITION,
                        fields: ['geometry', 'includesStratigraphicalUnits']
                    }
                ]
            }
        },
        Place: {
            supercategory: true,
            userDefinedSubcategoriesAllowed: true,
            fields: {
                gazId: {
                    inputType: Field.InputType.UNSIGNEDINT,
                    constraintIndexed: true
                }
            },
            minimalForm: {
                groups: [
                    {
                        name: Groups.STEM,
                        fields: ['identifier', 'category', 'shortDescription']
                    },
                    {
                        name: Groups.HIERARCHY,
                        fields: ['hasChildren']
                    },
                    {
                        name: Groups.PROPERTIES,
                        fields: ['gazId']
                    },
                    {
                        name: Groups.POSITION,
                        fields: ['geometry']
                    }
                ]
            }
        },
        Inscription: {
            mustLieWithin: true,
            fields: {},
            minimalForm: {
                groups: [
                    {
                        name: Groups.STEM,
                        fields: ['identifier', 'category', 'shortDescription']
                    }
                ]
            }
        },
        Level: {
            supercategory: true,
            userDefinedSubcategoriesAllowed: true,
            fields: {},
            minimalForm: {
                groups: [
                    {
                        name: Groups.STEM,
                        fields: ['identifier', 'category', 'shortDescription']
                    },
                    {
                        name: Groups.HIERARCHY,
                        fields: ['hasChildren']
                    },
                    {
                        name: Groups.POSITION,
                        fields: ['geometry']
                    }
                ]
            }
        },
        // Room is an idealized (non material) entity
        Room: {
            supercategory: true,
            userDefinedSubcategoriesAllowed: true,
            fields: {},
            minimalForm: {
                groups: [
                    {
                        name: Groups.STEM,
                        fields: ['identifier', 'category', 'shortDescription']
                    },
                    {
                        name: Groups.HIERARCHY,
                        fields: ['hasChildren']
                    },
                    {
                        name: Groups.POSITION,
                        fields: ['geometry']
                    }
                ]
            }
        },
        RoomWall: {
            supercategory: true,
            userDefinedSubcategoriesAllowed: true,
            fields: {},
            minimalForm: {
                groups: [
                    {
                        name: Groups.STEM,
                        fields: ['identifier', 'category', 'shortDescription']
                    },
                    {
                        name: Groups.HIERARCHY,
                        fields: ['hasChildren']
                    },
                    {
                        name: Groups.POSITION,
                        fields: ['geometry']
                    }
                ]
            }
        },
        RoomFloor: {
            fields: {
            },
            minimalForm: {
                groups: [
                    {
                        name: Groups.STEM,
                        fields: ['identifier', 'category', 'shortDescription']
                    },
                    {
                        name: Groups.HIERARCHY,
                        fields: ['hasChildren']
                    },
                    {
                        name: Groups.POSITION,
                        fields: ['geometry']
                    }
                ]
            }
        },
        RoomCeiling: {
            fields: {},
            minimalForm: {
                groups: [
                    {
                        name: Groups.STEM,
                        fields: ['identifier', 'category', 'shortDescription']
                    },
                    {
                        name: Groups.HIERARCHY,
                        fields: ['hasChildren']
                    },
                    {
                        name: Groups.POSITION,
                        fields: ['geometry']
                    }
                ]
            }
        },
        BuildingPart: {
            supercategory: true,
            userDefinedSubcategoriesAllowed: true,
            fields: {},
            minimalForm: {
                groups: [
                    {
                        name: Groups.STEM,
                        fields: ['identifier', 'category', 'shortDescription']
                    },
                    {
                        name: Groups.HIERARCHY,
                        fields: ['hasChildren']
                    },
                    {
                        name: Groups.POSITION,
                        fields: ['geometry']
                    }
                ]
            }
        },
        Opening: {
            supercategory: true,
            userDefinedSubcategoriesAllowed: true,
            fields: {},
            minimalForm: {
                groups: [
                    {
                        name: Groups.STEM,
                        fields: ['identifier', 'category', 'shortDescription']
                    },
                    {
                        name: Groups.HIERARCHY,
                        fields: ['hasChildren']
                    },
                    {
                        name: Groups.POSITION,
                        fields: ['geometry']
                    }
                ]
            }
        },
        Roof: {
            fields: {},
            minimalForm: {
                groups: [
                    {
                        name: Groups.STEM,
                        fields: ['identifier', 'category', 'shortDescription']
                    },
                    {
                        name: Groups.HIERARCHY,
                        fields: ['hasChildren']
                    },
                    {
                        name: Groups.POSITION,
                        fields: ['geometry']
                    }
                ]
            }
        },
        Stairs: {
            fields: {},
            minimalForm: {
                groups: [
                    {
                        name: Groups.STEM,
                        fields: ['identifier', 'category', 'shortDescription']
                    },
                    {
                        name: Groups.HIERARCHY,
                        fields: ['hasChildren']
                    },
                    {
                        name: Groups.POSITION,
                        fields: ['geometry']
                    }
                ]
            }
        },
        Area: {
            supercategory: true,
            userDefinedSubcategoriesAllowed: true,
            fields: {},
            minimalForm: {
                groups: [
                    {
                        name: Groups.STEM,
                        fields: ['identifier', 'category', 'shortDescription']
                    },
                    {
                        name: Groups.HIERARCHY,
                        fields: ['hasChildren']
                    },
                    {
                        name: Groups.POSITION,
                        fields: ['geometry']
                    }
                ]
            }
        },
        Damage: {
            supercategory: true,
            userDefinedSubcategoriesAllowed: true,
            fields: {},
            minimalForm: {
                groups: [
                    {
                        name: Groups.STEM,
                        fields: ['identifier', 'category', 'shortDescription']
                    },
                    {
                        name: Groups.POSITION,
                        fields: ['geometry']
                    }
                ]
            }
        },
        DesignElement: {
            supercategory: true,
            userDefinedSubcategoriesAllowed: true,
            fields: {},
            minimalForm: {
                groups: [
                    {
                        name: Groups.STEM,
                        fields: ['identifier', 'category', 'shortDescription']
                    },
                    {
                        name: Groups.HIERARCHY,
                        fields: ['hasChildren']
                    },
                    {
                        name: Groups.POSITION,
                        fields: ['geometry']
                    }
                ]
            }
        },
        Feature: {
            supercategory: true,
            userDefinedSubcategoriesAllowed: true,
            fields: {},
            minimalForm: {
                groups: [
                    {
                        name: Groups.STEM,
                        fields: ['identifier', 'category', 'shortDescription', Relation.SAME_AS]
                    },
                    {
                        name: Groups.HIERARCHY,
                        fields: ['hasChildren']
                    },
                    {
                        name: Groups.STRATIGRAPHY,
                        fields: ['isAbove', 'isBelow', 'cuts', 'isCutBy', 'fills', 'isFilledBy', 'abuts',
                        'isAbuttedBy', 'bondsWith', 'borders']
                    },
                    {
                        name: Groups.POSITION,
                        fields: ['geometry', 'isPresentIn']
                    },
                    {
                        name: Groups.TIME,
                        fields: ['period', 'dating'].concat(Relation.Time.ALL)
                    }
                ]
            }
        },
        FeatureGroup: {
            supercategory: true,
            userDefinedSubcategoriesAllowed: true,
            fields: {},
            minimalForm: {
                groups: [
                    {
                        name: Groups.STEM,
                        fields: ['identifier', 'category', 'shortDescription', Relation.SAME_AS]
                    },
                    {
                        name: Groups.HIERARCHY,
                        fields: ['hasChildren']
                    },
                    {
                        name: Groups.POSITION,
                        fields: ['geometry', 'isPresentIn']
                    }
                ]
            }
        },
        FeatureSegment: {
            supercategory: true,
            userDefinedSubcategoriesAllowed: true,
            mustLieWithin: true,
            fields: {},
            minimalForm: {
                groups: [
                    {
                        name: Groups.STEM,
                        fields: ['identifier', 'category', 'shortDescription', Relation.SAME_AS]
                    },
                    {
                        name: Groups.HIERARCHY,
                        fields: ['hasChildren']
                    },
                    {
                        name: Groups.POSITION,
                        fields: ['geometry', 'isPresentIn']
                    }
                ]
            }
        },
        Find: {
            supercategory: true,
            userDefinedSubcategoriesAllowed: true,
            scanCodesAllowed: true,
            fields: {},
            minimalForm: {
                groups: [
                    {
                        name: Groups.STEM,
                        fields: ['identifier', 'category', 'shortDescription', Relation.SAME_AS, 'isStoredIn']
                    },
                    {
                        name: Groups.HIERARCHY,
                        fields: ['hasChildren']
                    },
                    {
                        name: Groups.IDENTIFICATION,
                        fields: ['isInstanceOf']
                    },
                    {
                        name: Groups.INVENTORY,
                        fields: ['isStoredIn']
                    },
                    {
                        name: Groups.POSITION,
                        fields: ['geometry']
                    }
                ]
            }
        },
        FindCollection: {
            supercategory: true,
            userDefinedSubcategoriesAllowed: true,
            scanCodesAllowed: true,
            fields: {},
            minimalForm: {
                groups: [
                    {
                        name: Groups.STEM,
                        fields: ['identifier', 'category', 'shortDescription', 'isStoredIn']
                    },
                    {
                        name: Groups.HIERARCHY,
                        fields: ['hasChildren']
                    },
                    {
                        name: Groups.IDENTIFICATION,
                        fields: ['isInstanceOf']
                    },
                    {
                        name: Groups.INVENTORY,
                        fields: ['isStoredIn']
                    },
                    {
                        name: Groups.POSITION,
                        fields: ['geometry']
                    }
                ]
            }
        },
        Sample: {
            mustLieWithin: true,
            scanCodesAllowed: true,
            fields: {},
            minimalForm: {
                groups: [
                    {
                        name: Groups.STEM,
                        fields: ['identifier', 'category', 'shortDescription', 'isStoredIn']
                    },
                    {
                        name: Groups.HIERARCHY,
                        fields: ['hasChildren']
                    },
                    {
                        name: Groups.INVENTORY,
                        fields: ['isStoredIn']
                    },
                    {
                        name: Groups.POSITION,
                        fields: ['geometry']
                    }
                ]
            }
        },
        TypeCatalog: {
            supercategory: true,
            fields: {
                criterion: {
                    inputType: Field.InputType.DROPDOWN,
                    constraintIndexed: true,
                    valuelistId: 'TypeCatalog-criterion-default'
                }
            },
            minimalForm: {
                valuelists: {
                    criterion: 'TypeCatalog-criterion-default'
                },
                groups: [
                    {
                        name: Groups.STEM,
                        fields: ['identifier', 'category', 'shortDescription']
                    },
                    {
                        name: Groups.IDENTIFICATION,
                        fields: ['criterion']
                    }
                ]
            }
        },
        Type: {
            supercategory: true,
            userDefinedSubcategoriesAllowed: true,
            mustLieWithin: true,
            fields: {},
            minimalForm: {
                groups: [
                    {
                        name: Groups.STEM,
                        fields: ['identifier', 'category', 'shortDescription']
                    },
                    {
                        name: Groups.IDENTIFICATION,
                        fields: ['hasInstance']
                    }
                ]
            }
        },
        StoragePlace: {
            supercategory: true,
            userDefinedSubcategoriesAllowed: true,
            scanCodesAllowed: true,
            fields: {},
            minimalForm: {
                groups: [
                    {
                        name: Groups.STEM,
                        fields: ['identifier', 'category', 'shortDescription']
                    },
                    {
                        name: Groups.INVENTORY,
                        fields: ['isStoragePlaceOf']
                    }
                ]
            }
        },
        WorkflowStep: {
            supercategory: true,
            userDefinedSubcategoriesAllowed: true,
            abstract: true,
            fields: {
                state: {
                    inputType: 'dropdown',
                    required: true,
                    valuelistId: 'workflow-step-state-default',
                },
                date: {
                    required: true
                }
            },
            minimalForm: {
                groups: [
                    {
                        name: Groups.STEM,
                        fields: ['identifier', 'category', 'shortDescription', 'state', 'date']
                    }
                ]
            }
        },
        Image: {
            supercategory: true,
            userDefinedSubcategoriesAllowed: true,
            required: true,
            fields: {
                height: {
                    inputType: Field.InputType.UNSIGNEDINT,
                    editable: false
                },
                width: {
                    inputType: Field.InputType.UNSIGNEDINT,
                    editable: false
                },
                draughtsmen: {
                    inputType: Field.InputType.CHECKBOXES,
                    valuelistFromProjectField: 'staff',
                    constraintIndexed: true
                },
                imageRights: {
                    inputType: Field.InputType.INPUT
                }
            },
            minimalForm: {
                groups: [
                    {
                        name: Groups.STEM,
                        fields: ['identifier', 'category', 'shortDescription']
                    },
                    {
                        name: Groups.PROPERTIES,
                        fields: ['height', 'width']
                    }
                ]
            }
        }
    };


    public builtInFields: Map<BuiltInFieldDefinition> = {
        category: {
            inputType: Field.InputType.CATEGORY,
            visible: true,
            editable: false,
            fixedInputType: true
        },
        shortDescription: {
            inputType: Field.InputType.INPUT,
            visible: true,
            editable: true,
            fulltextIndexed: true
        },
        identifier: {
            inputType: Field.InputType.IDENTIFIER,
            visible: false,
            editable: true,
            required: true,
            fulltextIndexed: true,
            fixedInputType: true
        },
        hasChildren: {
            inputType: Field.InputType.DERIVED_RELATION,
            visible: true,
            editable: false,
            constraintName: 'isChildOf:contain'
        },
        includesStratigraphicalUnits: {
            inputType: Field.InputType.DERIVED_RELATION,
            visible: true,
            editable: false,
            constraintName: 'isPresentIn:contain'
        }
    };


    public builtInRelations: Array<Relation> = [
        {
            name: 'depicts',
            domain: ['Image'],
            range: [],
            inverse: 'isDepictedIn',
            editable: false,
            visible: false,
            inputType: 'relation'
        },
        {
            name: 'isDepictedIn',
            domain: [],
            range: ['Image'],
            inverse: 'depicts',
            editable: false,
            visible: false,
            inputType: 'relation'
        },
        {
            name: 'hasMapLayer',
            inverse: 'isMapLayerOf',
            domain: ['Operation', 'Project'],
            range: ['Image'],
            editable: false,
            visible: false,
            inputType: 'relation'
        },
        {
            name: 'isMapLayerOf',
            inverse: 'hasMapLayer',
            domain: ['Image'],
            range: ['Operation', 'Project'],
            editable: false,
            visible: false,
            inputType: 'relation'
        },
        {
            name: 'hasDefaultMapLayer',
            domain: ['Operation', 'Project'],
            range: ['Image'],
            editable: false,
            visible: false,
            inputType: 'relation'
        },
        {
            name: 'isAfter',
            inverse: 'isBefore',
            domain: ['Feature'],
            range: ['Feature'],
            editable: true,
            visible: true,
            inputType: 'relation'
        },
        {
            name: 'isBefore',
            inverse: 'isAfter',
            domain: ['Feature'],
            range: ['Feature'],
            editable: true,
            visible: true,
            inputType: 'relation'
        },
        {
            name: Relation.SAME_AS,
            inverse: Relation.SAME_AS,
            domain: ['Feature'],
            range: ['Feature'],
            editable: true,
            visible: true,
            inputType: 'relation'
        },
        {
            name: Relation.SAME_AS,
            inverse: Relation.SAME_AS,
            domain: ['FeatureGroup'],
            range: ['FeatureGroup'],
            editable: true,
            visible: true,
            inputType: 'relation'
        },
        {
            name: Relation.SAME_AS,
            inverse: Relation.SAME_AS,
            domain: ['FeatureSegment'],
            range: ['FeatureSegment'],
            editable: true,
            visible: true,
            inputType: 'relation'
        },
        {
            name: Relation.SAME_AS,
            inverse: Relation.SAME_AS,
            domain: ['Find'],
            range: ['Find'],
            editable: true,
            visible: true,
            inputType: 'relation'
        },
        {
            name: 'isContemporaryWith',
            inverse: 'isContemporaryWith',
            domain: ['Feature'],
            range: ['Feature'],
            editable: true,
            visible: true,
            inputType: 'relation'
        },
        {
            name: 'isAbove',
            inverse: 'isBelow',
            domain: ['Feature'],
            range: ['Feature'],
            editable: true,
            visible: true,
            inputType: 'relation'
        },
        {
            name: 'isBelow',
            inverse: 'isAbove',
            domain: ['Feature'],
            range: ['Feature'],
            editable: true,
            visible: true,
            inputType: 'relation'
        },
        {
            name: 'cuts',
            inverse: 'isCutBy',
            domain: ['Feature'],
            range: ['Feature'],
            editable: true,
            visible: true,
            inputType: 'relation'
        },
        {
            name: 'isCutBy',
            inverse: 'cuts',
            domain: ['Feature'],
            range: ['Feature'],
            editable: true,
            visible: true,
            inputType: 'relation'
        },
        {
            name: 'fills',
            inverse: 'isFilledBy',
            domain: ['Feature'],
            range: ['Feature'],
            editable: true,
            visible: true,
            inputType: 'relation'
        },
        {
            name: 'isFilledBy',
            inverse: 'fills',
            domain: ['Feature'],
            range: ['Feature'],
            editable: true,
            visible: true,
            inputType: 'relation'
        },
        {
            name: 'borders',
            inverse: 'borders',
            domain: ['Feature'],
            range: ['Feature'],
            editable: true,
            visible: true,
            inputType: 'relation'
        },
        {
            name: 'borders',
            inverse: 'borders',
            domain: ['BuildingPart'],
            range: ['BuildingPart'],
            editable: true,
            visible: true,
            inputType: 'relation'
        },
        {
            name: 'abuts',
            inverse: 'isAbuttedBy',
            domain: ['Feature'],
            range: ['Feature'],
            editable: true,
            visible: true,
            inputType: 'relation'
        },
        {
            name: 'isAbuttedBy',
            inverse: 'abuts',
            domain: ['Feature'],
            range: ['Feature'],
            editable: true,
            visible: true,
            inputType: 'relation'
        },
        {
            name: 'bondsWith',
            inverse: 'bondsWith',
            domain: ['Feature'],
            range: ['Feature'],
            editable: true,
            visible: true,
            inputType: 'relation'
        },
        {
            name: Relation.IS_PRESENT_IN,
            domain: ['Feature', 'FeatureGroup', 'FeatureSegment'],
            range: ['Profile', 'Planum'],
            editable: true,
            visible: true,
            inputType: 'relation'
        },
        {
            name: 'isRecordedIn',
            domain: ['Profile', 'Planum'],
            range: ['Trench', 'ExcavationArea'],
            editable: false,
            visible: false,
            inputType: 'relation'
        },
        {
            name: 'isRecordedIn',
            domain: ['Level', 'Room', 'RoomFloor', 'RoomWall', 'RoomCeiling',
                'Roof', 'Stairs', 'Opening', 'Damage', 'DesignElement'],
            range: ['Building'],
            editable: false,
            visible: false,
            inputType: 'relation'
        },
        {
            name: 'isRecordedIn',
            domain: ['Area'],
            range: ['Survey'],
            editable: false,
            visible: false,
            inputType: 'relation'
        },
        {
            name: 'isRecordedIn',
            domain: ['BuildingPart'],
            range: ['Building', 'Survey'],
            editable: false,
            visible: false,
            inputType: 'relation'
        },
        {
            name: 'isRecordedIn',
            domain: ['Find', 'FindCollection', 'Inscription', 'Sample'],
            range: ['Trench', 'Building', 'Survey', 'ExcavationArea'],
            editable: false,
            visible: false,
            inputType: 'relation'
        },
        {
            name: 'isRecordedIn',
            domain: ['Feature', 'FeatureGroup', 'FeatureSegment'],
            range: ['Trench', 'ExcavationArea'],
            editable: false,
            visible: false,
            inputType: 'relation'
        },
        {
            name: 'liesWithin',
            domain: ['Operation', 'Place'],
            range: ['Place'],
            editable: false,
            visible: false,
            inputType: 'relation'
        },
        {
            name: 'liesWithin',
            domain: ['FindCollection', 'Find'],
            range: ['FindCollection', 'Feature', 'Area', 'Sample', 'Room',
                'BuildingPart', 'Level', 'RoomFloor', 'RoomWall', 'RoomCeiling', 'Roof',
                'Stairs', 'DesignElement'],
            editable: false,
            visible: false,
            inputType: 'relation'
        },
        {
            name: 'liesWithin',
            domain: ['Inscription'],
            range: ['Find'],
            editable: false,
            visible: false,
            inputType: 'relation'
        },
        {
            name: 'liesWithin',
            domain: ['Feature'],
            range: ['Feature', 'FeatureGroup'],
            editable: false,
            visible: false,
            inputType: 'relation'
        },
        {
            name: 'liesWithin',
            domain: ['FeatureSegment'],
            range: ['Feature'],
            editable: false,
            visible: false,
            inputType: 'relation'
        },
        {
            name: 'liesWithin',
            domain: ['Sample'],
            range: ['Sample', 'Feature', 'Find'],
            editable: false,
            visible: false,
            inputType: 'relation'
        },
        {
            name: 'liesWithin',
            domain: ['Level'],
            range: ['BuildingPart'],
            editable: false,
            visible: false,
            inputType: 'relation'
        },
        {
            name: 'liesWithin',
            domain: ['BuildingPart'],
            range: ['BuildingPart', 'Area'],
            editable: false,
            visible: false,
            inputType: 'relation'
        },
        {
            name: 'liesWithin',
            domain: ['Room'],
            range: ['BuildingPart', 'Level'],
            editable: false,
            visible: false,
            inputType: 'relation'
        },
        {
            name: 'liesWithin',
            domain: ['Area'],
            range: ['Area'],
            editable: false,
            visible: false,
            inputType: 'relation'
        },
        {
            name: 'liesWithin',
            domain: ['RoomFloor', 'RoomWall', 'RoomCeiling', 'Roof', 'Stairs'],
            range: ['BuildingPart', 'Room', 'Level'],
            editable: false,
            visible: false,
            inputType: 'relation'
        },
        {
            name: 'liesWithin',
            domain: ['Opening'],
            range: ['Room', 'RoomFloor', 'RoomWall', 'RoomCeiling', 'Roof', 'Stairs'],
            editable: false,
            visible: false,
            inputType: 'relation'
        },
        {
            name: 'liesWithin',
            domain: ['Damage'],
            range: ['BuildingPart', 'Room', 'Level', 'RoomFloor', 'RoomWall',
                'RoomCeiling', 'Roof', 'Stairs', 'Opening', 'DesignElement'],
            editable: false,
            visible: false,
            inputType: 'relation'
        },
        {
            name: 'liesWithin',
            domain: ['DesignElement'],
            range: ['BuildingPart', 'Room', 'Level', 'RoomFloor', 'RoomWall',
                'RoomCeiling', 'Roof', 'Stairs', 'Opening'],
            editable: false,
            visible: false,
            inputType: 'relation'
        },
        {
            name: 'liesWithin',
            domain: ['Type'],
            range: ['Type', 'TypeCatalog'],
            editable: false,
            visible: false,
            inputType: 'relation'
        },
        {
            name: 'liesWithin',
            domain: ['StoragePlace'],
            range: ['StoragePlace'],
            editable: false,
            visible: false,
            inputType: 'relation'
        },
        {
            name: 'isInstanceOf',
            inverse: 'hasInstance',
            domain: ['Find'],
            range: ['Type'],
            editable: true,
            visible: true,
            inputType: 'instanceOf'
        },
        {
            name: 'hasInstance',
            inverse: 'isInstanceOf',
            domain: ['Type'],
            range: ['Find'],
            editable: true,
            visible: true,
            inputType: 'relation'
        },
        {
            name: 'isStoredIn',
            inverse: 'isStoragePlaceOf',
            domain: ['Find', 'FindCollection', 'Sample'],
            range: ['StoragePlace'],
            editable: true,
            visible: true,
            inputType: 'relation'
        },
        {
            name: 'isStoragePlaceOf',
            inverse: 'isStoredIn',
            domain: ['StoragePlace'],
            range: ['Find', 'FindCollection', 'Sample'],
            editable: true,
            visible: true,
            inputType: 'relation'
        }
    ];


    constructor(customConfigurationName: string) {

        this.addProjectSpecificBuiltinConfiguration(customConfigurationName);
    }


    private addProjectSpecificBuiltinConfiguration(customConfigurationName: string) {

        if (customConfigurationName === 'Meninx' || customConfigurationName === 'Bourgou') {

            this.builtInCategories.Wall_surface = {
                color: '#ffff99',
                fields: {},
                minimalForm: {
                    groups: [
                        {
                            name: Groups.STEM,
                            fields: ['identifier', 'shortDescription']
                        },
                        {
                            name: Groups.POSITION,
                            fields: ['geometry']
                        }
                    ]
                }
            };
            this.builtInCategories.Drilling = {
                color: '#08519c',
                fields: {},
                minimalForm: {
                    groups: [
                        {
                            name: Groups.STEM,
                            fields: ['identifier', 'shortDescription']
                        },
                        {
                            name: Groups.POSITION,
                            fields: ['geometry']
                        }
                    ]
                }
            };
            this.builtInRelations.push({
                name: 'isRecordedIn',
                domain: ['Wall_surface'],
                range: ['Trench'],
                editable: false,
                inputType: 'relation'
            });
            this.builtInRelations.push({
                name: 'isRecordedIn',
                domain: ['Drilling'],
                range: ['Survey'],
                editable: false,
                inputType: 'relation'
            });
        }

        if (customConfigurationName === 'Pergamon') {

            this.builtInCategories.BuildingFloor = {
                color: '#6600cc',
                fields: {},
                minimalForm: {
                    groups: [
                        {
                            name: Groups.STEM,
                            fields: ['identifier', 'shortDescription']
                        },
                        {
                            name: Groups.POSITION,
                            fields: ['geometry']
                        }
                    ]
                }
            };
            this.builtInCategories.SurveyBurial = {
                color: '#45ff95',
                fields: {},
                minimalForm: {
                    groups: [
                        {
                            name: Groups.STEM,
                            fields: ['identifier', 'shortDescription']
                        },
                        {
                            name: Groups.POSITION,
                            fields: ['geometry']
                        }
                    ]
                }
            };

            this.builtInRelations.push({
                name: 'isRecordedIn',
                domain: ['BuildingFloor'],
                range: ['Building'],
                editable: false,
                inputType: 'relation'
            });

            this.builtInRelations.push({
                name: 'isRecordedIn',
                domain: ['SurveyBurial'],
                range: ['Survey'],
                editable: false,
                inputType: 'relation'
            });

            this.builtInRelations.push({
                name: 'liesWithin',
                domain: ['SurveyBurial'],
                range: ['Area'],
                editable: false,
                inputType: 'relation'
            });

            this.builtInRelations.push({
                name: 'borders',
                inverse: 'borders',
                domain: ['BuildingFloor'],
                range: ['BuildingPart'],
                editable: true,
                inputType: 'relation'
            });

            this.builtInRelations.push({ // override existing definition
                name: 'borders',
                inverse: 'borders',
                domain: ['BuildingPart'],
                range: ['BuildingPart', 'BuildingFloor'],
                editable: true,
                inputType: 'relation'
            });
        }

        if (customConfigurationName === 'Milet') {
            
            this.builtInCategories.Quantification = {
                supercategory: true,
                userDefinedSubcategoriesAllowed: true,
                abstract: false,
                color: '#c6dbef',
                fields: {},
                minimalForm: {
                    groups: [
                        {
                            name: Groups.STEM,
                            fields: ['identifier', 'shortDescription']
                        },
                        {
                            name: Groups.POSITION,
                            fields: ['geometry']
                        }
                    ]
                }
            };

            this.builtInCategories.Building = {
                parent: 'Operation',
                fields: {
                    gazId: {
                        inputType: Field.InputType.UNSIGNEDINT,
                        constraintIndexed: true
                    }
                },
                minimalForm: {
                    groups: [
                        {
                            name: Groups.STEM,
                            fields: ['identifier', 'shortDescription']
                        },
                        {
                            name: Groups.PROPERTIES,
                            fields: ['gazId']
                        },
                        {
                            name: Groups.POSITION,
                            fields: ['geometry']
                        }
                    ]
                }
            };

            this.builtInCategories.Find = {
                supercategory: true,
                userDefinedSubcategoriesAllowed: true,
                fields: {
                    diameterPercentage: {
                        inputType: Field.InputType.UNSIGNEDFLOAT,
                    }
                },
                minimalForm: {
                    groups: [
                        {
                            name: Groups.STEM,
                            fields: ['identifier', 'shortDescription']
                        },
                        {
                            name: Groups.IDENTIFICATION,
                            fields: ['isInstanceOf']
                        },
                        {
                            name: Groups.DIMENSION,
                            fields: ['diameterPercentage']
                        },
                        {
                            name: Groups.POSITION,
                            fields: ['geometry']
                        }
                    ]
                }
            };

            this.builtInCategories.Impression = {
                supercategory: false,
                userDefinedSubcategoriesAllowed: false,
                fields: {},
                minimalForm: {
                    groups: [
                        {
                            name: Groups.STEM,
                            fields: ['identifier', 'shortDescription']
                        },
                        {
                            name: Groups.POSITION,
                            fields: ['geometry']
                        }
                    ]
                }
            };

            this.builtInRelations.push({
                name: 'isRecordedIn',
                domain: ['Quantification', 'Impression'],
                range: ['Trench'],
                editable: false,
                inputType: 'relation'
            });

            this.builtInRelations.push({
                name: 'liesWithin',
                domain: ['Find'],
                range: ['Feature', 'Area', 'Quantification'],
                editable: false,
                inputType: 'relation'
            });

            this.builtInRelations.push({
                name: 'liesWithin',
                domain: ['Impression'],
                range: ['Feature'],
                editable: false,
                inputType: 'relation'
            });

            this.builtInRelations.push({
                name: 'liesWithin',
                domain: ['Quantification'],
                range: ['Feature', 'Quantification'],
                editable: false,
                inputType: 'relation'
            });

            this.builtInRelations.push({
                name: 'wasFoundIn',
                inverse: 'hasFinds',
                domain: ['Find'],
                range: ['Building', 'Place', 'Survey', 'Trench'],
                editable: true,
                inputType: 'relation'
            });
            
            this.builtInRelations.push({
                name: 'hasFinds',
                inverse: 'wasFoundIn',
                domain: ['Building', 'Place', 'Survey', 'Trench'],
                range: ['Find'],
                editable: true,
                inputType: 'relation'
            });

            (this.commonFields as any)['datingAddenda'] = {
                inputType: 'text'
            };
        }
    }
}

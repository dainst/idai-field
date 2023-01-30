import { Map } from 'tsfun';
import { Field } from '../model/configuration/field';
import { Groups } from '../model/configuration/group';
import { Relation } from '../model/configuration/relation';
import { BuiltInCategoryDefinition } from './model/category/built-in-category-definition';
import { BuiltInFieldDefinition } from './model/field/built-in-field-definition';


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
        beginningDate: {
            inputType: Field.InputType.DATE,
        },
        endDate: {
            inputType: Field.InputType.DATE,
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
            inputType: Field.InputType.DATE
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
        }
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
                    inputType: Field.InputType.SIMPLE_MULTIINPUT,
                    fixedInputType: true
                },
                campaigns: {
                    inputType: Field.InputType.SIMPLE_MULTIINPUT,
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
                        fields: ['geometry']
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
                        fields: ['geometry']
                    }
                ]
            }
        },
        Place: {
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
                        name: Groups.POSITION,
                        fields: ['geometry', Relation.IS_PRESENT_IN].concat(Relation.Position.ALL)
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
                        name: Groups.POSITION,
                        fields: ['geometry', Relation.IS_PRESENT_IN]
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
                        name: Groups.POSITION,
                        fields: ['geometry', Relation.IS_PRESENT_IN]
                    }
                ]
            }
        },
        Find: {
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
                        name: Groups.IDENTIFICATION,
                        fields: ['isInstanceOf']
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
            fields: {},
            minimalForm: {
                groups: [
                    {
                        name: Groups.STEM,
                        fields: ['identifier', 'category', 'shortDescription']
                    },
                    {
                        name: Groups.IDENTIFICATION,
                        fields: ['isInstanceOf']
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
                // The originalFilename gets used as an inital resource.identifier
                // when the image gets uploaded. However, users can change the identifier,
                // which is why we store the originalFilename separately
                originalFilename: {
                    inputType: Field.InputType.SIMPLE_INPUT,
                    visible: false,
                    editable: false
                },
                georeference: {
                    inputType: Field.InputType.NONE,
                    visible: false,
                    editable: false
                },
                featureVectors: {
                    inputType: Field.InputType.NONE,
                    visible: false,
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
        },
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
            mandatory: true,
            fulltextIndexed: true,
            fixedInputType: true
        }
    };


    public builtInRelations: Array<Relation> = [
        {
            name: 'depicts',
            domain: ['Image:inherit'],
            range: [],
            inverse: 'isDepictedIn',
            editable: false,
            visible: false,
            inputType: 'relation'
        },
        {
            name: 'isDepictedIn',
            domain: [],
            range: ['Image:inherit'],
            inverse: 'depicts',
            editable: false,
            visible: false,
            inputType: 'relation'
        },
        {
            name: 'hasMapLayer',
            inverse: 'isMapLayerOf',
            domain: ['Operation:inherit', 'Project'],
            range: ['Image:inherit'],
            editable: false,
            visible: false,
            inputType: 'relation'
        },
        {
            name: 'isMapLayerOf',
            inverse: 'hasMapLayer',
            domain: ['Image:inherit'],
            range: ['Operation:inherit', 'Project'],
            editable: false,
            visible: false,
            inputType: 'relation'
        },
        {
            name: 'hasDefaultMapLayer',
            domain: ['Operation:inherit', 'Project'],
            range: ['Image:inherit'],
            editable: false,
            visible: false,
            inputType: 'relation'
        },
        {
            name: 'isAfter',
            inverse: 'isBefore',
            domain: ['Feature:inherit'],
            range: ['Feature:inherit'],
            editable: true,
            visible: true,
            inputType: 'relation'
        },
        {
            name: 'isBefore',
            inverse: 'isAfter',
            domain: ['Feature:inherit'],
            range: ['Feature:inherit'],
            editable: true,
            visible: true,
            inputType: 'relation'
        },
        {
            name: Relation.SAME_AS,
            inverse: Relation.SAME_AS,
            domain: ['Feature:inherit'],
            range: ['Feature:inherit'],
            editable: true,
            visible: true,
            inputType: 'relation'
        },
        {
            name: Relation.SAME_AS,
            inverse: Relation.SAME_AS,
            domain: ['FeatureGroup:inherit'],
            range: ['FeatureGroup:inherit'],
            editable: true,
            visible: true,
            inputType: 'relation'
        },
        {
            name: Relation.SAME_AS,
            inverse: Relation.SAME_AS,
            domain: ['FeatureSegment:inherit'],
            range: ['FeatureSegment:inherit'],
            editable: true,
            visible: true,
            inputType: 'relation'
        },
        {
            name: Relation.SAME_AS,
            inverse: Relation.SAME_AS,
            domain: ['Find:inherit'],
            range: ['Find:inherit'],
            editable: true,
            visible: true,
            inputType: 'relation'
        },
        {
            name: 'isContemporaryWith',
            inverse: 'isContemporaryWith',
            domain: ['Feature:inherit'],
            range: ['Feature:inherit'],
            editable: true,
            visible: true,
            inputType: 'relation'
        },
        {
            name: 'isAbove',
            inverse: 'isBelow',
            domain: ['Feature:inherit'],
            range: ['Feature:inherit'],
            sameMainCategoryResource: true,
            editable: true,
            visible: true,
            inputType: 'relation'
        },
        {
            name: 'isBelow',
            inverse: 'isAbove',
            domain: ['Feature:inherit'],
            range: ['Feature:inherit'],
            sameMainCategoryResource: true,
            editable: true,
            visible: true,
            inputType: 'relation'
        },
        {
            name: 'cuts',
            inverse: 'isCutBy',
            domain: ['Feature:inherit'],
            range: ['Feature:inherit'],
            sameMainCategoryResource: true,
            editable: true,
            visible: true,
            inputType: 'relation'
        },
        {
            name: 'isCutBy',
            inverse: 'cuts',
            domain: ['Feature:inherit'],
            range: ['Feature:inherit'],
            sameMainCategoryResource: true,
            editable: true,
            visible: true,
            inputType: 'relation'
        },
        {
            name: 'fills',
            inverse: 'isFilledBy',
            domain: ['Feature:inherit'],
            range: ['Feature:inherit'],
            sameMainCategoryResource: true,
            editable: true,
            visible: true,
            inputType: 'relation'
        },
        {
            name: 'isFilledBy',
            inverse: 'fills',
            domain: ['Feature:inherit'],
            range: ['Feature:inherit'],
            sameMainCategoryResource: true,
            editable: true,
            visible: true,
            inputType: 'relation'
        },
        {
            name: 'borders',
            inverse: 'borders',
            domain: ['Feature:inherit'],
            range: ['Feature:inherit'],
            sameMainCategoryResource: true,
            editable: true,
            visible: true,
            inputType: 'relation'
        },
        {
            name: 'borders',
            inverse: 'borders',
            domain: ['BuildingPart:inherit'],
            range: ['BuildingPart:inherit'],
            sameMainCategoryResource: true,
            editable: true,
            visible: true,
            inputType: 'relation'
        },
        {
            name: Relation.IS_PRESENT_IN,
            domain: ['Feature:inherit', 'FeatureGroup:inherit', 'FeatureSegment:inherit'],
            range: ['Profile', 'Planum'],
            editable: true,
            visible: true,
            inputType: 'relation'
        },
        {
            name: 'isRecordedIn',
            domain: ['Profile', 'Planum'],
            range: ['Trench'],
            editable: false,
            visible: false,
            inputType: 'relation'
        },
        {
            name: 'isRecordedIn',
            domain: ['Inscription'],
            range: ['Trench'],
            editable: false,
            visible: false,
            inputType: 'relation'
        },
        {
            name: 'isRecordedIn',
            domain: ['Level:inherit', 'Room:inherit', 'RoomFloor', 'RoomWall:inherit', 'RoomCeiling',
                'Roof', 'Stairs', 'Opening', 'Damage:inherit', 'DesignElement:inherit'],
            range: ['Building'],
            editable: false,
            visible: false,
            inputType: 'relation'
        },
        {
            name: 'isRecordedIn',
            domain: ['Area:inherit'],
            range: ['Survey'],
            editable: false,
            visible: false,
            inputType: 'relation'
        },
        {
            name: 'isRecordedIn',
            domain: ['BuildingPart:inherit'],
            range: ['Building', 'Survey'],
            editable: false,
            visible: false,
            inputType: 'relation'
        },
        {
            name: 'isRecordedIn',
            domain: ['Find:inherit', 'FindCollection:inherit'],
            range: ['Trench', 'Building', 'Survey'],
            editable: false,
            visible: false,
            inputType: 'relation'
        },
        {
            name: 'isRecordedIn',
            domain: ['Feature:inherit', 'FeatureGroup:inherit', 'FeatureSegment:inherit'],
            range: ['Trench'],
            editable: false,
            visible: false,
            inputType: 'relation'
        },
        {
            name: 'isRecordedIn',
            domain: ['Sample'],
            range: ['Trench', 'Survey'],
            editable: false,
            visible: false,
            inputType: 'relation'
        },
        {
            name: 'liesWithin',
            domain: ['Operation:inherit', 'Place'],
            range: ['Place'],
            editable: false,
            visible: false,
            inputType: 'relation'
        },
        {
            name: 'liesWithin',
            domain: ['FindCollection:inherit', 'Find:inherit'],
            range: ['FindCollection:inherit', 'Feature:inherit', 'Area:inherit', 'Sample', 'Room:inherit',
                'BuildingPart:inherit', 'Level:inherit', 'RoomFloor', 'RoomWall:inherit', 'RoomCeiling', 'Roof',
                'Stairs', 'DesignElement:inherit'],
            sameMainCategoryResource: true,
            editable: false,
            visible: false,
            inputType: 'relation'
        },
        {
            name: 'liesWithin',
            domain: ['Inscription'],
            range: ['Find:inherit'],
            sameMainCategoryResource: true,
            editable: false,
            visible: false,
            inputType: 'relation'
        },
        {
            name: 'liesWithin',
            domain: ['Feature:inherit'],
            range: ['Feature:inherit', 'FeatureGroup:inherit'],
            sameMainCategoryResource: true,
            editable: false,
            visible: false,
            inputType: 'relation'
        },
        {
            name: 'liesWithin',
            domain: ['FeatureSegment:inherit'],
            range: ['Feature:inherit'],
            sameMainCategoryResource: true,
            editable: false,
            visible: false,
            inputType: 'relation'
        },
        {
            name: 'liesWithin',
            domain: ['Sample'],
            range: ['Sample', 'Feature:inherit', 'Find:inherit'],
            sameMainCategoryResource: true,
            editable: false,
            visible: false,
            inputType: 'relation'
        },
        {
            name: 'liesWithin',
            domain: ['Level:inherit'],
            range: ['BuildingPart:inherit'],
            sameMainCategoryResource: true,
            editable: false,
            visible: false,
            inputType: 'relation'
        },
        {
            name: 'liesWithin',
            domain: ['BuildingPart:inherit'],
            range: ['BuildingPart:inherit', 'Area:inherit'],
            sameMainCategoryResource: true,
            editable: false,
            visible: false,
            inputType: 'relation'
        },
        {
            name: 'liesWithin',
            domain: ['Room:inherit'],
            range: ['BuildingPart:inherit', 'Level:inherit'],
            sameMainCategoryResource: true,
            editable: false,
            visible: false,
            inputType: 'relation'
        },
        {
            name: 'liesWithin',
            domain: ['Area:inherit'],
            range: ['Area:inherit'],
            sameMainCategoryResource: true,
            editable: false,
            visible: false,
            inputType: 'relation'
        },
        {
            name: 'liesWithin',
            domain: ['RoomFloor', 'RoomWall:inherit', 'RoomCeiling', 'Roof', 'Stairs'],
            range: ['BuildingPart:inherit', 'Room:inherit', 'Level:inherit'],
            sameMainCategoryResource: true,
            editable: false,
            visible: false,
            inputType: 'relation'
        },
        {
            name: 'liesWithin',
            domain: ['Opening'],
            range: ['Room:inherit', 'RoomFloor', 'RoomWall:inherit', 'RoomCeiling', 'Roof', 'Stairs'],
            sameMainCategoryResource: true,
            editable: false,
            visible: false,
            inputType: 'relation'
        },
        {
            name: 'liesWithin',
            domain: ['Damage:inherit'],
            range: ['BuildingPart:inherit', 'Room:inherit', 'Level:inherit', 'RoomFloor', 'RoomWall:inherit',
                'RoomCeiling', 'Roof', 'Stairs', 'Opening', 'DesignElement:inherit'],
            sameMainCategoryResource: true,
            editable: false,
            visible: false,
            inputType: 'relation'
        },
        {
            name: 'liesWithin',
            domain: ['DesignElement:inherit'],
            range: ['BuildingPart:inherit', 'Room:inherit', 'Level:inherit', 'RoomFloor', 'RoomWall:inherit',
                'RoomCeiling', 'Roof', 'Stairs', 'Opening'],
            sameMainCategoryResource: true,
            editable: false,
            visible: false,
            inputType: 'relation'
        },
        {
            name: 'liesWithin',
            domain: ['Type:inherit'],
            range: ['Type:inherit', 'TypeCatalog:inherit'],
            editable: false,
            visible: false,
            inputType: 'relation'
        },
        {
            name: 'isInstanceOf',
            inverse: 'hasInstance',
            domain: ['Find:inherit'],
            range: ['Type:inherit'],
            editable: true,
            visible: true,
            inputType: 'instanceOf'
        },
        {
            name: 'hasInstance',
            inverse: 'isInstanceOf',
            domain: ['Type:inherit'],
            range: ['Find:inherit'],
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
                range: ['Area:inherit'],
                sameMainCategoryResource: true,
                editable: false,
                inputType: 'relation'
            });

            this.builtInRelations.push({
                name: 'borders',
                inverse: 'borders',
                domain: ['BuildingFloor'],
                range: ['BuildingPart:inherit'],
                sameMainCategoryResource: true,
                editable: true,
                inputType: 'relation'
            });

            this.builtInRelations.push({ // override existing definition
                name: 'borders',
                inverse: 'borders',
                domain: ['BuildingPart:inherit'],
                range: ['BuildingPart:inherit', 'BuildingFloor'],
                sameMainCategoryResource: true,
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
                domain: ['Quantification:inherit', 'Impression'],
                range: ['Trench:inherit'],
                editable: false,
                inputType: 'relation'
            });

            this.builtInRelations.push({
                name: 'liesWithin',
                domain: ['Find:inherit'],
                range: ['Feature:inherit', 'Area:inherit', 'Quantification:inherit'],
                editable: false,
                inputType: 'relation'
            });

            this.builtInRelations.push({
                name: 'liesWithin',
                domain: ['Impression'],
                range: ['Feature:inherit'],
                editable: false,
                inputType: 'relation'
            });

            this.builtInRelations.push({
                name: 'liesWithin',
                domain: ['Quantification:inherit'],
                range: ['Feature:inherit', 'Quantification:inherit'],
                editable: false,
                inputType: 'relation'
            });

            this.builtInRelations.push({
                name: 'wasFoundIn',
                inverse: 'hasFinds',
                domain: ['Find:inherit'],
                range: ['Building', 'Place', 'Survey', 'Trench'],
                editable: true,
                inputType: 'relation'
            });
            
            this.builtInRelations.push({
                name: 'hasFinds',
                inverse: 'wasFoundIn',
                domain: ['Building', 'Place', 'Survey', 'Trench'],
                range: ['Find:inherit'],
                editable: true,
                inputType: 'relation'
            });

            (this.commonFields as any)['datingAddenda'] = {
                inputType: 'text'
            };
        }
    }
}
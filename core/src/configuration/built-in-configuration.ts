import { Map } from 'tsfun';
import { FieldDefinition } from '../model/field-definition';
import { Groups } from '../model/group';
import { RelationDefinition } from '../model/relation-definition';
import { BuiltinCategoryDefinition } from './model/builtin-category-definition';


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class BuiltInConfiguration {

    public commonFields = {
        period: {
            inputType: FieldDefinition.InputType.DROPDOWNRANGE,
            constraintIndexed: true
        },
        dating: {
            inputType: FieldDefinition.InputType.DATING,
        },
        diary: {
            inputType: FieldDefinition.InputType.INPUT,
            constraintIndexed: true
        },
        area: {
            inputType: FieldDefinition.InputType.UNSIGNEDFLOAT,
            constraintIndexed: true
        },
        dimensionLength: {
            inputType: FieldDefinition.InputType.DIMENSION,
            positionValuelistId: 'position-values-expansion-default'
        },
        dimensionWidth: {
            inputType: FieldDefinition.InputType.DIMENSION,
            positionValuelistId: 'position-values-expansion-default'
        },
        dimensionHeight: {
            inputType: FieldDefinition.InputType.DIMENSION,
            positionValuelistId: 'position-values-expansion-default'
        },
        dimensionDiameter: {
            inputType: FieldDefinition.InputType.DIMENSION,
            positionValuelistId: 'position-values-expansion-default'
        },
        dimensionPerimeter: {
            inputType: FieldDefinition.InputType.DIMENSION,
            positionValuelistId: 'position-values-expansion-default'
        },
        dimensionThickness: {
            inputType: FieldDefinition.InputType.DIMENSION,
            positionValuelistId: 'position-values-expansion-default'
        },
        dimensionVerticalExtent: {
            inputType: FieldDefinition.InputType.DIMENSION,
            inputTypeOptions: { validation: { permissive: true } },
            positionValuelistId: 'position-values-edge-default'
        },
        dimensionOther: {
            inputType: FieldDefinition.InputType.DIMENSION,
            positionValuelistId: 'position-values-expansion-default'
        },
        beginningDate: {
            inputType: FieldDefinition.InputType.DATE,
        },
        endDate: {
            inputType: FieldDefinition.InputType.DATE,
        },
        supervisor: {
            inputType: FieldDefinition.InputType.CHECKBOXES,
            valuelistFromProjectField: 'staff',
            constraintIndexed: true
        },
        processor: {
            inputType: FieldDefinition.InputType.CHECKBOXES,
            valuelistFromProjectField: 'staff',
            constraintIndexed: true
        },
        campaign: {
            inputType: FieldDefinition.InputType.CHECKBOXES,
            valuelistFromProjectField: 'campaigns',
            allowOnlyValuesOfParent: true,
            constraintIndexed: true
        },
        draughtsmen: {
            inputType: FieldDefinition.InputType.CHECKBOXES,
            valuelistFromProjectField: 'staff',
            constraintIndexed: true
        },
        description: {
            inputType: FieldDefinition.InputType.TEXT
        },
        date: {
            inputType: FieldDefinition.InputType.DATE
        },
        spatialLocation: {
            inputType: FieldDefinition.InputType.INPUT
        },
        provenance: {
            inputType: FieldDefinition.InputType.DROPDOWN,
            constraintIndexed: true
        },
        orientation: {
            inputType: FieldDefinition.InputType.DROPDOWN,
            constraintIndexed: true
        },
        literature: {
            inputType: FieldDefinition.InputType.LITERATURE
        }
    };
    

    public builtInCategories: Map<BuiltinCategoryDefinition> = {
        Project: {
            required: true,
            fields: {
                identifier: {
                    inputType: FieldDefinition.InputType.INPUT,
                    editable: false,
                    visible: false
                },
                shortName: {
                    inputType: FieldDefinition.InputType.INPUT
                },
                coordinateReferenceSystem: {
                    inputType: FieldDefinition.InputType.DROPDOWN
                },
                staff: {
                    inputType: FieldDefinition.InputType.MULTIINPUT
                },
                campaigns: {
                    inputType: FieldDefinition.InputType.MULTIINPUT
                }
            },
            groups: [
                {
                    name: Groups.STEM,
                    fields: ['shortName', 'category', 'shortDescription']
                },
                {
                    name: Groups.PARENT,
                    fields: ['staff', 'campaigns', 'coordinateReferenceSystem']
                }
            ]
        },
        Operation: {
            supercategory: true,
            abstract: true,
            required: true,
            fields: {
                geometry: {
                    inputType: FieldDefinition.InputType.GEOMETRY,
                    visible: false
                }
            },
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
        },
        Building: {
            fields: {},
            groups: [
                {
                    name: Groups.STEM,
                    fields: ['identifier', 'category', 'shortDescription']
                },
                {
                    name: Groups.POSITION,
                    fields: ['geometry']
                }
            ],
            parent: 'Operation'
        },
        Survey: {
            fields: {},
            groups: [
                {
                    name: Groups.STEM,
                    fields: ['identifier', 'category', 'shortDescription']
                },
                {
                    name: Groups.POSITION,
                    fields: ['geometry']
                }
            ],
            parent: 'Operation'
        },
        Trench: {
            fields: {},
            groups: [
                {
                    name: Groups.STEM,
                    fields: ['identifier', 'category', 'shortDescription']
                },
                {
                    name: Groups.POSITION,
                    fields: ['geometry']
                }
            ],
            parent: 'Operation'
        },
        Place: {
            fields: {
                gazId: {
                    inputType: FieldDefinition.InputType.UNSIGNEDINT,
                    constraintIndexed: true
                },
                geometry: {
                    inputType: FieldDefinition.InputType.GEOMETRY,
                    visible: false
                }
            },
            groups: [
                {
                    name: Groups.STEM,
                    fields: ['identifier', 'category', 'shortDescription']
                },
                {
                    name: Groups.PARENT,
                    fields: ['gazId']
                },
                {
                    name: Groups.POSITION,
                    fields: ['geometry']
                }
            ],
        },
        Inscription: {
            fields: {},
            groups: [
                {
                    name: Groups.STEM,
                    fields: ['identifier', 'category', 'shortDescription']
                }
            ],
            mustLieWithin: true
        },
        // Room is an idealized (non material) entity
        Room: {
            supercategory: true,
            userDefinedSubcategoriesAllowed: true,
            fields: {
                geometry: {
                    inputType: FieldDefinition.InputType.GEOMETRY,
                    visible: false
                }
            },
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
        },
        // An idealized (non material) entity, must be created within a Room
        RoomWall: {
            fields: {
                geometry: {
                    inputType: FieldDefinition.InputType.GEOMETRY,
                    visible: false
                }
            },
            groups: [
                {
                    name: Groups.STEM,
                    fields: ['identifier', 'category', 'shortDescription']
                },
                {
                    name: Groups.POSITION,
                    fields: ['geometry']
                }
            ],
            mustLieWithin: true
        },
        // An idealized (non material) entity, must be created within a Room
        RoomFloor: {
            fields: {
                geometry: {
                    inputType: FieldDefinition.InputType.GEOMETRY,
                    visible: false
                }
            },
            groups: [
                {
                    name: Groups.STEM,
                    fields: ['identifier', 'category', 'shortDescription']
                },
                {
                    name: Groups.POSITION,
                    fields: ['geometry']
                }
            ],
            mustLieWithin: true
        },
        // An idealized (non material) entity, must be created within a Room
        RoomCeiling: {
            fields: {
                geometry: {
                    inputType: FieldDefinition.InputType.GEOMETRY,
                    visible: false
                }
            },
            groups: [
                {
                    name: Groups.STEM,
                    fields: ['identifier', 'category', 'shortDescription']
                },
                {
                    name: Groups.POSITION,
                    fields: ['geometry']
                }
            ],
            mustLieWithin: true
        },
        // The material counterpart to Room, RoomCeiling, RoomWall, RoomFloor
        BuildingPart: {
            supercategory: true,
            userDefinedSubcategoriesAllowed: true,
            fields: {
                geometry: {
                    inputType: FieldDefinition.InputType.GEOMETRY,
                    visible: false
                }
            },
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
        },
        Area: {
            supercategory: true,
            userDefinedSubcategoriesAllowed: true,
            fields: {
                geometry: {
                    inputType: FieldDefinition.InputType.GEOMETRY,
                    visible: false
                }
            },
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
        },
        Feature: {
            supercategory: true,
            userDefinedSubcategoriesAllowed: true,
            fields: {
                // TODO Use common field?
                period: {
                    inputType: FieldDefinition.InputType.DROPDOWNRANGE,
                    constraintIndexed: true
                },
                dating: {
                    inputType: FieldDefinition.InputType.DATING,
                },
                geometry: {
                    inputType: FieldDefinition.InputType.GEOMETRY,
                    visible: false
                }
            },
            groups: [
                {
                    name: Groups.STEM,
                    fields: ['identifier', 'category', 'shortDescription']
                },
                {
                    name: Groups.POSITION,
                    fields: ['geometry', 'isBelow', 'isAbove', 'isEquivalentTo', 'borders', 'cuts', 'isCutBy']
                },
                {
                    name: Groups.TIME,
                    fields: ['period', 'dating', 'isBefore', 'isAfter', 'isContemporaryWith']
                }
            ]
        },
        Find: {
            supercategory: true,
            userDefinedSubcategoriesAllowed: true,
            fields: {
                geometry: {
                    inputType: FieldDefinition.InputType.GEOMETRY,
                    visible: false
                }
            },
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
        },
        Sample: {
            mustLieWithin: true,
            fields: {
                geometry: {
                    inputType: FieldDefinition.InputType.GEOMETRY,
                    visible: false
                }
            },
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
        },
        TypeCatalog: {
            supercategory: true,
            required: true,
            fields: {
                criterion: {
                    inputType: FieldDefinition.InputType.DROPDOWN,
                    constraintIndexed: true
                }
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
        },
        Type: {
            supercategory: true,
            mustLieWithin: true,
            required: true,
            fields: {},
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
        },
        Image: {
            supercategory: true,
            userDefinedSubcategoriesAllowed: true,
            required: true,
            fields: {
                height: {
                    inputType: FieldDefinition.InputType.UNSIGNEDINT,
                    editable: false
                },
                width: {
                    inputType: FieldDefinition.InputType.UNSIGNEDINT,
                    editable: false
                },
                // The originalFilename gets used as an inital resource.identifier
                // when the image gets uploaded. However, users can change the identifier,
                // which is why we store the originalFilename separately
                originalFilename: {
                    inputType: FieldDefinition.InputType.INPUT,
                    visible: false,
                    editable: false
                },
                georeference: {
                    inputType: FieldDefinition.InputType.NONE,
                    visible: false,
                    editable: false
                },
                featureVectors: {
                    inputType: FieldDefinition.InputType.NONE,
                    visible: false,
                    editable: false
                }
            },
            groups: [
                {
                    name: Groups.STEM,
                    fields: ['identifier', 'category', 'shortDescription']
                },
                {
                    name: Groups.PARENT,
                    fields: ['height', 'width']
                }
            ]
        },
    };


    public builtInFields = {
        id: {
            editable: false,
            visible: false,
            source: 'builtin'
        } as FieldDefinition,
        category: {
            visible: true,
            editable: false,
            source: 'builtin'
        } as FieldDefinition,
        shortDescription: {
            visible: true,
            editable: true,
            fulltextIndexed: true
        } as FieldDefinition,
        identifier: {
            visible: false,
            editable: true,
            mandatory: true,
            fulltextIndexed: true
        } as FieldDefinition
    };


    public builtInRelations: Array<RelationDefinition> = [
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
            domain: ['Operation:inherit'],
            range: ['Image:inherit'],
            editable: false,
            visible: false,
            inputType: 'relation'
        },
        {
            name: 'isMapLayerOf',
            inverse: 'hasMapLayer',
            domain: ['Image:inherit'],
            range: ['Operation:inherit'],
            editable: false,
            visible: false,
            inputType: 'relation'
        },
        {
            name: 'isAfter',
            inverse: 'isBefore',
            domain: ['Feature:inherit'],
            range: ['Feature:inherit'],
            sameMainCategoryResource: true,
            editable: true,
            visible: true,
            inputType: 'relation'
        },
        {
            name: 'isBefore',
            inverse: 'isAfter',
            domain: ['Feature:inherit'],
            range: ['Feature:inherit'],
            sameMainCategoryResource: true,
            editable: true,
            visible: true,
            inputType: 'relation'
        },
        {
            name: 'isEquivalentTo',
            inverse: 'isEquivalentTo',
            domain: ['Feature:inherit'],
            range: ['Feature:inherit'],
            sameMainCategoryResource: true,
            editable: true,
            visible: true,
            inputType: 'relation'
        },
        {
            name: 'isContemporaryWith',
            inverse: 'isContemporaryWith',
            domain: ['Feature:inherit'],
            range: ['Feature:inherit'],
            sameMainCategoryResource: true,
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
            name: 'isRecordedIn',
            domain: ['Inscription'],
            range: ['Trench'],
            editable: false,
            visible: false,
            inputType: 'relation'
        },
        {
            name: 'isRecordedIn',
            domain: ['Room'],
            range: ['Building'],
            editable: false,
            visible: false,
            inputType: 'relation'
        },
        {
            name: 'isRecordedIn',
            domain: ['RoomFloor'],
            range: ['Building'],
            editable: false,
            visible: false,
            inputType: 'relation'
        },
        {
            name: 'isRecordedIn',
            domain: ['RoomWall'],
            range: ['Building'],
            editable: false,
            visible: false,
            inputType: 'relation'
        },
        {
            name: 'isRecordedIn',
            domain: ['RoomCeiling'],
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
            domain: ['Find:inherit'],
            range: ['Trench', 'Survey'],
            editable: false,
            visible: false,
            inputType: 'relation'
        },
        {
            name: 'isRecordedIn',
            domain: ['Feature:inherit'],
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
            domain: ['Find:inherit'],
            range: ['Feature:inherit', 'Area:inherit'],
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
            range: ['Feature:inherit'],
            sameMainCategoryResource: true,
            editable: false,
            visible: false,
            inputType: 'relation'
        },
        {
            name: 'liesWithin',
            domain: ['Sample'],
            range: ['Feature:inherit', 'Find:inherit'],
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
            domain: ['Area:inherit'],
            range: ['Area:inherit'],
            sameMainCategoryResource: true,
            editable: false,
            visible: false,
            inputType: 'relation'
        },
        {
            name: 'liesWithin',
            domain: ['RoomFloor'],
            range: ['Room'],
            sameMainCategoryResource: true,
            editable: false,
            visible: false,
            inputType: 'relation'
        },
        {
            name: 'liesWithin',
            domain: ['RoomWall'],
            range: ['Room'],
            sameMainCategoryResource: true,
            editable: false,
            visible: false,
            inputType: 'relation'
        },
        {
            name: 'liesWithin',
            domain: ['RoomCeiling'],
            range: ['Room'],
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

        if (customConfigurationName === 'Meninx' || customConfigurationName === 'Pergamon'
                || customConfigurationName === 'Bourgou') {

            (this.builtInCategories as any)['Other'] = {
                color: '#CC6600',
                parent: 'Feature',
                fields: {
                    geometry: {
                        inputType: FieldDefinition.InputType.GEOMETRY,
                        visible: false
                    }
                },
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
            };
        }

        if (customConfigurationName === 'Meninx' || customConfigurationName === 'Bourgou') {

            (this.builtInCategories as any)['Wall_surface'] = {
                color: '#ffff99',
                fields: {
                    geometry: {
                        inputType: FieldDefinition.InputType.GEOMETRY,
                        visible: false
                    }
                },
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
            };
            (this.builtInCategories as any)['Drilling'] = {
                color: '#08519c',
                fields: {
                    geometry: {
                        inputType: FieldDefinition.InputType.GEOMETRY
                    }
                },
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

            (this.builtInCategories as any)['ProcessUnit'] = {
                supercategory: true,
                userDefinedSubcategoriesAllowed: true,
                abstract: true,
                color: '#08306b',
                fields: {
                    geometry: {
                        inputType: FieldDefinition.InputType.GEOMETRY,
                        visible: false
                    }
                },
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
            };
            (this.builtInCategories as any)['Profile'] = {
                color: '#c6dbef',
                parent: 'ProcessUnit',
                fields: {
                    geometry: {
                        inputType: FieldDefinition.InputType.GEOMETRY,
                        visible: false
                    }
                },
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
            };
            (this.builtInCategories as any)['BuildingFloor'] = {
                color: '#6600cc',
                fields: {
                    geometry: {
                        inputType: FieldDefinition.InputType.GEOMETRY,
                        visible: false
                    }
                },
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
            };
            (this.builtInCategories as any)['SurveyBurial'] = {
                color: '#45ff95',
                fields: {
                    geometry: {
                        inputType: FieldDefinition.InputType.GEOMETRY,
                        visible: false
                    }
                },
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
            };

            this.builtInRelations.push({
                name: 'isRecordedIn',
                domain: ['ProcessUnit'],
                range: ['Trench'],
                editable: false,
                inputType: 'relation'
            });

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
            
            (this.builtInCategories as any)['Quantification'] = {
                color: '#c6dbef',
                supercategory: true,
                userDefinedSubcategoriesAllowed: true,
                abstract: false,
                fields: {
                    geometry: {
                        inputType: FieldDefinition.InputType.GEOMETRY,
                        visible: false
                    }
                },
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
            };

            (this.builtInCategories as any)['Building'] = {
                userDefinedSubcategoriesAllowed: true,
                parent: 'Operation',
                fields: {
                    gazId: {
                        inputType: FieldDefinition.InputType.UNSIGNEDINT,
                        constraintIndexed: true
                    }
                },
                groups: [
                    {
                        name: Groups.STEM,
                        fields: ['identifier', 'shortDescription']
                    },
                    {
                        name: Groups.PARENT,
                        fields: ['gazId']
                    },
                    {
                        name: Groups.POSITION,
                        fields: ['geometry']
                    }
                ]
            };

            (this.builtInCategories as any)['Find'] = {
                supercategory: true,
                userDefinedSubcategoriesAllowed: true,
                fields: {
                    diameterPercentage: {
                        inputType: FieldDefinition.InputType.UNSIGNEDFLOAT,
                    },
                    geometry: {
                        inputType: FieldDefinition.InputType.GEOMETRY,
                        visible: false
                    }
                },
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
            };

            (this.builtInCategories as any)['Impression'] = {
                supercategory: false,
                userDefinedSubcategoriesAllowed: false,
                fields: {
                    geometry: {
                        inputType: FieldDefinition.InputType.GEOMETRY,
                        visible: false
                    }
                },
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
                name: 'fills',
                inverse: 'isFilledBy',
                domain: ['Feature:inherit'],
                range: ['Feature:inherit'],
                sameMainCategoryResource: true,
                editable: true,
                inputType: 'relation'
            });

            this.builtInRelations.push({
                name: 'isFilledBy',
                inverse: 'fills',
                domain: ['Feature:inherit'],
                range: ['Feature:inherit'],
                sameMainCategoryResource: true,
                editable: true,
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

            (this.builtInFields as any)['datingAddenda'] = {
                visible: true,
                editable: true,
                mandatory: false,
                inputType: 'text',
                group: Groups.TIME  // TODO Remove
            };

            (this.builtInFields as any)['notes'] = {
                visible: true,
                editable: true,
                mandatory: false,
                inputType: 'text',
                group: Groups.STEM  // TODO Remove
            };
        }
    }
}
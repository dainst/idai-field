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
        },
        dating: {
            inputType: FieldDefinition.InputType.DATING,
        },
        diary: {
            inputType: FieldDefinition.InputType.INPUT,
        },
        area: {
            inputType: FieldDefinition.InputType.UNSIGNEDFLOAT,
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
            inputTypeOptions: { validation: { permissive: true }},
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
        },
        processor: {
            inputType: FieldDefinition.InputType.CHECKBOXES,
            valuelistFromProjectField: 'staff',
        },
        campaign: {
            inputType: FieldDefinition.InputType.CHECKBOXES,
            valuelistFromProjectField: 'campaigns',
            allowOnlyValuesOfParent: true,
        },
        draughtsmen: {
            inputType: FieldDefinition.InputType.CHECKBOXES,
            valuelistFromProjectField: 'staff',
        },
        description: {
            inputType: FieldDefinition.InputType.TEXT
        },
        date: {
            inputType: FieldDefinition.InputType.DATE,
        },
        spatialLocation: {
            inputType: FieldDefinition.InputType.INPUT,
        },
        provenance: {
            inputType: FieldDefinition.InputType.DROPDOWN,
        },
        orientation: {
            inputType: FieldDefinition.InputType.DROPDOWN,
        },
        literature: {
            inputType: FieldDefinition.InputType.LITERATURE
        }
    };
    

    public builtInCategories: Map<BuiltinCategoryDefinition> = {
        Project: {
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
                    fields: ['shortName', 'shortDescription']
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
            fields: {},
            groups: [
                {
                    name: Groups.STEM,
                    fields: ['identifier', 'shortDescription']
                }
            ]
        },
        Building: {
            fields: {},
            groups: [
                {
                    name: Groups.STEM,
                    fields: ['identifier', 'shortDescription']
                }
            ],
            parent: 'Operation'
        },
        Survey: {
            fields: {},
            groups: [
                {
                    name: Groups.STEM,
                    fields: ['identifier', 'shortDescription']
                }
            ],
            parent: 'Operation'
        },
        Trench: {
            fields: {},
            groups: [
                {
                    name: Groups.STEM,
                    fields: ['identifier', 'shortDescription']
                }
            ],
            parent: 'Operation'
        },
        Place: {
            fields: {
                gazId: {
                    inputType: FieldDefinition.InputType.UNSIGNEDINT
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
                }
            ],
        },
        Inscription: {
            fields: {},
            groups: [
                {
                    name: Groups.STEM,
                    fields: ['identifier', 'shortDescription']
                }
            ],
            mustLieWithin: true
        },
        // Room is an idealized (non material) entity
        Room: {
            supercategory: true,
            userDefinedSubcategoriesAllowed: true,
            fields: {},
            groups: [
                {
                    name: Groups.STEM,
                    fields: ['identifier', 'shortDescription']
                }
            ]
        },
        // An idealized (non material) entity, must be created within a Room
        RoomWall: {
            fields: {},
            groups: [
                {
                    name: Groups.STEM,
                    fields: ['identifier', 'shortDescription']
                }
            ],
            mustLieWithin: true
        },
        // An idealized (non material) entity, must be created within a Room
        RoomFloor: {
            fields: {},
            groups: [
                {
                    name: Groups.STEM,
                    fields: ['identifier', 'shortDescription']
                }
            ],
            mustLieWithin: true
        },
        // An idealized (non material) entity, must be created within a Room
        RoomCeiling: {
            fields: {},
            groups: [
                {
                    name: Groups.STEM,
                    fields: ['identifier', 'shortDescription']
                }
            ],
            mustLieWithin: true
        },
        // The material counterpart to Room, RoomCeiling, RoomWall, RoomFloor
        BuildingPart: {
            supercategory: true,
            userDefinedSubcategoriesAllowed: true,
            fields: {},
            groups: [
                {
                    name: Groups.STEM,
                    fields: ['identifier', 'shortDescription']
                }
            ]
        },
        Area: {
            supercategory: true,
            userDefinedSubcategoriesAllowed: true,
            fields: {},
            groups: [
                {
                    name: Groups.STEM,
                    fields: ['identifier', 'shortDescription']
                }
            ]
        },
        Feature: {
            supercategory: true,
            userDefinedSubcategoriesAllowed: true,
            fields: {
                period: {
                    inputType: FieldDefinition.InputType.DROPDOWNRANGE,
                },
                dating: {
                    inputType: FieldDefinition.InputType.DATING,
                }
            },
            groups: [
                {
                    name: Groups.STEM,
                    fields: ['identifier', 'shortDescription']
                },
                {
                    name: Groups.TIME,
                    fields: ['period', 'dating']
                }
            ]
        },
        Find: {
            supercategory: true,
            userDefinedSubcategoriesAllowed: true,
            fields: {
                instanceOf: {
                    inputType: 'instanceOf',
                }
            },
            groups: [
                {
                    name: Groups.STEM,
                    fields: ['identifier', 'shortDescription']
                },
                {
                    name: Groups.IDENTIFICATION,
                    fields: ['instanceOf']
                }
            ]
        },
        Sample: {
            mustLieWithin: true,
            fields: {},
            groups: [
                {
                    name: Groups.STEM,
                    fields: ['identifier', 'shortDescription']
                }
            ]
        },
        TypeCatalog: {
            supercategory: true,
            fields: {
                criterion: {
                    inputType: FieldDefinition.InputType.DROPDOWN,
                    constraintIndexed: true,
                }
            },
            groups: [
                {
                    name: Groups.STEM,
                    fields: ['identifier', 'shortDescription']
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
            fields: {},
            groups: [
                {
                    name: Groups.STEM,
                    fields: ['identifier', 'shortDescription']
                }
            ]
        },
        Image: {
            supercategory: true,
            userDefinedSubcategoriesAllowed: true,
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
                    fields: ['identifier', 'shortDescription']
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
            visible: false,
            editable: false,
            source: 'builtin'
        } as FieldDefinition,
        shortDescription: {
            visible: true,
            editable: true,
        } as FieldDefinition,
        identifier: {
            visible: false,
            editable: true,
            mandatory: true,
        } as FieldDefinition
    };


    public builtInRelations: Array<RelationDefinition> = [
        {
            name: 'depicts',
            domain: ['Image:inherit'],
            range: [],
            inverse: 'isDepictedIn'
        },
        {
            name: 'isDepictedIn',
            domain: [],
            range: ['Image:inherit'],
            inverse: 'depicts'
        },
        {
            name: 'hasMapLayer',
            inverse: 'isMapLayerOf',
            domain: [],
            range: ['Image:inherit']
        },
        {
            name: 'isMapLayerOf',
            inverse: 'hasMapLayer',
            domain: ['Image:inherit'],
            range: []
        },
        {
            name: 'isAfter',
            inverse: 'isBefore',
            domain: ['Feature:inherit'],
            range: ['Feature:inherit'],
            sameMainCategoryResource: true
        },
        {
            name: 'isBefore',
            inverse: 'isAfter',
            domain: ['Feature:inherit'],
            range: ['Feature:inherit'],
            sameMainCategoryResource: true
        },
        {
            name: 'isEquivalentTo',
            inverse: 'isEquivalentTo',
            domain: ['Feature:inherit'],
            range: ['Feature:inherit'],
            sameMainCategoryResource: true
        },
        {
            name: 'isContemporaryWith',
            inverse: 'isContemporaryWith',
            domain: ['Feature:inherit'],
            range: ['Feature:inherit'],
            sameMainCategoryResource: true
        },
        {
            name: 'isAbove',
            inverse: 'isBelow',
            domain: ['Feature:inherit'],
            range: ['Feature:inherit'],
            sameMainCategoryResource: true
        },
        {
            name: 'isBelow',
            inverse: 'isAbove',
            domain: ['Feature:inherit'],
            range: ['Feature:inherit'],
            sameMainCategoryResource: true
        },
        {
            name: 'cuts',
            inverse: 'isCutBy',
            domain: ['Feature:inherit'],
            range: ['Feature:inherit'],
            sameMainCategoryResource: true
        },
        {
            name: 'isCutBy',
            inverse: 'cuts',
            domain: ['Feature:inherit'],
            range: ['Feature:inherit'],
            sameMainCategoryResource: true
        },
        {
            name: 'borders',
            inverse: 'borders',
            domain: ['Feature:inherit'],
            range: ['Feature:inherit'],
            sameMainCategoryResource: true
        },
        {
            name: 'borders',
            inverse: 'borders',
            domain: ['BuildingPart:inherit'],
            range: ['BuildingPart:inherit'],
            sameMainCategoryResource: true
        },
        {
            name: 'isRecordedIn',
            domain: ['Inscription'],
            range: ['Trench']
        },
        {
            name: 'isRecordedIn',
            domain: ['Room'],
            range: ['Building']
        },
        {
            name: 'isRecordedIn',
            domain: ['RoomFloor'],
            range: ['Building']
        },
        {
            name: 'isRecordedIn',
            domain: ['RoomWall'],
            range: ['Building']
        },
        {
            name: 'isRecordedIn',
            domain: ['RoomCeiling'],
            range: ['Building']
        },
        {
            name: 'isRecordedIn',
            domain: ['Area:inherit'],
            range: ['Survey']
        },
        {
            name: 'isRecordedIn',
            domain: ['BuildingPart:inherit'],
            range: ['Building', 'Survey']
        },
        {
            name: 'isRecordedIn',
            domain: ['Find:inherit'],
            range: ['Trench', 'Survey']
        },
        {
            name: 'isRecordedIn',
            domain: ['Feature:inherit'],
            range: ['Trench']
        },
        {
            name: 'isRecordedIn',
            domain: ['Sample'],
            range: ['Trench', 'Survey']
        },
        {
            name: 'liesWithin',
            domain: ['Operation:inherit', 'Place'],
            range: ['Place']
        },
        {
            name: 'liesWithin',
            domain: ['Find:inherit'],
            range: ['Feature:inherit', 'Area:inherit'],
            sameMainCategoryResource: true
        },
        {
            name: 'liesWithin',
            domain: ['Inscription'],
            range: ['Find:inherit'],
            sameMainCategoryResource: true
        },
        {
            name: 'liesWithin',
            domain: ['Feature:inherit'],
            range: ['Feature:inherit'],
            sameMainCategoryResource: true
        },
        {
            name: 'liesWithin',
            domain: ['Sample'],
            range: ['Feature:inherit', 'Find:inherit'],
            sameMainCategoryResource: true
        },
        {
            name: 'liesWithin',
            domain: ['BuildingPart:inherit'],
            range: ['BuildingPart:inherit', 'Area:inherit'],
            sameMainCategoryResource: true
        },
        {
            name: 'liesWithin',
            domain: ['Area:inherit'],
            range: ['Area:inherit'],
            sameMainCategoryResource: true
        },
        {
            name: 'liesWithin',
            domain: ['RoomFloor'],
            range: ['Room'],
            sameMainCategoryResource: true
        },
        {
            name: 'liesWithin',
            domain: ['RoomWall'],
            range: ['Room'],
            sameMainCategoryResource: true
        },
        {
            name: 'liesWithin',
            domain: ['RoomCeiling'],
            range: ['Room'],
            sameMainCategoryResource: true
        },
        {
            name: 'liesWithin',
            domain: ['Type:inherit'],
            range: ['Type:inherit', 'TypeCatalog:inherit']
        },
        {
            name: 'isInstanceOf',
            inverse: 'hasInstance',
            domain: ['Find:inherit'],
            range: ['Type:inherit']
        },
        {
            name: 'hasInstance',
            inverse: 'isInstanceOf',
            domain: ['Type:inherit'],
            range: ['Find:inherit']
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
                fields: {},
                groups: [
                    {
                        name: Groups.STEM,
                        fields: ['identifier', 'shortDescription']
                    }
                ]
            };
        }

        if (customConfigurationName === 'Meninx' || customConfigurationName === 'Bourgou') {

            (this.builtInCategories as any)['Wall_surface'] = {
                color: '#ffff99',
                fields: {},
                groups: [
                    {
                        name: Groups.STEM,
                        fields: ['identifier', 'shortDescription']
                    }
                ]
            };
            (this.builtInCategories as any)['Drilling'] = {
                color: '#08519c',
                fields: {},
                groups: [
                    {
                        name: Groups.STEM,
                        fields: ['identifier', 'shortDescription']
                    }
                ]
            };
            this.builtInRelations.push({
                name: 'isRecordedIn',
                domain: ['Wall_surface'],
                range: ['Trench']
            });
            this.builtInRelations.push({
                name: 'isRecordedIn',
                domain: ['Drilling'],
                range: ['Survey']
            });
        }

        if (customConfigurationName === 'Pergamon') {

            (this.builtInCategories as any)['ProcessUnit'] = {
                supercategory: true,
                userDefinedSubcategoriesAllowed: true,
                abstract: true,
                color: '#08306b',
                fields: {},
                groups: [
                    {
                        name: Groups.STEM,
                        fields: ['identifier', 'shortDescription']
                    }
                ]
            };
            (this.builtInCategories as any)['Profile'] = {
                color: '#c6dbef',
                parent: 'ProcessUnit',
                fields: {},
                groups: [
                    {
                        name: Groups.STEM,
                        fields: ['identifier', 'shortDescription']
                    }
                ]
            };
            (this.builtInCategories as any)['BuildingFloor'] = {
                color: '#6600cc',
                fields: {},
                groups: [
                    {
                        name: Groups.STEM,
                        fields: ['identifier', 'shortDescription']
                    }
                ]
            };
            (this.builtInCategories as any)['SurveyBurial'] = {
                color: '#45ff95',
                fields: {},
                groups: [
                    {
                        name: Groups.STEM,
                        fields: ['identifier', 'shortDescription']
                    }
                ]
            };

            this.builtInRelations.push({
                name: 'isRecordedIn',
                domain: ['ProcessUnit'],
                range: ['Trench']
            });

            this.builtInRelations.push({
                name: 'isRecordedIn',
                domain: ['BuildingFloor'],
                range: ['Building']
            });

            this.builtInRelations.push({
                name: 'isRecordedIn',
                domain: ['SurveyBurial'],
                range: ['Survey']
            });

            this.builtInRelations.push({
                name: 'liesWithin',
                domain: ['SurveyBurial'],
                range: ['Area:inherit'],
                sameMainCategoryResource: true
            });

            this.builtInRelations.push({
                name: 'borders',
                inverse: 'borders',
                domain: ['BuildingFloor'],
                range: ['BuildingPart:inherit'],
                sameMainCategoryResource: true
            });

            this.builtInRelations.push({ // override existing definition
                name: 'borders',
                inverse: 'borders',
                domain: ['BuildingPart:inherit'],
                range: ['BuildingPart:inherit', 'BuildingFloor'],
                sameMainCategoryResource: true
            });
        }

        if (customConfigurationName === 'Milet') {
            
            (this.builtInCategories as any)['Quantification'] = {
                color: '#c6dbef',
                supercategory: true,
                userDefinedSubcategoriesAllowed: true,
                abstract: false,
                fields: {},
                groups: [
                    {
                        name: Groups.STEM,
                        fields: ['identifier', 'shortDescription']
                    }
                ]
            };

            (this.builtInCategories as any)['Building'] = {
                userDefinedSubcategoriesAllowed: true,
                parent: 'Operation',
                fields: {
                    gazId: {
                        inputType: FieldDefinition.InputType.UNSIGNEDINT,
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
                    }
                ]
            };

            (this.builtInCategories as any)['Find'] = {
                supercategory: true,
                userDefinedSubcategoriesAllowed: true,
                fields: {
                    instanceOf: {
                        inputType: 'instanceOf',
                    },
                    diameterPercentage: {
                        inputType: FieldDefinition.InputType.UNSIGNEDFLOAT,
                    },
                },
                groups: [
                    {
                        name: Groups.STEM,
                        fields: ['identifier', 'shortDescription']
                    },
                    {
                        name: Groups.IDENTIFICATION,
                        fields: ['instanceOf']
                    },
                    {
                        name: Groups.DIMENSION,
                        fields: ['diameterPercentage']
                    }
                ]
            };

            (this.builtInCategories as any)['Impression'] = {
                supercategory: false,
                userDefinedSubcategoriesAllowed: false,
                fields: {},
                groups: [
                    {
                        name: Groups.STEM,
                        fields: ['identifier', 'shortDescription']
                    }
                ]
            };

            this.builtInRelations.push({
                name: 'isRecordedIn',
                domain: ['Quantification:inherit', 'Impression'],
                range: ['Trench:inherit']
            });

            this.builtInRelations.push({
                name: 'liesWithin',
                domain: ['Find:inherit'],
                range: ['Feature:inherit', 'Area:inherit', 'Quantification:inherit']
            });

            this.builtInRelations.push({
                name: 'liesWithin',
                domain: ['Impression'],
                range: ['Feature:inherit']
            });

            this.builtInRelations.push({
                name: 'liesWithin',
                domain: ['Quantification:inherit'],
                range: ['Feature:inherit', 'Quantification:inherit']
            });
         
            this.builtInRelations.push({
                name: 'fills',
                inverse: 'isFilledBy',
                domain: ['Feature:inherit'],
                range: ['Feature:inherit'],
                sameMainCategoryResource: true
            });

            this.builtInRelations.push({
                name: 'isFilledBy',
                inverse: 'fills',
                domain: ['Feature:inherit'],
                range: ['Feature:inherit'],
                sameMainCategoryResource: true
            });

            this.builtInRelations.push({
                name: 'wasFoundIn',
                inverse: 'hasFinds',
                domain: ['Find:inherit'],
                range: ['Building', 'Place', 'Survey', 'Trench']
            });
            
            this.builtInRelations.push({
                name: 'hasFinds',
                inverse: 'wasFoundIn',
                domain: ['Building', 'Place', 'Survey', 'Trench'],
                range: ['Find:inherit']
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
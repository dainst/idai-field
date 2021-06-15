import { ConfigurationDocument, FieldDefinition, Groups, RelationDefinition } from '../model';
import { ConfigLoader } from './boot/config-loader';
import { BuiltinCategoryDefinition } from './model/builtin-category-definition';
import { ProjectConfiguration } from './project-configuration';


export const COMMON_FIELDS = {
    period: {
        inputType: FieldDefinition.InputType.DROPDOWNRANGE,
        group: Groups.TIME
    },
    dating: {
        inputType: FieldDefinition.InputType.DATING,
        group: Groups.TIME
    },
    diary: {
        inputType: FieldDefinition.InputType.INPUT,
        group: Groups.STEM
    },
    area: {
        inputType: FieldDefinition.InputType.UNSIGNEDFLOAT,
        group: Groups.DIMENSION
    },
    dimensionLength: {
        inputType: FieldDefinition.InputType.DIMENSION,
        group: Groups.DIMENSION,
        positionValuelistId: 'position-values-expansion-default'
    },
    dimensionWidth: {
        inputType: FieldDefinition.InputType.DIMENSION,
        group: Groups.DIMENSION,
        positionValuelistId: 'position-values-expansion-default'
    },
    dimensionHeight: {
        inputType: FieldDefinition.InputType.DIMENSION,
        group: Groups.DIMENSION,
        positionValuelistId: 'position-values-expansion-default'
    },
    dimensionDiameter: {
        inputType: FieldDefinition.InputType.DIMENSION,
        group: Groups.DIMENSION,
        positionValuelistId: 'position-values-expansion-default'
    },
    dimensionPerimeter: {
        inputType: FieldDefinition.InputType.DIMENSION,
        group: Groups.DIMENSION,
        positionValuelistId: 'position-values-expansion-default'
    },
    dimensionThickness: {
        inputType: FieldDefinition.InputType.DIMENSION,
        group: Groups.DIMENSION,
        positionValuelistId: 'position-values-expansion-default'
    },
    dimensionVerticalExtent: {
        inputType: FieldDefinition.InputType.DIMENSION,
        inputTypeOptions: { validation: { permissive: true }},
        group: Groups.POSITION,
        positionValuelistId: 'position-values-edge-default'
    },
    dimensionOther: {
        inputType: FieldDefinition.InputType.DIMENSION,
        group: Groups.DIMENSION,
        positionValuelistId: 'position-values-expansion-default'
    },
    beginningDate: {
        inputType: FieldDefinition.InputType.DATE,
        group: Groups.STEM
    },
    endDate: {
        inputType: FieldDefinition.InputType.DATE,
        group: Groups.STEM
    },
    supervisor: {
        inputType: FieldDefinition.InputType.CHECKBOXES,
        valuelistFromProjectField: 'staff',
        group: Groups.STEM
    },
    processor: {
        inputType: FieldDefinition.InputType.CHECKBOXES,
        valuelistFromProjectField: 'staff',
        group: Groups.STEM
    },
    campaign: {
        inputType: FieldDefinition.InputType.CHECKBOXES,
        valuelistFromProjectField: 'campaigns',
        allowOnlyValuesOfParent: true,
        group: Groups.STEM
    },
    draughtsmen: {
        inputType: FieldDefinition.InputType.CHECKBOXES,
        valuelistFromProjectField: 'staff',
        group: Groups.STEM
    },
    description: {
        inputType: FieldDefinition.InputType.TEXT
    },
    date: {
        inputType: FieldDefinition.InputType.DATE,
        group: Groups.STEM
    },
    spatialLocation: {
        inputType: FieldDefinition.InputType.INPUT,
        group: Groups.POSITION
    },
    provenance: {
        inputType: FieldDefinition.InputType.DROPDOWN,
    },
    orientation: {
        inputType: FieldDefinition.InputType.DROPDOWN,
        group: Groups.POSITION
    },
    literature: {
        inputType: FieldDefinition.InputType.LITERATURE
    }
};


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class AppConfigurator {

    private builtinCategories: any = {
        Project: {
            fields: {
                identifier: {
                    inputType: FieldDefinition.InputType.INPUT,
                    editable: false
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
            }
        } as BuiltinCategoryDefinition,
        Operation: {
            supercategory: true,
            abstract: true,
            fields: {}
        },
        Building: {
            fields: {},
            parent: 'Operation'
        },
        Survey: {
            fields: {},
            parent: 'Operation'
        },
        Trench: {
            fields: {},
            parent: 'Operation'
        },
        Place: {
            fields: {
                gazId: {
                    inputType: FieldDefinition.InputType.UNSIGNEDINT
                }
            }
        },
        Inscription: {
            fields: {},
            mustLieWithin: true
        },
        // Room is an idealized (non material) entity
        Room: {
            supercategory: true,
            userDefinedSubcategoriesAllowed: true,
            fields: {}
        },
        // An idealized (non material) entity, must be created within a Room
        RoomWall: {
            fields: {},
            mustLieWithin: true
        },
        // An idealized (non material) entity, must be created within a Room
        RoomFloor: {
            fields: {},
            mustLieWithin: true
        },
        // An idealized (non material) entity, must be created within a Room
        RoomCeiling: {
            fields: {},
            mustLieWithin: true
        },
        // The material counterpart to Room, RoomCeiling, RoomWall, RoomFloor
        BuildingPart: {
            supercategory: true,
            userDefinedSubcategoriesAllowed: true,
            fields: {}
        },
        Area: {
            supercategory: true,
            userDefinedSubcategoriesAllowed: true,
            fields: {}
        },
        Feature: {
            supercategory: true,
            userDefinedSubcategoriesAllowed: true,
            fields: {
                period: {
                    inputType: FieldDefinition.InputType.DROPDOWNRANGE,
                    group: Groups.TIME
                },
                dating: {
                    inputType: FieldDefinition.InputType.DATING,
                    group: Groups.TIME
                }
            }
        },
        Find: {
            supercategory: true,
            userDefinedSubcategoriesAllowed: true,
            fields: {
                instanceOf: {
                    inputType: 'instanceOf',
                    group: Groups.IDENTIFICATION
                }
            }
        },
        Sample: {
            mustLieWithin: true,
            fields: {}
        },
        TypeCatalog: {
            supercategory: true,
            fields: {
                criterion: {
                    inputType: FieldDefinition.InputType.DROPDOWN,
                    constraintIndexed: true,
                    group: Groups.IDENTIFICATION
                }
            }
        },
        Type: {
            supercategory: true,
            mustLieWithin: true,
            fields: {}
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
            }
        } as BuiltinCategoryDefinition,
    };

    private defaultFields = {
        id: {
            editable: false,
            visible: false,
            group: Groups.STEM,
            source: 'builtin'
        } as FieldDefinition,
        category: {
            visible: false,
            editable: false,
            group: Groups.STEM,
            source: 'builtin'
        } as FieldDefinition,
        shortDescription: {
            visible: false,
            editable: true,
            group: Groups.STEM
        } as FieldDefinition,
        identifier: {
            visible: false,
            editable: true,
            mandatory: true,
            group: Groups.STEM
        } as FieldDefinition
    };


    private defaultRelations: Array<RelationDefinition> = [
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


    constructor(private configLoader: ConfigLoader) {}


    public async go(username: string, customConfigurationName: string|undefined,
                    customConfigurationDocument?: ConfigurationDocument): Promise<ProjectConfiguration> {

        this.addProjectSpecificBuiltinConfiguration(customConfigurationName);

        return this.configLoader.go(
            COMMON_FIELDS,
            this.builtinCategories,
            this.defaultRelations,
            this.defaultFields,
            username,
            customConfigurationName,
            customConfigurationDocument
        );
    }

    
    private addProjectSpecificBuiltinConfiguration(customConfigurationName: string) {

        if (customConfigurationName === 'Meninx' || customConfigurationName === 'Pergamon'
                || customConfigurationName === 'Bourgou') {

            (this.builtinCategories as any)['Other'] = {
                color: '#CC6600',
                parent: 'Feature',
                fields: {}
            };
        }

        if (customConfigurationName === 'Meninx' || customConfigurationName === 'Bourgou') {

            (this.builtinCategories as any)['Wall_surface'] = {
                color: '#ffff99',
                fields: {}
            };
            (this.builtinCategories as any)['Drilling'] = {
                color: '#08519c',
                fields: {}
            };
            this.defaultRelations.push({
                name: 'isRecordedIn',
                domain: ['Wall_surface'],
                range: ['Trench']
            });
            this.defaultRelations.push({
                name: 'isRecordedIn',
                domain: ['Drilling'],
                range: ['Survey']
            });
        }

        if (customConfigurationName === 'Pergamon') {

            (this.builtinCategories as any)['ProcessUnit'] = {
                supercategory: true,
                userDefinedSubcategoriesAllowed: true,
                abstract: true,
                color: '#08306b',
                fields: {}
            };
            (this.builtinCategories as any)['Profile'] = {
                color: '#c6dbef',
                parent: 'ProcessUnit',
                fields: {}
            };
            (this.builtinCategories as any)['BuildingFloor'] = {
                color: '#6600cc',
                fields: {}
            };
            (this.builtinCategories as any)['SurveyBurial'] = {
                color: '#45ff95',
                fields: {}
            };

            this.defaultRelations.push({
                name: 'isRecordedIn',
                domain: ['ProcessUnit'],
                range: ['Trench']
            });

            this.defaultRelations.push({
                name: 'isRecordedIn',
                domain: ['BuildingFloor'],
                range: ['Building']
            });

            this.defaultRelations.push({
                name: 'isRecordedIn',
                domain: ['SurveyBurial'],
                range: ['Survey']
            });

            this.defaultRelations.push({
                name: 'liesWithin',
                domain: ['SurveyBurial'],
                range: ['Area:inherit'],
                sameMainCategoryResource: true
            });

            this.defaultRelations.push({
                name: 'borders',
                inverse: 'borders',
                domain: ['BuildingFloor'],
                range: ['BuildingPart:inherit'],
                sameMainCategoryResource: true
            });

            this.defaultRelations.push({ // override existing definition
                name: 'borders',
                inverse: 'borders',
                domain: ['BuildingPart:inherit'],
                range: ['BuildingPart:inherit', 'BuildingFloor'],
                sameMainCategoryResource: true
            });
        }

        if (customConfigurationName === 'Milet') {
            
            (this.builtinCategories as any)['Quantification'] = {
                color: '#c6dbef',
                supercategory: true,
                userDefinedSubcategoriesAllowed: true,
                abstract: false,
                fields: {}
            };

            (this.builtinCategories as any)['Building'] = {
                userDefinedSubcategoriesAllowed: true,
                parent: 'Operation',
                fields: {
                    gazId: {
                    inputType: FieldDefinition.InputType.UNSIGNEDINT,
                    group: Groups.POSITION
                    }
                }
            };

            (this.builtinCategories as any)['Find'] = {
                supercategory: true,
                userDefinedSubcategoriesAllowed: true,
                fields: {
                    instanceOf: {
                        inputType: 'instanceOf',
                        group: Groups.IDENTIFICATION
                    },
                    diameterPercentage: {
                        inputType: FieldDefinition.InputType.UNSIGNEDFLOAT,
                        group: Groups.DIMENSION
                    },
                }
            };

            (this.builtinCategories as any)['Impression'] = {
                supercategory: false,
                userDefinedSubcategoriesAllowed: false,
                fields: {}
            };

            this.defaultRelations.push({
                name: 'isRecordedIn',
                domain: ['Quantification:inherit', 'Impression'],
                range: ['Trench:inherit']
            });

            this.defaultRelations.push({
                name: 'liesWithin',
                domain: ['Find:inherit'],
                range: ['Feature:inherit', 'Area:inherit', 'Quantification:inherit']
            });

            this.defaultRelations.push({
                name: 'liesWithin',
                domain: ['Impression'],
                range: ['Feature:inherit']
            });

            this.defaultRelations.push({
                name: 'liesWithin',
                domain: ['Quantification:inherit'],
                range: ['Feature:inherit', 'Quantification:inherit']
            });
         
            this.defaultRelations.push({
                name: 'fills',
                inverse: 'isFilledBy',
                domain: ['Feature:inherit'],
                range: ['Feature:inherit'],
                sameMainCategoryResource: true
            });

            this.defaultRelations.push({
                name: 'isFilledBy',
                inverse: 'fills',
                domain: ['Feature:inherit'],
                range: ['Feature:inherit'],
                sameMainCategoryResource: true
            });

            this.defaultRelations.push({
                name: 'wasFoundIn',
                inverse: 'hasFinds',
                domain: ['Find:inherit'],
                range: ['Building', 'Place', 'Survey', 'Trench']
            });
            
            this.defaultRelations.push({
                name: 'hasFinds',
                inverse: 'wasFoundIn',
                domain: ['Building', 'Place', 'Survey', 'Trench'],
                range: ['Find:inherit']
            });

            (this.defaultFields as any)['datingAddenda'] = {
                visible: true,
                editable: true,
                mandatory: false,
                inputType: 'text',
                group: Groups.TIME
            };

            (this.defaultFields as any)['notes'] = {
                visible: true,
                editable: true,
                mandatory: false,
                inputType: 'text',
                group: Groups.STEM
            };
        }
    }
}

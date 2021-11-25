import {Injectable} from '@angular/core';
import {ConfigLoader} from './boot/config-loader';
import {ProjectConfiguration} from './project-configuration';
import {FieldDefinition, RelationDefinition, Groups, Relations} from 'idai-field-core';
import {BuiltinCategoryDefinition} from './model/builtin-category-definition';


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


@Injectable()
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
        CrossSection: {
            supercategory: true,
            abstract: true,
            fields: {}
        },
        Profile: {
            fields: {},
            parent: 'CrossSection'
        },
        Planum: {
            fields: {},
            parent: 'CrossSection'
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
            inverse: 'isDepictedIn',
            label: ''
        },
        {
            name: 'isDepictedIn',
            domain: [],
            range: ['Image:inherit'],
            inverse: 'depicts',
            label: ''
        },
        {
            name: 'hasMapLayer',
            inverse: 'isMapLayerOf',
            domain: ['Operation:inherit'],
            range: ['Image:inherit'],
            label: ''
        },
        {
            name: 'isMapLayerOf',
            inverse: 'hasMapLayer',
            domain: ['Image:inherit'],
            range: ['Operation:inherit'],
            label: ''
        },
        {
            name: 'isAfter',
            inverse: 'isBefore',
            label: '',
            domain: ['Feature:inherit'],
            range: ['Feature:inherit'],
            sameMainCategoryResource: true
        },
        {
            name: 'isBefore',
            inverse: 'isAfter',
            label: '',
            domain: ['Feature:inherit'],
            range: ['Feature:inherit'],
            sameMainCategoryResource: true
        },
        {
            name: Relations.SAME_AS,
            inverse: Relations.SAME_AS,
            label: '',
            domain: ['Feature:inherit'],
            range: ['Feature:inherit']
        },
        {
            name: Relations.SAME_AS,
            inverse: Relations.SAME_AS,
            label: '',
            domain: ['Find:inherit'],
            range: ['Find:inherit']
        },
        {
            name: Relations.IS_PRESENT_IN,
            label: '',
            domain: ['Feature:inherit'],
            range: ['CrossSection:inherit'],
            sameMainCategoryResource: true
        },
        {
            name: 'isContemporaryWith',
            inverse: 'isContemporaryWith',
            label: '',
            domain: ['Feature:inherit'],
            range: ['Feature:inherit'],
            sameMainCategoryResource: true
        },
        {
            name: 'isAbove',
            inverse: 'isBelow',
            label: '',
            domain: ['Feature:inherit'],
            range: ['Feature:inherit'],
            sameMainCategoryResource: true
        },
        {
            name: 'isBelow',
            inverse: 'isAbove',
            label: '',
            domain: ['Feature:inherit'],
            range: ['Feature:inherit'],
            sameMainCategoryResource: true
        },
        {
            name: 'cuts',
            inverse: 'isCutBy',
            label: '',
            domain: ['Feature:inherit'],
            range: ['Feature:inherit'],
            sameMainCategoryResource: true
        },
        {
            name: 'isCutBy',
            inverse: 'cuts',
            label: '',
            domain: ['Feature:inherit'],
            range: ['Feature:inherit'],
            sameMainCategoryResource: true
        },
        {
            name: 'borders',
            inverse: 'borders',
            label: '',
            domain: ['Feature:inherit'],
            range: ['Feature:inherit'],
            sameMainCategoryResource: true
        },
        {
            name: 'borders',
            inverse: 'borders',
            label: '',
            domain: ['BuildingPart:inherit'],
            range: ['BuildingPart:inherit'],
            sameMainCategoryResource: true
        },
        {
            name: 'isRecordedIn',
            label: '',
            domain: ['CrossSection', 'Profile', 'Planum'],
            range: ['Trench']
        },
        {
            name: 'isRecordedIn',
            label: '',
            domain: ['Inscription'],
            range: ['Trench']
        },
        {
            name: 'isRecordedIn',
            label: '',
            domain: ['Room'],
            range: ['Building']
        },
        {
            name: 'isRecordedIn',
            label: '',
            domain: ['RoomFloor'],
            range: ['Building']
        },
        {
            name: 'isRecordedIn',
            label: '',
            domain: ['RoomWall'],
            range: ['Building']
        },
        {
            name: 'isRecordedIn',
            label: '',
            domain: ['RoomCeiling'],
            range: ['Building']
        },
        {
            name: 'isRecordedIn',
            label: '',
            domain: ['Area:inherit'],
            range: ['Survey']
        },
        {
            name: 'isRecordedIn',
            label: '',
            domain: ['BuildingPart:inherit'],
            range: ['Building', 'Survey']
        },
        {
            name: 'isRecordedIn',
            label: '',
            domain: ['Find:inherit'],
            range: ['Trench', 'Building', 'Survey']
        },
        {
            name: 'isRecordedIn',
            label: '',
            domain: ['Feature:inherit'],
            range: ['Trench']
        },
        {
            name: 'isRecordedIn',
            label: '',
            domain: ['Sample'],
            range: ['Trench', 'Survey']
        },
        {
            name: 'liesWithin',
            label: '',
            domain: ['Operation:inherit', 'Place'],
            range: ['Place']
        },
        {
            name: 'liesWithin',
            label: '',
            domain: ['Find:inherit'],
            range: ['Feature:inherit', 'Area:inherit', 'Room'],
            sameMainCategoryResource: true
        },
        {
            name: 'liesWithin',
            label: '',
            domain: ['Inscription'],
            range: ['Find:inherit'],
            sameMainCategoryResource: true
        },
        {
            name: 'liesWithin',
            label: '',
            domain: ['Feature:inherit'],
            range: ['Feature:inherit'],
            sameMainCategoryResource: true
        },
        {
            name: 'liesWithin',
            label: '',
            domain: ['Sample'],
            range: ['Feature:inherit', 'Find:inherit'],
            sameMainCategoryResource: true
        },
        {
            name: 'liesWithin',
            label: '',
            domain: ['BuildingPart:inherit'],
            range: ['BuildingPart:inherit', 'Area:inherit'],
            sameMainCategoryResource: true
        },
        {
            name: 'liesWithin',
            label: '',
            domain: ['Area:inherit'],
            range: ['Area:inherit'],
            sameMainCategoryResource: true
        },
        {
            name: 'liesWithin',
            label: '',
            domain: ['RoomFloor'],
            range: ['Room'],
            sameMainCategoryResource: true
        },
        {
            name: 'liesWithin',
            label: '',
            domain: ['RoomWall'],
            range: ['Room'],
            sameMainCategoryResource: true
        },
        {
            name: 'liesWithin',
            label: '',
            domain: ['RoomCeiling'],
            range: ['Room'],
            sameMainCategoryResource: true
        },
        {
            name: 'liesWithin',
            label: '',
            domain: ['Type:inherit'],
            range: ['Type:inherit', 'TypeCatalog:inherit']
        },
        {
            name: 'isInstanceOf',
            inverse: 'hasInstance',
            label: '',
            domain: ['Find:inherit'],
            range: ['Type:inherit']
        },
        {
            name: 'hasInstance',
            inverse: 'isInstanceOf',
            label: '',
            domain: ['Type:inherit'],
            range: ['Find:inherit']
        }
    ];


    constructor(private configLoader: ConfigLoader) {}


    public go(configDirPath: string, customConfigurationName: string|undefined,
              languages: string[]): ProjectConfiguration {

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
                label: '',
                domain: ['Wall_surface'],
                range: ['Trench']
            });
            this.defaultRelations.push({
                name: 'isRecordedIn',
                label: '',
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
                label: '',
                domain: ['ProcessUnit'],
                range: ['Trench']
            });

            this.defaultRelations.push({
                name: 'isRecordedIn',
                label: '',
                domain: ['BuildingFloor'],
                range: ['Building']
            });

            this.defaultRelations.push({
                name: 'isRecordedIn',
                label: '',
                domain: ['SurveyBurial'],
                range: ['Survey']
            });

            this.defaultRelations.push({
                name: 'liesWithin',
                label: '',
                domain: ['SurveyBurial'],
                range: ['Area:inherit'],
                sameMainCategoryResource: true
            });

            this.defaultRelations.push({
                name: 'borders',
                inverse: 'borders',
                label: '',
                domain: ['BuildingFloor'],
                range: ['BuildingPart:inherit'],
                sameMainCategoryResource: true
            });

            this.defaultRelations.push({ // override existing definition
                name: 'borders',
                inverse: 'borders',
                label: '',
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
                label: '',
                domain: ['Quantification:inherit', 'Impression'],
                range: ['Trench:inherit']
            });

            this.defaultRelations.push({
                name: 'liesWithin',
                label: '',
                domain: ['Find:inherit'],
                range: ['Feature:inherit', 'Area:inherit', 'Quantification:inherit']
            });

            this.defaultRelations.push({
                name: 'liesWithin',
                label: '',
                domain: ['Impression'],
                range: ['Feature:inherit']
            });

            this.defaultRelations.push({
                name: 'liesWithin',
                label: '',
                domain: ['Quantification:inherit'],
                range: ['Feature:inherit', 'Quantification:inherit']
            });

            this.defaultRelations.push({
                name: 'fills',
                inverse: 'isFilledBy',
                label: '',
                domain: ['Feature:inherit'],
                range: ['Feature:inherit'],
                sameMainCategoryResource: true
            });

            this.defaultRelations.push({
                name: 'isFilledBy',
                inverse: 'fills',
                label: '',
                domain: ['Feature:inherit'],
                range: ['Feature:inherit'],
                sameMainCategoryResource: true
            });

            this.defaultRelations.push({
                name: 'wasFoundIn',
                inverse: 'hasFinds',
                label: '',
                domain: ['Find:inherit'],
                range: ['Building', 'Place', 'Survey', 'Trench']
            });

            this.defaultRelations.push({
                name: 'hasFinds',
                inverse: 'wasFoundIn',
                label: '',
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


        return this.configLoader.go(
            configDirPath,
            COMMON_FIELDS,
            this.builtinCategories,
            this.defaultRelations,
            this.defaultFields,
            customConfigurationName,
            languages
        );
    }
}

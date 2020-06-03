import {Injectable} from '@angular/core';
import {I18n} from '@ngx-translate/i18n-polyfill';
import {ConfigLoader} from './boot/config-loader';
import {ProjectConfiguration} from './project-configuration';
import {FieldDefinition} from './model/field-definition';
import {BuiltinCategoryDefinition} from './model/builtin-category-definition';
import {RelationDefinition} from './model/relation-definition';
import {Groups} from './model/group';


@Injectable()
/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class AppConfigurator {

    private commonFields = {
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
            positionValues: [
                'Maximale Ausdehnung',
                'Minimale Ausdehnung']
        },
        dimensionWidth: {
            inputType: FieldDefinition.InputType.DIMENSION,
            group: Groups.DIMENSION,
            positionValues: [
                'Maximale Ausdehnung',
                'Minimale Ausdehnung']
        },
        dimensionHeight: {
            inputType: 'dimension',
            group: 'dimension',
            positionValues: [
                'Maximale Ausdehnung',
                'Minimale Ausdehnung']
        },
        dimensionDiameter: {
            inputType: FieldDefinition.InputType.DIMENSION,
            group: Groups.DIMENSION,
            positionValues: [
                'Maximale Ausdehnung',
                'Minimale Ausdehnung']
        },
        dimensionPerimeter: {
            inputType: FieldDefinition.InputType.DIMENSION,
            group: Groups.DIMENSION,
            positionValues: [
                'Maximale Ausdehnung',
                'Minimale Ausdehnung']
        },
        dimensionThickness: {
            inputType: FieldDefinition.InputType.DIMENSION,
            group: Groups.DIMENSION,
            positionValues: [
                'Maximale Ausdehnung',
                'Minimale Ausdehnung']
        },
        dimensionVerticalExtent: {
            inputType: FieldDefinition.InputType.DIMENSION,
            group: Groups.POSITION,
            positionValues: [
                'Oberkante',
                'Unterkante']
        },
        dimensionOther: {
            inputType: FieldDefinition.InputType.DIMENSION,
            group: Groups.DIMENSION,
            positionValues: [
                'Maximale Ausdehnung',
                'Minimale Ausdehnung']
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


    private builtinCategories: any = {
        Project: {
            label: this.i18n({ id: 'configuration.project', value: 'Projekt' }),
            fields: {
                identifier: {
                    inputType: FieldDefinition.InputType.INPUT,
                    editable: false
                },
                coordinateReferenceSystem: {
                    label: this.i18n({ id: 'configuration.project.crs', value: 'Koordinatenbezugssystem' }),
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
                    editable: false,
                    label: this.i18n({ id: 'configuration.image.height', value: 'Höhe' })
                },
                width: {
                    inputType: FieldDefinition.InputType.UNSIGNEDINT,
                    editable: false,
                    label: this.i18n({ id: 'configuration.image.width', value: 'Breite' })
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
                    inputType: FieldDefinition.InputType.INPUT, // there is no input type for georeference, really, so we set it simply to 'input'
                    visible: false,
                    editable: false
                }
            }
        } as BuiltinCategoryDefinition,
    };

    private defaultFields = {
        shortDescription: {
            label: this.i18n({ id: 'configuration.defaultFields.shortDescription', value: 'Kurzbeschreibung' }),
            visible: false,
            editable: true,
            group: Groups.STEM
        } as FieldDefinition,
        identifier: {
            description: this.i18n({
                id: 'configuration.defaultFields.identifier.description',
                value: 'Eindeutiger Bezeichner dieser Ressource'
            }),
            label: this.i18n({ id: 'configuration.defaultFields.identifier', value: 'Bezeichner' }),
            visible: false,
            editable: true,
            mandatory: true,
            group: Groups.STEM
        } as FieldDefinition,
        geometry: {
            visible: false,
            editable: false
        } as FieldDefinition
    };


    private defaultRelations: Array<RelationDefinition> = [
        {
            name: 'depicts',
            domain: ['Image:inherit'],
            range: [],
            inverse: 'isDepictedIn',
            label: this.i18n({ id: 'configuration.relations.depicts', value: 'Zeigt' }),
            editable: true
        },
        {
            name: 'isDepictedIn',
            domain: [],
            range: ['Image:inherit'],
            inverse: 'depicts',
            label: this.i18n({ id: 'configuration.relations.isDepictedIn', value: 'Wird gezeigt in' }),
            visible: false,
            editable: false
        },
        {
            name: 'isAfter',
            inverse: 'isBefore',
            label: this.i18n({ id: 'configuration.relations.isAfter', value: 'Zeitlich nach' }),
            domain: ['Feature:inherit'],
            range: ['Feature:inherit'],
            sameMainCategoryResource: true
        },
        {
            name: 'isBefore',
            inverse: 'isAfter',
            label: this.i18n({ id: 'configuration.relations.isBefore', value: 'Zeitlich vor' }),
            domain: ['Feature:inherit'],
            range: ['Feature:inherit'],
            sameMainCategoryResource: true
        },
        {
            name: 'isEquivalentTo',
            inverse: 'isEquivalentTo',
            label: this.i18n({ id: 'configuration.relations.isEquivalentTo', value: 'Gleich wie' }),
            domain: ['Feature:inherit'],
            range: ['Feature:inherit'],
            sameMainCategoryResource: true
        },
        {
            name: 'isContemporaryWith',
            inverse: 'isContemporaryWith',
            label: this.i18n({ id: 'configuration.relations.isContemporaryWith', value: 'Zeitgleich mit' }),
            domain: ['Feature:inherit'],
            range: ['Feature:inherit'],
            sameMainCategoryResource: true
        },
        {
            name: 'isAbove',
            inverse: 'isBelow',
            label: this.i18n({ id: 'configuration.relations.isAbove', value: 'Liegt über' }),
            domain: ['Feature:inherit'],
            range: ['Feature:inherit'],
            sameMainCategoryResource: true
        },
        {
            name: 'isBelow',
            inverse: 'isAbove',
            label: this.i18n({ id: 'configuration.relations.isBelow', value: 'Liegt unter' }),
            domain: ['Feature:inherit'],
            range: ['Feature:inherit'],
            sameMainCategoryResource: true
        },
        {
            name: 'cuts',
            inverse: 'isCutBy',
            label: this.i18n({ id: 'configuration.relations.cuts', value: 'Schneidet' }),
            domain: ['Feature:inherit'],
            range: ['Feature:inherit'],
            sameMainCategoryResource: true
        },
        {
            name: 'isCutBy',
            inverse: 'cuts',
            label: this.i18n({ id: 'configuration.relations.isCutBy', value: 'Wird geschnitten von' }),
            domain: ['Feature:inherit'],
            range: ['Feature:inherit'],
            sameMainCategoryResource: true
        },
        {
            name: 'borders',
            inverse: 'borders',
            label: this.i18n({ id: 'configuration.relations.borders', value: 'Grenzt an' }),
            domain: ['Feature:inherit'],
            range: ['Feature:inherit'],
            sameMainCategoryResource: true
        },
        {
            name: 'borders',
            inverse: 'borders',
            label: this.i18n({ id: 'configuration.relations.borders', value: 'Grenzt an' }),
            domain: ['BuildingPart:inherit'],
            range: ['BuildingPart:inherit'],
            sameMainCategoryResource: true
        },
        {
            name: 'isRecordedIn',
            label: this.i18n({ id: 'configuration.relations.isRecordedIn', value: 'Aufgenommen in Maßnahme' }),
            domain: ['Inscription'],
            range: ['Trench'],
            editable: false
        },
        {
            name: 'isRecordedIn',
            label: this.i18n({ id: 'configuration.relations.isRecordedIn', value: 'Aufgenommen in Maßnahme' }),
            domain: ['Room'],
            range: ['Building'],
            editable: false
        },
        {
            name: 'isRecordedIn',
            label: this.i18n({ id: 'configuration.relations.isRecordedIn', value: 'Aufgenommen in Maßnahme' }),
            domain: ['RoomFloor'],
            range: ['Building'],
            editable: false
        },
        {
            name: 'isRecordedIn',
            label: this.i18n({ id: 'configuration.relations.isRecordedIn', value: 'Aufgenommen in Maßnahme' }),
            domain: ['RoomWall'],
            range: ['Building'],
            editable: false
        },
        {
            name: 'isRecordedIn',
            label: this.i18n({ id: 'configuration.relations.isRecordedIn', value: 'Aufgenommen in Maßnahme' }),
            domain: ['RoomCeiling'],
            range: ['Building'],
            editable: false
        },
        {
            name: 'isRecordedIn',
            label: this.i18n({ id: 'configuration.relations.isRecordedIn', value: 'Aufgenommen in Maßnahme' }),
            domain: ['Area:inherit'],
            range: ['Survey'],
            editable: false
        },
        {
            name: 'isRecordedIn',
            label: this.i18n({ id: 'configuration.relations.isRecordedIn', value: 'Aufgenommen in Maßnahme' }),
            domain: ['BuildingPart:inherit'],
            range: ['Building', 'Survey'],
            editable: false
        },
        {
            name: 'isRecordedIn',
            label: this.i18n({ id: 'configuration.relations.isRecordedIn', value: 'Aufgenommen in Maßnahme' }),
            domain: ['Find:inherit'],
            range: ['Trench', 'Survey'],
            editable: false
        },
        {
            name: 'isRecordedIn',
            label: this.i18n({ id: 'configuration.relations.isRecordedIn', value: 'Aufgenommen in Maßnahme' }),
            domain: ['Feature:inherit'],
            range: ['Trench'],
            editable: false
        },
        {
            name: 'isRecordedIn',
            label: this.i18n({ id: 'configuration.relations.isRecordedIn', value: 'Aufgenommen in Maßnahme' }),
            domain: ['Sample'],
            range: ['Trench', 'Survey'],
            editable: false
        },
        {
            name: 'liesWithin',
            label: this.i18n({ id: 'configuration.relations.liesWithin', value: 'Liegt in' }),
            domain: ['Operation:inherit', 'Place'],
            range: ['Place'],
            editable: false
        },
        {
            name: 'liesWithin',
            label: this.i18n({ id: 'configuration.relations.liesWithin', value: 'Liegt in' }),
            domain: ['Find:inherit'],
            range: ['Feature:inherit', 'Area:inherit'],
            sameMainCategoryResource: true,
            editable: false
        },
        {
            name: 'liesWithin',
            label: this.i18n({ id: 'configuration.relations.liesWithin', value: 'Liegt in' }),
            domain: ['Inscription'],
            range: ['Find:inherit'],
            sameMainCategoryResource: true,
            editable: false
        },
        {
            name: 'liesWithin',
            label: this.i18n({ id: 'configuration.relations.liesWithin', value: 'Liegt in' }),
            domain: ['Feature:inherit'],
            range: ['Feature:inherit'],
            sameMainCategoryResource: true,
            editable: false
        },
        {
            name: 'liesWithin',
            label: this.i18n({ id: 'configuration.relations.liesWithin', value: 'Liegt in' }),
            domain: ['Sample'],
            range: ['Feature:inherit', 'Find:inherit'],
            sameMainCategoryResource: true,
            editable: false
        },
        {
            name: 'liesWithin',
            label: this.i18n({ id: 'configuration.relations.liesWithin', value: 'Liegt in' }),
            domain: ['BuildingPart:inherit'],
            range: ['BuildingPart:inherit', 'Area:inherit'],
            sameMainCategoryResource: true,
            editable: false
        },
        {
            name: 'liesWithin',
            label: this.i18n({ id: 'configuration.relations.liesWithin', value: 'Liegt in' }),
            domain: ['Area:inherit'],
            range: ['Area:inherit'],
            sameMainCategoryResource: true,
            editable: false
        },
        {
            name: 'liesWithin',
            label: this.i18n({ id: 'configuration.relations.liesWithin', value: 'Liegt in' }),
            domain: ['RoomFloor'],
            range: ['Room'],
            sameMainCategoryResource: true,
            editable: false
        },
        {
            name: 'liesWithin',
            label: this.i18n({ id: 'configuration.relations.liesWithin', value: 'Liegt in' }),
            domain: ['RoomWall'],
            range: ['Room'],
            sameMainCategoryResource: true,
            editable: false
        },
        {
            name: 'liesWithin',
            label: this.i18n({ id: 'configuration.relations.liesWithin', value: 'Liegt in' }),
            domain: ['RoomCeiling'],
            range: ['Room'],
            sameMainCategoryResource: true,
            editable: false
        },
        {
            name: 'liesWithin',
            label: this.i18n({ id: 'configuration.relations.liesWithin', value: 'Liegt in' }),
            domain: ['Type:inherit'],
            range: ['Type:inherit', 'TypeCatalog:inherit'],
            editable: false
        },
        {
            name: 'isInstanceOf',
            inverse: 'hasInstance',
            label: this.i18n({ id: 'configuration.relations.isInstanceOf', value: 'Typologische Einordnung' }),
            domain: ['Find:inherit'],
            range: ['Type:inherit']
        },
        {
            name: 'hasInstance',
            inverse: 'isInstanceOf',
            label: this.i18n({ id: 'configuration.relations.hasInstance', value: 'Zugeordnete Funde' }),
            domain: ['Type:inherit'],
            range: ['Find:inherit']
        }
    ];


    constructor(private configLoader: ConfigLoader,
                private i18n: I18n) {}


    public go(configDirPath: string, customConfigurationName: string|undefined,
              locale: string): Promise<ProjectConfiguration> {

        if (customConfigurationName === 'Meninx' || customConfigurationName === 'Pergamon') {

            (this.builtinCategories as any)['Other'] = {
                color: '#CC6600',
                parent: 'Feature',
                fields: {}
            };
        }


        if (customConfigurationName === 'Meninx') {

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
                label: this.i18n({ id: 'configuration.relations.isRecordedIn', value: 'Aufgenommen in Maßnahme' }),
                domain: ['Wall_surface'],
                range: ['Trench'],
                editable: false
            });
            this.defaultRelations.push({
                name: 'isRecordedIn',
                label: this.i18n({ id: 'configuration.relations.isRecordedIn', value: 'Aufgenommen in Maßnahme' }),
                domain: ['Drilling'],
                range: ['Survey'],
                editable: false
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
                label: this.i18n({ id: 'configuration.relations.isRecordedIn', value: 'Aufgenommen in Maßnahme' }),
                domain: ['ProcessUnit'],
                range: ['Trench'],
                editable: false
            });

            this.defaultRelations.push({
                name: 'isRecordedIn',
                label: this.i18n({ id: 'configuration.relations.isRecordedIn', value: 'Aufgenommen in Maßnahme' }),
                domain: ['BuildingFloor'],
                range: ['Building'],
                editable: false
            });

            this.defaultRelations.push({
                name: 'isRecordedIn',
                label: this.i18n({ id: 'configuration.relations.isRecordedIn', value: 'Aufgenommen in Maßnahme' }),
                domain: ['SurveyBurial'],
                range: ['Survey'],
                editable: false
            });

            this.defaultRelations.push({ // override existing definition
                name: 'includes',
                inverse: 'liesWithin',
                label: this.i18n({ id: 'configuration.relations.includes', value: 'Beinhaltet' }),
                domain: ['Area:inherit'],
                range: ['Area:inherit', 'BuildingPart:inherit', 'Find:inherit', 'SurveyBurial'],
                sameMainCategoryResource: true
            });

            this.defaultRelations.push({
                name: 'liesWithin',
                inverse: 'includes',
                label: this.i18n({ id: 'configuration.relations.liesWithin', value: 'Liegt in' }),
                domain: ['SurveyBurial'],
                range: ['Area:inherit'],
                sameMainCategoryResource: true,
                editable: false
            });

            this.defaultRelations.push({
                name: 'borders',
                inverse: 'borders',
                label: this.i18n({ id: 'configuration.relations.borders', value: 'Grenzt an' }),
                domain: ['BuildingFloor'],
                range: ['BuildingPart:inherit'],
                sameMainCategoryResource: true
            });

            this.defaultRelations.push({ // override existing definition
                name: 'borders',
                inverse: 'borders',
                label: this.i18n({ id: 'configuration.relations.borders', value: 'Grenzt an' }),
                domain: ['BuildingPart:inherit'],
                range: ['BuildingPart:inherit', 'BuildingFloor'],
                sameMainCategoryResource: true
            });
        }


        return this.configLoader.go(
            configDirPath,
            this.commonFields,
            this.builtinCategories,
            this.defaultRelations,
            this.defaultFields,
            customConfigurationName,
            locale
        );
    }
}

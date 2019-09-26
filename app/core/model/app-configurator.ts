import {Injectable} from '@angular/core';
import {I18n} from '@ngx-translate/i18n-polyfill';
import {ConfigLoader} from '../configuration/config-loader';
import {ConfigurationValidator} from '../configuration/configuration-validator';
import {ProjectConfiguration} from '../configuration/project-configuration';
import {FieldDefinition} from '../configuration/model/field-definition';
import {BuiltinTypeDefinition, BuiltinTypeDefinitions} from '../configuration/model/builtin-type-definition';


@Injectable()
/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class AppConfigurator {

    private commonFields = {
        period: {
            inputType: 'dropdownRange',
            group: 'time'
        },
        dating: {
            inputType: 'dating',
            group: 'time'
        },
        diary: {
            inputType: 'input',
            group: 'stem'
        },
        area: {
            inputType: 'unsignedFloat',
            group: 'dimension'
        },
        dimensionLength: {
            inputType: 'dimension',
            group: 'dimension',
            positionValues: [
                'Maximale Ausdehnung',
                'Minimale Ausdehnung']
        },
        dimensionWidth: {
            inputType: 'dimension',
            group: 'dimension',
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
            inputType: 'dimension',
            group: 'dimension',
            positionValues: [
                'Maximale Ausdehnung',
                'Minimale Ausdehnung']
        },
        dimensionPerimeter: {
            inputType: 'dimension',
            group: 'dimension',
            positionValues: [
                'Maximale Ausdehnung',
                'Minimale Ausdehnung']
        },
        dimensionThickness: {
            inputType: 'dimension',
            group: 'dimension',
            positionValues: [
                'Maximale Ausdehnung',
                'Minimale Ausdehnung']
        },
        dimensionVerticalExtent: {
            inputType: 'dimension',
            group: 'position',
            positionValues: [
                'Oberkante',
                'Unterkante']
        },
        dimensionOther: {
            inputType: 'dimension',
            group: 'dimension',
            positionValues: [
                'Maximale Ausdehnung',
                'Minimale Ausdehnung']
        },
        beginningDate: {
            inputType: 'date',
            group: 'stem'
        },
        endDate: {
            inputType: 'date',
            group: 'stem'
        },
        processor: {
            inputType: 'input',
            group: 'stem'
        },
        description: {
            inputType: 'text'
        },
        date: {
            inputType: 'date',
            group: 'stem'
        },
        spatialLocation: {
            inputType: 'input',
            group: 'position'
        },
        provenance: {
            inputType: 'dropdown',
            valuelist: [
                'Anatolien',
                'Antiochia (Antakya)',
                'Athen',
                'Ägypten',
                'Attisch',
                'Britannien',
                'Chios',
                'Deutschland',
                'Ephesos',
                'Etruskisch',
                'Gallien',
                'Ionien',
                'Irland',
                'Italien',
                'Kampanisch',
                'Karthagisch',
                'Kleinasien',
                'Knidos',
                'Korinth',
                'Kos',
                'Lesbos',
                'Levante',
                'Lokal',
                'Lokal/Regional',
                'Milet',
                'Mäandertal',
                'Nordafrika',
                'Nordafrikanisch',
                'Palästina',
                'Pannonien',
                'Peloponnes',
                'Regional',
                'Rhodos',
                'Samos',
                'Sizilien',
                'Skandinavien',
                'Slawisch',
                'Spanien',
                'Syrien',
                'Südtunesisch',
                'Südägäis',
                'Ägypten'
            ]
        },
        orientation: {
            inputType: 'dropdown',
            group: 'position'
        }
    };

    private builtinTypes: BuiltinTypeDefinitions = {
        Project: {
            label: this.i18n({ id: 'configuration.project', value: 'Projekt' }),
            fields: {
                identifier: {
                    inputType: 'input',
                    editable: false
                },
                coordinateReferenceSystem: {
                    label: this.i18n({ id: 'configuration.project.crs', value: 'Koordinatenbezugssystem' }),
                    inputType: 'dropdown'
                }
            }
        } as BuiltinTypeDefinition,


        Operation: {
            superType: true,
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
                    inputType: 'unsignedInt'
                }
            }
        },
        Inscription: {
            fields: {}
        },


        Room: {
            superType: true,
            userDefinedSubtypesAllowed: true,
            fields: {}
        },
        BuildingPart: {
            superType: true,
            userDefinedSubtypesAllowed: true,
            fields: {}
        },
        Area: {
            superType: true,
            userDefinedSubtypesAllowed: true,
            fields: {}
        },
        Feature: {
            superType: true,
            userDefinedSubtypesAllowed: true,
            fields: {
                period: {
                    inputType: 'dropdownRange',
                    group: 'time'
                },
                dating: {
                    inputType: 'dating',
                    group: 'time'
                }
            }
        },
        Find: {
            superType: true,
            userDefinedSubtypesAllowed: true,
            fields: {}
        },
        Image: {
            superType: true,
            userDefinedSubtypesAllowed: true,
            fields: {
                height: {
                    inputType: 'unsignedInt',
                    editable: false,
                    label: this.i18n({ id: 'configuration.image.height', value: 'Höhe' })
                },
                width: {
                    inputType: 'unsignedInt',
                    editable: false,
                    label: this.i18n({ id: 'configuration.image.width', value: 'Breite' })
                },
                // The originalFilename gets used as an inital resource.identifier
                // when the image gets uploaded. However, users can change the identifier,
                // which is why we store the originalFilename separately
                originalFilename: {
                    inputType: 'input',
                    visible: false,
                    editable: false
                },
                georeference: {
                    inputType: 'input', // there is no input type for georeference, really, so we set it simply to 'input'
                    visible: false,
                    editable: false
                }
            }
        } as BuiltinTypeDefinition,
    };

    private defaultFields = {
        shortDescription: {
            label: this.i18n({ id: 'configuration.defaultFields.shortDescription', value: 'Kurzbeschreibung' }),
            visible: false,
            group: 'stem'
        } as FieldDefinition,
        identifier: {
            description: this.i18n({
                id: 'configuration.defaultFields.identifier.description',
                value: 'Eindeutiger Bezeichner dieser Ressource'
            }),
            label: this.i18n({ id: 'configuration.defaultFields.identifier', value: 'Bezeichner' }),
            visible: false,
            mandatory: true,
            group: 'stem'
        } as FieldDefinition,
        geometry: {
            visible: false,
            editable: false
        } as FieldDefinition
    };


    private defaultRelations: any[] = [
        {
            name: 'depicts',
            domain: ['Image:inherit'],
            inverse: 'isDepictedIn',
            label: this.i18n({ id: 'configuration.relations.depicts', value: 'Zeigt' }),
            editable: true
        },
        {
            name: 'isDepictedIn',
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
            sameMainTypeResource: true
        },
        {
            name: 'isBefore',
            inverse: 'isAfter',
            label: this.i18n({ id: 'configuration.relations.isBefore', value: 'Zeitlich vor' }),
            domain: ['Feature:inherit'],
            range: ['Feature:inherit'],
            sameMainTypeResource: true
        },
        {
            name: 'isEquivalentTo',
            inverse: 'isEquivalentTo',
            label: this.i18n({ id: 'configuration.relations.isEquivalentTo', value: 'Gleich wie' }),
            domain: ['Feature:inherit'],
            range: ['Feature:inherit'],
            sameMainTypeResource: true
        },
        {
            name: 'isContemporaryWith',
            inverse: 'isContemporaryWith',
            label: this.i18n({ id: 'configuration.relations.isContemporaryWith', value: 'Zeitgleich mit' }),
            domain: ['Feature:inherit'],
            range: ['Feature:inherit'],
            sameMainTypeResource: true
        },
        {
            name: 'isAbove',
            inverse: 'isBelow',
            label: this.i18n({ id: 'configuration.relations.isAbove', value: 'Liegt über' }),
            domain: ['Feature:inherit'],
            range: ['Feature:inherit'],
            sameMainTypeResource: true
        },
        {
            name: 'isBelow',
            inverse: 'isAbove',
            label: this.i18n({ id: 'configuration.relations.isBelow', value: 'Liegt unter' }),
            domain: ['Feature:inherit'],
            range: ['Feature:inherit'],
            sameMainTypeResource: true
        },
        {
            name: 'cuts',
            inverse: 'isCutBy',
            label: this.i18n({ id: 'configuration.relations.cuts', value: 'Schneidet' }),
            domain: ['Feature:inherit'],
            range: ['Feature:inherit'],
            sameMainTypeResource: true
        },
        {
            name: 'isCutBy',
            inverse: 'cuts',
            label: this.i18n({ id: 'configuration.relations.isCutBy', value: 'Wird geschnitten von' }),
            domain: ['Feature:inherit'],
            range: ['Feature:inherit'],
            sameMainTypeResource: true
        },
        {
            name: 'borders',
            inverse: 'borders',
            label: this.i18n({ id: 'configuration.relations.borders', value: 'Grenzt an' }),
            domain: ['Feature:inherit'],
            range: ['Feature:inherit'],
            sameMainTypeResource: true
        },
        {
            name: 'borders',
            inverse: 'borders',
            label: this.i18n({ id: 'configuration.relations.borders', value: 'Grenzt an' }),
            domain: ['BuildingPart:inherit'],
            range: ['BuildingPart:inherit'],
            sameMainTypeResource: true
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
            name: 'includes',
            inverse: 'liesWithin',
            label: this.i18n({ id: 'configuration.relations.includes', value: 'Beinhaltet' }),
            domain: ['Place'],
            range: ['Operation:inherit', 'Place']
        },
        {
            name: 'includes',
            inverse: 'liesWithin',
            label: this.i18n({ id: 'configuration.relations.includes', value: 'Beinhaltet' }),
            domain: ['Feature:inherit'],
            range: ['Find:inherit', 'Feature:inherit', 'Inscription'],
            sameMainTypeResource: true
        },
        {
            name: 'includes',
            inverse: 'liesWithin',
            label: this.i18n({ id: 'configuration.relations.includes', value: 'Beinhaltet' }),
            domain: ['Find:inherit'],
            range: ['Inscription'],
            sameMainTypeResource: true
        },
        {
            name: 'includes',
            inverse: 'liesWithin',
            label: this.i18n({ id: 'configuration.relations.includes', value: 'Beinhaltet' }),
            domain: ['BuildingPart:inherit'],
            range: ['BuildingPart:inherit'],
            sameMainTypeResource: true
        },
        {
            name: 'includes',
            inverse: 'liesWithin',
            label: this.i18n({ id: 'configuration.relations.includes', value: 'Beinhaltet' }),
            domain: ['Area:inherit'],
            range: ['Area:inherit', 'BuildingPart:inherit', 'Find:inherit'],
            sameMainTypeResource: true
        },
        {
            name: 'liesWithin',
            inverse: 'includes',
            label: this.i18n({ id: 'configuration.relations.liesWithin', value: 'Liegt in' }),
            domain: ['Operation:inherit', 'Place'],
            range: ['Place'],
            editable: false
        },
        {
            name: 'liesWithin',
            inverse: 'includes',
            label: this.i18n({ id: 'configuration.relations.liesWithin', value: 'Liegt in' }),
            domain: ['Find:inherit'],
            range: ['Feature:inherit', 'Area:inherit'],
            sameMainTypeResource: true,
            editable: false
        },
        {
            name: 'liesWithin',
            inverse: 'includes',
            label: this.i18n({ id: 'configuration.relations.liesWithin', value: 'Liegt in' }),
            domain: ['Inscription'],
            range: ['Feature:inherit', 'Find:inherit'],
            sameMainTypeResource: true,
            editable: false
        },
        {
            name: 'liesWithin',
            inverse: 'includes',
            label: this.i18n({ id: 'configuration.relations.liesWithin', value: 'Liegt in' }),
            domain: ['Feature:inherit'],
            range: ['Feature:inherit'],
            sameMainTypeResource: true,
            editable: false
        },
        {
            name: 'liesWithin',
            inverse: 'includes',
            label: this.i18n({ id: 'configuration.relations.liesWithin', value: 'Liegt in' }),
            domain: ['BuildingPart:inherit'],
            range: ['BuildingPart:inherit', 'Area:inherit'],
            sameMainTypeResource: true,
            editable: false
        },
        {
            name: 'liesWithin',
            inverse: 'includes',
            label: this.i18n({ id: 'configuration.relations.liesWithin', value: 'Liegt in' }),
            domain: ['Area:inherit'],
            range: ['Area:inherit'],
            sameMainTypeResource: true,
            editable: false
        },
        {
            name: 'bears',
            inverse: 'isFoundOn',
            label: this.i18n({ id: 'configuration.relations.bears', value: 'Trägt' }),
            domain: ['Find:inherit'],
            range: ['Inscription'],
            sameMainTypeResource: true
        },
        {
            name: 'isFoundOn',
            inverse: 'bears',
            label: this.i18n({ id: 'configuration.relations.isFoundOn', value: 'Ist aufgebracht auf' }),
            domain: ['Inscription'],
            range: ['Find:inherit'],
            sameMainTypeResource: true
        }
    ];


    constructor(private configLoader: ConfigLoader,
                private i18n: I18n) {}


    public go(configDirPath: string, customConfigurationName: string|undefined,
              locale: string): Promise<ProjectConfiguration> {

        if (customConfigurationName === 'Meninx' || customConfigurationName === 'Pergamon') {

            (this.builtinTypes as any)['Other'] = {
                color: '#CC6600',
                parent: 'Feature',
                fields: {}
            };
        }


        if (customConfigurationName === 'Meninx') {

            (this.builtinTypes as any)['Wall_surface'] = {
                color: '#ffff99',
                fields: {}
            };
            (this.builtinTypes as any)['Drilling'] = {
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

            (this.builtinTypes as any)['ProcessUnit'] = {
                superType: true,
                userDefinedSubtypesAllowed: true,
                abstract: true,
                color: '#08306b',
                fields: {}
            };
            (this.builtinTypes as any)['Profile'] = {
                color: '#c6dbef',
                parent: 'ProcessUnit',
                fields: {}
            };
            (this.builtinTypes as any)['Sample'] = {
                color: '#9ecae1',
                parent: 'ProcessUnit',
                fields: {}
            };
            (this.builtinTypes as any)['BuildingFloor'] = {
                color: '#6600cc',
                fields: {}
            };
            (this.builtinTypes as any)['SurveyBurial'] = {
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

            this.defaultRelations.push({ // override existing definition
                name: 'isRecordedIn',
                label: this.i18n({ id: 'configuration.relations.isRecordedIn', value: 'Aufgenommen in Maßnahme' }),
                domain: ['Stone'],
                range: ['Building', 'Trench', 'Survey'],
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
                sameMainTypeResource: true
            });

            this.defaultRelations.push({
                name: 'liesWithin',
                inverse: 'includes',
                label: this.i18n({ id: 'configuration.relations.liesWithin', value: 'Liegt in' }),
                domain: ['SurveyBurial'],
                range: ['Area:inherit'],
                sameMainTypeResource: true,
                editable: false
            });

            this.defaultRelations.push({
                name: 'borders',
                inverse: 'borders',
                label: this.i18n({ id: 'configuration.relations.borders', value: 'Grenzt an' }),
                domain: ['BuildingFloor'],
                range: ['BuildingPart:inherit'],
                sameMainTypeResource: true
            });

            this.defaultRelations.push({ // override existing definition
                name: 'borders',
                inverse: 'borders',
                label: this.i18n({ id: 'configuration.relations.borders', value: 'Grenzt an' }),
                domain: ['BuildingPart:inherit'],
                range: ['BuildingPart:inherit', 'BuildingFloor'],
                sameMainTypeResource: true
            });
        }


        return this.configLoader.go(
            configDirPath,
            this.commonFields,
            this.builtinTypes,
            this.defaultRelations,
            this.defaultFields,
            new ConfigurationValidator(),
            customConfigurationName,
            locale
        );
    }
}
import {Injectable} from '@angular/core';
import {I18n} from '@ngx-translate/i18n-polyfill';
import {ProjectConfiguration} from 'idai-components-2';
import {TypeDefinition} from 'idai-components-2';
import {FieldDefinition} from 'idai-components-2';
import {PrePreprocessConfigurationValidator} from '../configuration/pre-preprocess-configuration-validator';
import {ConfigurationValidator} from '../configuration/configuration-validator';
import {ConfigLoader} from '../configuration/config-loader';


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
            group: 'dimension',
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
            group: 'position',
            valuelist: [
                'N-S',
                'NNO - SSW',
                'NNW-SSO',
                'NO-SW',
                'NW-SO',
                'W-O',
                'WNW-OSO',
                'WSW-ONO'
            ]
        }
    };

    private defaultTypes = {
        Place: {
            fields: {
                gazId: {
                    inputType: 'unsignedInt'
                }
            }
        } as TypeDefinition,
        Operation: {
            fields: {},
            abstract: true
        } as TypeDefinition,
        Building: {
            fields: {},
            parent: 'Operation'
        } as TypeDefinition,
        Survey: {
            fields: {},
            parent: 'Operation'
        } as TypeDefinition,
        Trench: {
            fields: {},
            parent: 'Operation'
        } as TypeDefinition,
        Room: {
            fields: {}
        } as TypeDefinition,
        RoomWall: {
            fields: {}
        } as TypeDefinition,
        RoomFloor: {
            fields: {}
        } as TypeDefinition,
        BuildingPart: {
            fields: {}
        } as TypeDefinition,
        Area: {
            fields: {}
        } as TypeDefinition,
        Feature: {
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
        } as TypeDefinition,
        Find: {
            fields: {}
        } as TypeDefinition,
        Inscription: {
            fields: {}
        } as TypeDefinition,
        Image: {
            fields: {
                height: {
                    editable: false,
                    label: this.i18n({ id: 'configuration.image.height', value: 'Höhe' })
                },
                width: {
                    editable: false,
                    label: this.i18n({ id: 'configuration.image.width', value: 'Breite' })
                },
                originalFilename: {
                    visible: false,
                    editable: false
                },
                // TODO Delete the fields 'filename' and 'hasFilename' as soon as existing data has been migrated.
                filename: {
                    visible: false,
                    editable: false
                },
                georeference: {
                    visible: false,
                    editable: false
                }
            }
        } as TypeDefinition,
        Project: {
            label: this.i18n({ id: 'configuration.project', value: 'Projekt' }),
            fields: {
                'identifier': {
                    editable: false
                },
                'coordinateReferenceSystem': {
                    label: this.i18n({ id: 'configuration.project.crs', value: 'Koordinatenbezugssystem' }),
                    inputType: 'dropdown',
                    valuelist: [
                        'Eigenes Koordinatenbezugssystem',
                        'EPSG4326 (WGS 84)',
                        'EPSG3857 (WGS 84 Web Mercator)'
                    ]
                }
            }
        } as TypeDefinition
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

            (this.defaultTypes as any)['Other'] = {
                color: '#CC6600',
                parent: 'Feature',
                fields: {}
            };
        }


        if (customConfigurationName === 'Meninx') {

            (this.defaultTypes as any)['Wall_surface'] = {
                color: '#ffff99',
                fields: {}
            };
            (this.defaultTypes as any)['Drilling'] = {
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

            (this.defaultTypes as any)['ProcessUnit'] = {
                abstract: true,
                color: '#08306b',
                fields: {}
            };
            (this.defaultTypes as any)['Profile'] = {
                color: '#c6dbef',
                parent: 'ProcessUnit',
                fields: {}
            };
            (this.defaultTypes as any)['Sample'] = {
                color: '#9ecae1',
                parent: 'ProcessUnit',
                fields: {}
            };
            (this.defaultTypes as any)['BuildingFloor'] = {
                color: '#6600cc',
                fields: {}
            };
            (this.defaultTypes as any)['SurveyBurial'] = {
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
            this.defaultTypes,
            this.defaultRelations,
            this.defaultFields,
            new PrePreprocessConfigurationValidator(),
            new ConfigurationValidator(),
            customConfigurationName,
            locale
        );
    }
}
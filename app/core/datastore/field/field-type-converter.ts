import {Injectable} from '@angular/core';
import {Document} from 'idai-components-2';
import {TypeConverter} from '../cached/type-converter';
import {ProjectTypes} from '../../configuration/project-types';
import {Migrator} from './migrator';
import {takeOrMake} from '../../util/utils';
import {ProjectConfiguration} from '../../configuration/project-configuration';


@Injectable()
/**
 * @author Daniel de Oliveira
 */
export class FieldTypeConverter extends TypeConverter<Document> {

    constructor(private projectTypes: ProjectTypes,
                private projectConfiguration: ProjectConfiguration) {

        super();
    }


    public assertTypeToBeOfClass(type: string, typeClass: string): void {

        if (typeClass === 'ImageDocument') {
            if (!this.projectConfiguration.isSubtype(type, 'Image')) throw 'Wrong type class: must be ImageDocument';
        } else if (typeClass === 'FeatureDocument') {
            if (!this.projectConfiguration.isSubtype(type, 'Feature')) throw 'Wrong type class: must be FeatureDocument';
        } else if (typeClass === 'FieldDocument') {
            if (this.projectConfiguration.isSubtype(type, 'Image')) throw 'Wrong type class: must not be ImageDocument';
            // feature documents are allowed to also be field documents
        }
    }


    public getTypesForClass(typeClass: string): string[]|undefined {

        if (typeClass === 'ImageDocument') {
            return this.projectTypes.getImageTypeNames();
        } else if (typeClass === 'FeatureDocument') {
            return this.projectTypes.getFeatureTypeNames();
        } else if (typeClass === 'FieldDocument') {
            return this.projectTypes.getFieldTypeNames();
        } else {
            return undefined;
        }
    }


    public convert<T extends Document>(document: Document): T {

        if (this.projectConfiguration.isSubtype(document.resource.type, 'Image')) {
            takeOrMake(document, 'resource.identifier','');
            takeOrMake(document, 'resource.relations.depicts', []);
        } else {
            takeOrMake(document, 'resource.identifier','');
            takeOrMake(document, 'resource.relations.isRecordedIn', []);
        }

        return Migrator.migrate(document) as T;
    }
}
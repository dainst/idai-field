import {Injectable} from '@angular/core';
import {Document, IdaiFieldImageDocument} from 'idai-components-2';
import {takeOrMake} from 'tsfun';
import {TypeConverter} from '../core/type-converter';
import {TypeUtility} from '../../model/type-utility';
import {FieldNameMigrator} from './field-name-migrator';

@Injectable()
/**
 * @author Daniel de Oliveira
 */
export class IdaiFieldTypeConverter extends TypeConverter<Document> {


    constructor(private typeUtility: TypeUtility) {

        super();
    }


    public validateTypeToBeOfClass(type: string, typeClass: string): void {

        if (typeClass === 'IdaiFieldImageDocument') {

            if (!this.typeUtility.isSubtype(type, 'Image')) throw 'Wrong type class: must be IdaiFieldImageDocument';

        } else if (typeClass === 'IdaiFieldFeatureDocument') {

            if (!this.typeUtility.isSubtype(type, 'Feature')) throw 'Wrong type class: must be IdaiFieldFeatureDocument';

        } else if (typeClass === 'IdaiFieldDocument') {

            if (this.typeUtility.isSubtype(type, 'Image')) throw 'Wrong type class: must not be IdaiFieldImageDocument';
            // feature docs are allowed to also be idai field documents
        }
    }


    public getTypesForClass(typeClass: string): string[]|undefined {

        if (typeClass === 'IdaiFieldImageDocument') {

            return this.typeUtility.getImageTypeNames();

        } else if (typeClass === 'IdaiFieldFeatureDocument') {

            return this.typeUtility.getFeatureTypeNames();

        } else if (typeClass === 'IdaiFieldDocument') {

            return this.typeUtility.getNonImageTypeNames();
        }
    }


    public convert<T extends Document>(document: Document): T {

        if (this.typeUtility.isSubtype(document.resource.type, 'Image')) {
            takeOrMake(document,'resource.identifier','');
            takeOrMake(document,'resource.relations.depicts', []);
        } else {
            takeOrMake(document,'resource.identifier','');
            takeOrMake(document,'resource.relations.isRecordedIn', []);

            if (this.typeUtility.isSubtype(document.resource.type,'Feature')) {
                takeOrMake(document,'resource.relations.isContemporaryWith', []);
                takeOrMake(document,'resource.relations.isAfter', []);
                takeOrMake(document,'resource.relations.isBefore', []);
            }
        }

        return FieldNameMigrator.migrate(document) as T;
    }
}
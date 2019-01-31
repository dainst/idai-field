import {Injectable} from '@angular/core';
import {Document, IdaiFieldImageDocument} from 'idai-components-2';
import {takeOrMake} from 'tsfun';
import {TypeConverter} from '../core/type-converter';
import {TypeUtility} from '../../model/type-utility';
import {FieldnameMigrator} from './fieldname-migrator';

@Injectable()
/**
 * @author Daniel de Oliveira
 */
export class FieldTypeConverter extends TypeConverter<Document> {


    constructor(private typeUtility: TypeUtility) {

        super();
    }


    public assertTypeToBeOfClass(type: string, typeClass: string): void {

        if (typeClass === 'IdaiFieldImageDocument') {
            if (!this.typeUtility.isSubtype(type, 'Image')) throw 'Wrong type class: must be IdaiFieldImageDocument';
        } else if (typeClass === 'IdaiFieldFeatureDocument') {
            if (!this.typeUtility.isSubtype(type, 'Feature')) throw 'Wrong type class: must be IdaiFieldFeatureDocument';
        } else if (typeClass === 'IdaiFieldDocument') {
            if (this.typeUtility.isSubtype(type, 'Image') || this.typeUtility.isSubtype(type, 'Model3D')) {
                throw 'Wrong type class: must not be IdaiFieldImageDocument';
            }
            // feature docs are allowed to also be idai field documents
        } else if (typeClass === 'IdaiField3DDocument') {
            if (!this.typeUtility.isSubtype(type, 'Model3D')) throw 'Wrong type class: must be IdaiField3DDocument';
        } else if (typeClass === 'IdaiFieldMediaDocument') {
            if (!this.typeUtility.isSubtype(type, 'Image') && !this.typeUtility.isSubtype(type, 'Model3D')) {
                throw 'Wrong type class: must be IdaiFieldMediaDocument';
            }
        }
    }


    public getTypesForClass(typeClass: string): string[]|undefined {

        if (typeClass === 'IdaiFieldImageDocument') {
            return this.typeUtility.getImageTypeNames();
        } else if (typeClass === 'IdaiFieldFeatureDocument') {
            return this.typeUtility.getFeatureTypeNames();
        } else if (typeClass === 'IdaiFieldDocument') {
            return this.typeUtility.getNonMediaTypeNames();
        } else if (typeClass === 'IdaiField3DDocument') {
           return this.typeUtility.get3DTypeNames();
        } else if (typeClass === 'IdaiFieldMediaDocument') {
            return this.typeUtility.getMediaTypeNames();
        }
    }


    public convert<T extends Document>(document: Document): T {

        if (this.typeUtility.isSubtype(document.resource.type, 'Image')
                || this.typeUtility.isSubtype(document.resource.type, 'Model3D')) {
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

        return FieldnameMigrator.migrate(document) as T;
    }
}
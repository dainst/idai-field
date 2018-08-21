import {Injectable} from '@angular/core';
import {Document} from 'idai-components-2';
import {TypeConverter} from '../core/type-converter';
import {IdaiFieldImageDocument} from 'idai-components-2';
import {TypeUtility} from '../../model/type-utility';
import {takeOrMake} from 'tsfun';


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


    public convert<T extends Document>(doc: Document): T {

        if (this.typeUtility.isSubtype(doc.resource.type, 'Image')) {
            takeOrMake(doc,'resource.identifier','');
            takeOrMake(doc,'resource.relations.depicts', []);
        } else {

            takeOrMake(doc,'resource.identifier','');
            takeOrMake(doc,'resource.relations.isRecordedIn', []);

            if (this.typeUtility.isSubtype(doc.resource.type,'Feature')) {
                takeOrMake(doc,'resource.relations.isContemporaryWith', []);
                takeOrMake(doc,'resource.relations.isAfter', []);
                takeOrMake(doc,'resource.relations.isBefore', []);
            }
        }

        return doc as T;
    }
}
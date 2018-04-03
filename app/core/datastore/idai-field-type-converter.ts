import {Injectable} from '@angular/core';
import {Document} from 'idai-components-2/core';
import {TypeConverter} from './core/type-converter';
import {IdaiFieldImageDocument} from '../model/idai-field-image-document';
import {ObjectUtil} from '../../util/object-util';
import {TypeUtility} from '../model/type-utility';

@Injectable()
/**
 * @author Daniel de Oliveira
 */
export class IdaiFieldTypeConverter extends TypeConverter<Document> {

    constructor(private typeUtility: TypeUtility) {

        super();
    }


    public validate(types: string[]|undefined, typeClass: string): string[]|undefined {

        if (types) return types.map(type => this.proveIsCorrectType(type, typeClass));

        if (typeClass == 'IdaiFieldImageDocument') {
            return this.typeUtility.getImageTypeNames();
        } else if (typeClass == 'IdaiFieldDocument') {
            return this.typeUtility.getNonImageTypeNames();
        }
    }


    public convert<T extends Document>(doc: Document): T {

        if (this.typeUtility.isSubtype(doc.resource.type, 'Image')) {
            ObjectUtil.takeOrMake(doc,'resource.identifier','');
            ObjectUtil.takeOrMake(doc,'resource.relations.depicts', []);
        } else {
            ObjectUtil.takeOrMake(doc,'resource.identifier','');
            ObjectUtil.takeOrMake(doc,'resource.relations.isRecordedIn', []);
        }

        return doc as T;
    }


    private proveIsCorrectType(type: string, typeClass: string): string {

        if (typeClass == 'IdaiFieldImageDocument') {
            if (!this.typeUtility.isSubtype(type, 'Image')) throw 'Wrong type class: must be IdaiFieldImageDocument';
        } else if (typeClass == 'IdaiFieldDocument') {
            if (this.typeUtility.isSubtype(type, 'Image')) throw 'Wrong type class: must not be IdaiFieldImageDocument';
        }

        return type;
    }
}
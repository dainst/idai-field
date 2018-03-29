import {Injectable} from '@angular/core';
import {Document} from 'idai-components-2/core';
import {TypeConverter} from './core/type-converter';
import {TypeUtility} from '../../common/type-utility';
import {IdaiFieldImageDocument} from '../model/idai-field-image-document';
import {ObjectUtil} from '../../util/object-util';


@Injectable()
/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class IdaiFieldTypeConverter extends TypeConverter {

    constructor(private typeUtility: TypeUtility) {

        super();
    }


    public validate(types: string[]|undefined, typeClass: string): string[]|undefined {

        if (types) return types.map(type => this.proveIsCorrectType(type, typeClass));

        if (typeClass == 'IdaiFieldImageDocument') {
            return this.typeUtility.getImageTypeNames();
        } else if (typeClass == 'IdaiField3DDocument') {
            return this.typeUtility.get3DTypeNames();
        } else if (typeClass == 'IdaiFieldMediaDocument') {
            return this.typeUtility.getMediaTypeNames();
        } else if (typeClass == 'IdaiFieldDocument') {
            return this.typeUtility.getResourceTypeNames();
        }
    }


    public convert<T extends Document>(doc: Document): T {

        ObjectUtil.takeOrMake(doc,'resource.identifier','');

        // TODO do not do anything for document, use typeClass
        if (this.typeUtility.isMediaType(doc.resource.type)) {
            ObjectUtil.takeOrMake(doc,'resource.relations.depicts', []);
        } else {
            ObjectUtil.takeOrMake(doc,'resource.relations.isRecordedIn', []);
        }

        return doc as T;
    }


    private proveIsCorrectType(type: string, typeClass: string): string {

        if (typeClass == 'IdaiFieldImageDocument') {
            if (!this.typeUtility.isImageType(type)) throw 'Wrong type class: must be IdaiFieldImageDocument';
        } else if (typeClass == 'IdaiField3DDocument') {
            if (!this.typeUtility.is3DType(type)) throw 'Wrong type class: must be IdaiField3DDocument';
        } else if (typeClass == 'IdaiFieldDocument') {
            if (this.typeUtility.isMediaType(type)) {
                throw 'Wrong type class: must not be IdaiFieldImageDocument or IdaiField3DDocument';
            }
        } else if (typeClass == 'IdaiFieldMediaDocument') {
            if (!this.typeUtility.isMediaType(type)) {
                throw 'Wrong type class: must be IdaiFieldImageDocument or IdaiField3DDocument';
            }
        }

        return type;
    }
}
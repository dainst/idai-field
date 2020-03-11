import {forEach, Map} from 'tsfun';
import {BuiltinTypeDefinition} from '../model/builtin-type-definition';
import {LibraryTypeDefinition} from '../model/library-type-definition';
import {CustomTypeDefinition} from '../model/custom-type-definition';
import {FieldDefinition} from '../model/field-definition';
import {TransientFieldDefinition, TransientTypeDefinition} from '../model/transient-type-definition';


export function addSourceField(builtInTypes: Map<BuiltinTypeDefinition>,
                               libraryTypes: Map<LibraryTypeDefinition>,
                               customTypes: Map<CustomTypeDefinition>,
                               commonFields: Map<any>) {

    setFieldSourceOnTypes(builtInTypes, FieldDefinition.Source.BUILTIN);
    setFieldSourceOnTypes(libraryTypes, FieldDefinition.Source.LIBRARY);
    setFieldSourceOnTypes(customTypes, FieldDefinition.Source.CUSTOM);
    setFieldSourceOnFields(commonFields, FieldDefinition.Source.COMMON);
}


function setFieldSourceOnTypes(types: any, value: any) {

    forEach((type: TransientTypeDefinition) => setFieldSourceOnFields(type.fields, value))(types);
}


function setFieldSourceOnFields(fields: any, value: any) {

    forEach((field: TransientFieldDefinition) => field.source = value)(fields);
}

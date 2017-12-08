import {ProjectConfiguration} from 'idai-components-2/configuration';
import {IdaiFieldImageDocumentDatastore} from "../../../app/core/datastore/idai-field-image-document-datastore";
import {IdaiFieldDocumentDatastore} from "../../../app/core/datastore/idai-field-document-datastore";
import {DocumentDatastore} from '../../../app/core/datastore/document-datastore';
import {IdaiFieldTypeConverter} from "../../../app/core/datastore/idai-field-type-converter";
import {ImageTypeUtility} from '../../../app/common/image-type-utility';
import {Static} from './static';

/**
 * @author Daniel de Oliveira
 */
export class DAOsSpecHelper {

    public idaiFieldImageDocumentDatastore: IdaiFieldImageDocumentDatastore;
    public idaiFieldDocumentDatastore: IdaiFieldDocumentDatastore;
    public documentDatastore: DocumentDatastore;

    private projectConfiguration = new ProjectConfiguration({
        'types': [
            {
                'type': 'Trench',
                'fields': []
            },
            {
                'type': 'Image',
                'fields': []
            }
        ]
    });

    constructor() {

        spyOn(console, 'debug'); // suppress console.debug

        const {datastore, documentCache} = Static.createPouchdbDatastore('testdb');
        const converter = new IdaiFieldTypeConverter(
            new ImageTypeUtility(this.projectConfiguration));

        this.idaiFieldImageDocumentDatastore = new IdaiFieldImageDocumentDatastore(
            datastore, documentCache as any, converter);
        this.idaiFieldDocumentDatastore = new IdaiFieldDocumentDatastore(
            datastore, documentCache, converter);
        this.documentDatastore = new DocumentDatastore(
            datastore, documentCache, converter);
    }
}
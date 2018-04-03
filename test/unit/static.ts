import {Document, NewDocument} from 'idai-components-2/core';
import {IdaiFieldDocument} from 'idai-components-2/field';
import {ConstraintIndexer} from '../../app/core/datastore/index/constraint-indexer';
import {FulltextIndexer} from '../../app/core/datastore/index/fulltext-indexer';
import {PouchdbManager} from '../../app/core/datastore/core/pouchdb-manager';
import {DocumentCache} from '../../app/core/datastore/core/document-cache';
import {PouchdbDatastore} from '../../app/core/datastore/core/pouchdb-datastore';
import {AppState} from '../../app/core/settings/app-state';
import {IndexFacade} from '../../app/core/datastore/index/index-facade';
import {IdGenerator} from '../../app/core/datastore/core/id-generator';
import {IdaiFieldFeatureDocument} from '../../app/core/model/idai-field-feature-document';


/**
 * @author Daniel de Oliveira
 * @author Sebastian Cuy
 */
export class Static {

    public static idfDoc = (sd, identifier?, type?, id?) => Static.doc(sd, identifier, type, id) as IdaiFieldDocument;

    public static idffDoc = (sd, identifier?, type?, id?) => Static.doc(sd, identifier, type, id) as IdaiFieldFeatureDocument;

    public static doc(sd, identifier?, type?, id?): Document {

        if (!identifier) identifier = 'identifer';
        if (!type) type = 'Find';
        const doc = {
            resource : {
                id: "A",
                shortDescription: sd,
                identifier: identifier,
                title: 'title',
                type: type,
                relations : {}
            },
            created: {
                user: 'anonymous',
                date: new Date()
            },
            modified: [
                {
                    user: 'anonymous',
                    date: new Date()
                }
            ]
        };
        if (id) {
            doc['_id'] = id;
            doc.resource['id'] = id;
        } else delete doc.resource['id'];
        return doc as Document;
    }
}
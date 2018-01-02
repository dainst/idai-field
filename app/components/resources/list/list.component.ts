import {Component, Input, OnChanges} from '@angular/core';
import {IdaiFieldDocument} from 'idai-components-2/idai-field-model';
import {IdaiType, ProjectConfiguration} from 'idai-components-2/configuration';
import {ResourcesComponent} from '../resources.component';
import {Node} from './node';
import {Loading} from '../../../widgets/loading';
import {ViewFacade} from '../view/view-facade';
import {IdaiFieldDocumentDatastore} from '../../../core/datastore/idai-field-document-datastore';
import {TreeBuilder} from './tree-builder';

@Component({
    selector: 'list',
    moduleId: module.id,
    templateUrl: './list.html'
})
/**
 * A hierarchical view of resources
 *
 * @author Fabian Z.
 * @author Thomas Kleinke
 */
export class ListComponent implements OnChanges {

    @Input() ready: boolean;
    @Input() documents: IdaiFieldDocument[];

    private docs: IdaiFieldDocument[] = [];

    public typesMap: { [type: string]: IdaiType };

    public listTree: TreeBuilder;
    public docRefTree: Node[] = [];

    constructor(
        private datastore: IdaiFieldDocumentDatastore,
        public resourcesComponent: ResourcesComponent,
        private loading: Loading,
        projectConfiguration: ProjectConfiguration,
        public viewFacade: ViewFacade
    ) {
        this.typesMap = projectConfiguration.getTypesMap();
        this.listTree = new TreeBuilder(datastore);
    }


    ngOnChanges() {

        if (!this.ready) return;
        this.loading.start();

        // The timeout is necessary to make the loading icon appear
        setTimeout(async () => {
            if (this.viewFacade.getDocuments()) {
                if (!this.resourcesComponent.getIsRecordedInTarget()) return Promise.resolve();
                this.docs = this.viewFacade.getDocuments() as IdaiFieldDocument[];
                this.docRefTree = await this.listTree.from(this.viewFacade.getDocuments() as IdaiFieldDocument[], true);
            }
            this.loading.stop();
        }, 1);
    }


    public documentsInclude(doc: IdaiFieldDocument): boolean {

        return this.docs.some(d => d.resource.id == doc.resource.id );
    }


    public showPlusButton() {

        if (this.resourcesComponent.ready && !this.loading.showIcons && this.viewFacade.getQuery().q == '') {
            if (this.viewFacade.isInOverview()) return true;
            if (this.viewFacade.getSelectedMainTypeDocument()) return true;
        }

        return false;
    }


    public async createNewDocument(newDoc: IdaiFieldDocument) {

        const docs: Array<IdaiFieldDocument> = this.viewFacade.getDocuments() as IdaiFieldDocument[];
        
        for (let doc of docs) {
            if (!doc.resource.id) {
                docs.splice(docs.indexOf(doc),1);
                break;
            }
        }
        docs.push(newDoc);

        // if newDoc as parent, ensure that it's children are shown 
        if (newDoc.resource.relations['liesWithin']) {
            const parentDocId = newDoc.resource.relations['liesWithin'][0];
            if (parentDocId && this.listTree.childrenShownForIds.indexOf(parentDocId) == -1) this.listTree.childrenShownForIds.push(parentDocId);
        }

        this.docs = docs;
        this.docRefTree = await this.listTree.from(docs, true);
    }
}
import {Component, Input, Output, OnInit, EventEmitter} from '@angular/core';
import {IdaiFieldDocument} from 'idai-components-2/idai-field-model';
import {ConfigLoader, IdaiType, ProjectConfiguration} from 'idai-components-2/configuration';
import {IdaiFieldDatastore} from '../../datastore/idai-field-datastore';
import {ResourcesComponent} from '../resources.component';
import {Query} from 'idai-components-2/datastore';

@Component({
    selector: 'list',
    moduleId: module.id,
    templateUrl: './list.html'
})

/**
 * @author Fabian Z.
 * @author Thomas Kleinke
 */
export class ListComponent implements OnInit {



    @Input() expandedDocument: IdaiFieldDocument;
    private selectedMainTypeDocument: IdaiFieldDocument;

    private documents: {[type: string]: IdaiFieldDocument};
    private topDocuments: IdaiFieldDocument[];

    @Output() onDocumentCreation: EventEmitter<IdaiFieldDocument> = new EventEmitter<IdaiFieldDocument>();

    public typesMap: { [type: string]: IdaiType };

    private projectConfiguration: ProjectConfiguration;

    private childrenShownForIds: string[] = [];
    
    constructor(

        private datastore: IdaiFieldDatastore,
        private resourcesComponent: ResourcesComponent,
        configLoader: ConfigLoader
    ) {

        configLoader.getProjectConfiguration().then(projectConfiguration => {
            this.projectConfiguration = projectConfiguration;
            this.typesMap = projectConfiguration.getTypesMap();
        });

        const self = this;
        datastore.documentChangesNotifications().subscribe(result => {
            self.handleChange(<IdaiFieldDocument>result);
        });
    }

    ngOnInit() {
        this.resourcesComponent.getSelectedMainTypeDocument().subscribe(result => {
            this.selectedMainTypeDocument = result as IdaiFieldDocument;
            this.populateFirstLevel(this.selectedMainTypeDocument);
        });
    }

    public toggleChildrenForId(id:string) {
        let index = this.childrenShownForIds.indexOf(id);
        if (index != -1) {
            this.childrenShownForIds.splice(index, 1);
        } else {
            this.childrenShownForIds.push(id);
        }
    }

    public childrenHiddenFor(id: string) {
        return this.childrenShownForIds.indexOf(id) == -1
    }

    private populateFirstLevel(mainTypeDoc: IdaiFieldDocument) {
        this.topDocuments = [];
        this.documents = {};

        const query: Query = {
            q: '',
            prefix: true,
            constraints: {
                'isRecordedIn' : mainTypeDoc.resource.id,
            }
        };

        this.datastore.find(query).then( docs => {
            docs.forEach((doc, i) => {
                this.documents[doc.resource.id] = doc as IdaiFieldDocument;

                if (!doc.resource.relations["liesWithin"]) {
                    this.topDocuments.push(doc as IdaiFieldDocument);
                }
            });
        });
    }

    private handleChange(result: any) {
        // reload only after changes topDocuments or deletions
        if (result._deleted){
            this.populateFirstLevel(this.selectedMainTypeDocument);
        } else if (!result.resource.relations["liesWithin"]) this.populateFirstLevel(this.selectedMainTypeDocument);

    }

}
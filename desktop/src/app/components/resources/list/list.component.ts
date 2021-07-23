import {Component, Input, OnChanges, SimpleChanges} from '@angular/core';
import {FieldDocument, Named, Category, Tree} from 'idai-field-core';
import {ResourcesComponent} from '../resources.component';
import {Loading} from '../../widgets/loading';
import {BaseList} from '../base-list';
import {ProjectConfiguration} from 'idai-field-core';
import {ViewFacade} from '../../../core/resources/view/view-facade';
import {Menus} from '../../../services/menus';


@Component({
    selector: 'list',
    templateUrl: './list.html'
})
/**
 * @author Fabian Z.
 * @author Thomas Kleinke
 * @author Philipp Gerth
 */
export class ListComponent extends BaseList implements OnChanges {

    @Input() documents: Array<FieldDocument>;
    @Input() selectedDocument: FieldDocument;

    public categoriesMap: { [category: string]: Category };


    constructor(resourcesComponent: ResourcesComponent,
                viewFacade: ViewFacade,
                loading: Loading,
                projectConfiguration: ProjectConfiguration,
                menuService: Menus) {

        super(resourcesComponent, viewFacade, loading, menuService);

        // TODO review if we couln't just make use of getCategory()
        this.categoriesMap = Named.arrayToMap(Tree.flatten(projectConfiguration.getCategories()));
    }


    public ngOnChanges(changes: SimpleChanges) {

        if (changes['selectedDocument']) this.scrollTo(this.selectedDocument);
    }


    public trackDocument = (index: number, item: FieldDocument) => item.resource.id;


    public async createNewDocument(doc: FieldDocument) {

        this.documents = this.documents
            .filter(_ => _.resource.id)
            .concat([doc]);
    }
}

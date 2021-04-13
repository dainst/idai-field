import {Component, Input, OnChanges, SimpleChanges} from '@angular/core';
import {FieldDocument, Named, Category} from 'idai-field-core';
import {ResourcesComponent} from '../resources.component';
import {Loading} from '../../widgets/loading';
import {BaseList} from '../base-list';
import {ProjectConfiguration} from '../../../core/configuration/project-configuration';
import {ViewFacade} from '../../../core/resources/view/view-facade';
import {MenuService} from '../../menu-service';


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
                menuService: MenuService) {

        super(resourcesComponent, viewFacade, loading, menuService);
        this.categoriesMap = Named.arrayToMap(projectConfiguration.getCategoriesArray());
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

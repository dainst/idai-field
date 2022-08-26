import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { I18n } from '@ngx-translate/i18n-polyfill';
import { FieldDocument, Named, CategoryForm, Tree, ProjectConfiguration, FieldResource } from 'idai-field-core';
import { ResourcesComponent } from '../resources.component';
import { Loading } from '../../widgets/loading';
import { BaseList } from '../base-list';
import { ViewFacade } from '../../../components/resources/view/view-facade';
import { Menus } from '../../../services/menus';
import { Language, Languages } from '../../../services/languages';
import { SettingsProvider } from '../../../services/settings/settings-provider';


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

    public categoriesMap: { [category: string]: CategoryForm };
    public availableLanguages: Array<Language>;
    public selectedLanguage: Language|undefined;


    constructor(private projectConfiguration: ProjectConfiguration,
                private settingsProvider: SettingsProvider,
                private i18n: I18n,
                resourcesComponent: ResourcesComponent,
                viewFacade: ViewFacade,
                loading: Loading,
                menuService: Menus) {

        super(resourcesComponent, viewFacade, loading, menuService);

        // TODO review if we couln't just make use of getCategory()
        this.categoriesMap = Named.arrayToMap(Tree.flatten(projectConfiguration.getCategories()));
    }


    public ngOnChanges(changes: SimpleChanges) {

        if (changes['selectedDocument']) this.scrollTo(this.selectedDocument);
        if (changes['documents']) this.updateAvailableLanguages();
    }


    public trackDocument = (index: number, item: FieldDocument) => item.resource.id;


    public async createNewDocument(doc: FieldDocument) {

        this.documents = this.documents
            .filter(_ => _.resource.id)
            .concat([doc]);
    }


    private updateAvailableLanguages() {

        this.availableLanguages = Languages.getDocumentsLanguages(
            this.documents,
            FieldResource.SHORTDESCRIPTION,
            Languages.getAvailableLanguages(),
            this.projectConfiguration.getProjectLanguages(),
            this.settingsProvider.getSettings().languages,
            this.i18n({ id: 'languages.noLanguage', value: 'Ohne Sprachangabe' })
        );

        if (this.availableLanguages.length > 0) this.selectedLanguage = this.availableLanguages[0];
    }
}

import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { set } from 'tsfun';
import { FieldDocument, CategoryForm, ProjectConfiguration, FieldResource, Valuelist, Labels } from 'idai-field-core';
import { ResourcesComponent } from '../resources.component';
import { Loading } from '../../widgets/loading';
import { BaseList } from '../base-list';
import { ViewFacade } from '../../../components/resources/view/view-facade';
import { Menus } from '../../../services/menus';
import { Language, Languages } from '../../../services/languages';
import { SettingsProvider } from '../../../services/settings/settings-provider';


@Component({
    selector: 'list',
    templateUrl: './list.html',
    standalone: false
})
/**
 * @author Fabian Z.
 * @author Thomas Kleinke
 * @author Philipp Gerth
 */
export class ListComponent extends BaseList implements OnChanges {

    @Input() documents: Array<FieldDocument>;
    @Input() selectedDocument: FieldDocument;

    public shortDescriptionValuelists: { [category: string]: { valuelist: Valuelist, values: string[] } };
    public availableLanguages: Array<Language>;
    public selectedLanguage: Language|undefined;

    public readonly itemSize: number = 42;


    constructor(private projectConfiguration: ProjectConfiguration,
                private settingsProvider: SettingsProvider,
                private labels: Labels,
                resourcesComponent: ResourcesComponent,
                viewFacade: ViewFacade,
                loading: Loading,
                menuService: Menus) {

        super(resourcesComponent, viewFacade, loading, menuService);

        this.viewFacade.navigationPathNotifications().subscribe(() => {
            if (!this.selectedDocument) this.scrollToLastSelectedSegmentResource();
        });
    }


    public getUnselectedLanguages = () => this.availableLanguages.filter(language => {
        return language !== this.selectedLanguage;
    });

    public selectLanguage = (language: Language) => this.selectedLanguage = language;

    public trackDocument = (index: number, item: FieldDocument) => item.resource.id;

    public getCategory = (document: FieldDocument) => this.projectConfiguration.getCategory(document.resource.category);


    public ngOnChanges(changes: SimpleChanges) {

        if (changes['selectedDocument']) this.scrollTo(this.selectedDocument);
        if (changes['documents']) {
            this.updateAvailableLanguages();
            this.updateShortDescriptionValuelists();
        }
    }


    public async createNewDocument(document: FieldDocument) {

        document.resource.identifier = '';

        this.documents = this.documents
            .filter(_ => _.resource.id)
            .concat([document]);
    }


    public getShortDescriptionValuelist(document: FieldDocument): Valuelist {
        
        return this.shortDescriptionValuelists?.[document.resource.category]?.valuelist;
    }


    public getShortDescriptionValues(document: FieldDocument): string[] {
        
        return this.shortDescriptionValuelists?.[document.resource.category]?.values;
    }


    private updateAvailableLanguages() {

        this.availableLanguages = Languages.getDocumentsLanguages(
            this.getFreetextShortDescriptionDocuments(),
            FieldResource.SHORTDESCRIPTION,
            Languages.getAvailableLanguages(),
            this.projectConfiguration.getProjectLanguages(),
            this.settingsProvider.getSettings().languages,
            $localize `:@@languages.noLanguage:Ohne Sprachangabe`
        );

        if (this.availableLanguages.length > 0) this.selectedLanguage = this.availableLanguages[0];
    }


    private updateShortDescriptionValuelists() {

        const categories: Array<CategoryForm> =  set(this.documents.map(document => document.resource.category))
            .map(categoryName => this.projectConfiguration.getCategory(categoryName));

        this.shortDescriptionValuelists = categories.reduce((result, category) => {
            const valuelist: Valuelist = CategoryForm.getShortDescriptionValuelist(category);
            if (valuelist) {
                result[category.name] = {
                    valuelist,
                    values: this.labels.orderKeysByLabels(valuelist)
                }
            }
            return result;
        }, {});
    }


    private getFreetextShortDescriptionDocuments(): Array<FieldDocument> {

        return this.documents.filter(document => {
            const category: CategoryForm = this.projectConfiguration.getCategory(document.resource.category);
            return CategoryForm.getShortDescriptionValuelist(category) === undefined;
        });
    }
}

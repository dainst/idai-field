import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { intersection, to } from 'tsfun';
import { CategoryForm, ProjectConfiguration, Document, Relation, Datastore, Labels, Named, DateSpecification,
    SortMode, ProcessDocument } from 'idai-field-core';
import { sortProcesses } from '../sort-processes';
import { getSystemTimezone } from '../../../../../util/timezones';
import { Settings } from '../../../../../services/settings/settings';
import { UtilTranslations } from '../../../../../util/util-translations';


@Component({
    selector: 'link-process-modal',
    templateUrl: './link-process-modal.html',
    host: {
        '(window:keydown)': 'onKeyDown($event)'
    },
    standalone: false
})
/**
 * @author Thomas Kleinke
 */
export class LinkProcessModalComponent {

    public baseDocuments: Array<Document>;
    public allowedProcessCategories: Array<CategoryForm>;

    public filterOptions: Array<CategoryForm> = [];
    public selectedDocument: Document;
    public availableProcesses: Array<ProcessDocument>;


    constructor(public activeModal: NgbActiveModal,
                private projectConfiguration: ProjectConfiguration,
                private datastore: Datastore,
                private labels: Labels,
                private utilTranslations: UtilTranslations) {}


    public getCategoryLabel = (process: Document) =>
        this.labels.get(this.projectConfiguration.getCategory(process));

    public cancel = () => this.activeModal.dismiss('cancel');


    public async onKeyDown(event: KeyboardEvent) {
    
        if (event.key === 'Escape') this.cancel();
    }


    public initialize() {

        this.allowedProcessCategories = this.getAllowedProcessCategories();
        this.filterOptions = this.getFilterOptions();
    }


    public async selectDocument(document: Document) {

        this.selectedDocument = document;
        this.availableProcesses = await this.getAvailableProcesses();
        sortProcesses(this.availableProcesses, SortMode.Date);
    }


    public selectProcess(process: ProcessDocument) {

        this.activeModal.close(process);
    }


    public reset() {

        this.selectedDocument = undefined;
        this.availableProcesses = undefined;
    }


    public getConstraints = () => {
    
        return {
            'id:match': {
                value: this.getIdsToIgnore(),
                subtract: true
            }
        };
    }


    public getDateLabel(process: ProcessDocument): string {
    
        if (!process.resource.date) return '';

        const timeSuffix: string = $localize `:@@revisionLabel.timeSuffix:Uhr`;

        return DateSpecification.generateLabel(
            process.resource.date,
            getSystemTimezone(),
            timeSuffix,
            Settings.getLocale(),
            (term: string) => this.utilTranslations.getTranslation(term),
            false
        );
    }


    private getAllowedProcessCategories(): Array<CategoryForm> {

        return intersection(
            this.baseDocuments.map(document => {
                return this.projectConfiguration.getAllowedRelationDomainCategories(
                    Relation.Workflow.IS_EXECUTED_ON,
                    document.resource.category
                );
            })
        );
    }


    private getFilterOptions(): Array<CategoryForm> {

        return this.allowedProcessCategories.reduce((result, subcategory) => {
            return result.concat(
                this.projectConfiguration.getAllowedRelationRangeCategories(
                    Relation.Workflow.IS_EXECUTED_ON, subcategory.name
                )
            );
        }, []);
    }


    private async getAvailableProcesses(): Promise<Array<ProcessDocument>> {

        const processes: Array<ProcessDocument> = (await this.datastore.find({
            constraints: { 'isExecutedOn:contain': this.selectedDocument.resource.id }
        })).documents as Array<ProcessDocument>;

        const linkedProcesses: Array<ProcessDocument> = (await this.datastore.find({
            constraints: { 'isExecutedOn:contain': this.baseDocuments.map(document => document.resource.id) }
        })).documents as Array<ProcessDocument>;

        return processes.filter(process => {
            return !linkedProcesses.map(linkedProcess => {
                return linkedProcess.resource.id;
            }).includes(process.resource.id)
                && this.allowedProcessCategories.map(to(Named.NAME)).includes(process.resource.category);
        });
    }


    private getIdsToIgnore(): string[] {

        return this.baseDocuments.map(document => document.resource.id);
    }
}

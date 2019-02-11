import {Component} from '@angular/core';
import {I18n} from '@ngx-translate/i18n-polyfill';
import {FieldDocument, ProjectConfiguration} from 'idai-components-2';
import {ViewFacade} from '../view/view-facade';
import {ModelUtil} from '../../../core/model/model-util';
import {NavigationPath} from '../view/state/navigation-path';
import {Loading} from '../../../widgets/loading';


type NavigationButtonLabelMap = { [id: string]: { text: string, fullText: string, shortened: boolean } };


@Component({
    moduleId: module.id,
    selector: 'navigation',
    templateUrl: './navigation.html'
})
/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class NavigationComponent {

    public navigationPath: NavigationPath = NavigationPath.empty();
    public labels: NavigationButtonLabelMap = {};

    private static maxTotalLabelCharacters: number = 40;


    constructor(
        public viewFacade: ViewFacade,
        public projectConfiguration: ProjectConfiguration,
        private loading: Loading,
        private i18n: I18n) {

        this.viewFacade.navigationPathNotifications().subscribe(path => {
            this.navigationPath = path;
            this.labels = NavigationComponent.getLabels(this.navigationPath);
        });
    }


    public getOperationButtonLabel = (document: FieldDocument) => ModelUtil.getDocumentLabel(document);

    public getNavigationButtonLabel = (id: string) => this.labels[id];

    public getBypassHierarchy = () => this.viewFacade.getBypassHierarchy();

    public moveInto = (document: FieldDocument|undefined) => this.viewFacade.moveInto(document);

    public isSelectedSegment = (id: string) => id === this.navigationPath.selectedSegmentId;


    public getTypeName() {

        // return this.projectConfiguration.getLabelForType(this.viewFacade.getViewType() as any);
    }


    public getTooltip() {

        return this.viewFacade.getBypassHierarchy()
            ? this.i18n({
                id: 'resources.navigation.tooltips.deactivateExtendedSearchMode',
                value: 'Erweiterten Suchmodus deaktivieren'
            })
            : this.i18n({
                id: 'resources.navigation.tooltips.activateExtendedSearchMode',
                value: 'Erweiterten Suchmodus aktivieren'
            });
    }


    public async toggleDisplayHierarchy() {

        if (this.loading.isLoading()) return;

        await this.viewFacade.setBypassHierarchy(!this.viewFacade.getBypassHierarchy());
    }


    public showNavigation(): boolean {

        return this.viewFacade.isInOverview() || this.viewFacade.getSelectedOperations().length > 0;
    }


    public showSelectAllOperationsOption(): boolean {

        return this.viewFacade.getBypassHierarchy() && this.viewFacade.getOperations().length > 1;
    }


    public showOperationAsFirstSegment(): boolean {

        return false;
        // return !this.viewFacade.isInOverview()
        //     && (!this.viewFacade.getBypassHierarchy() || !this.viewFacade.getSelectAllOperationsOnBypassHierarchy());
    }


    public showOperationsAllAsFirstSegment(): boolean {

        return false;
        // return !this.viewFacade.isInOverview()
        //     && (this.viewFacade.getBypassHierarchy() && this.viewFacade.getSelectAllOperationsOnBypassHierarchy());
    }


    public async activateBypassOperationTypeSelection() {

        await this.viewFacade.setSelectAllOperationsOnBypassHierarchy(true);
    }


    public getSegments(): Array<FieldDocument> {

        return !this.viewFacade.getBypassHierarchy()
            ? this.navigationPath.segments.map(_ => _.document)
            : [];
    }


    public async chooseOperationTypeDocumentOption(document: FieldDocument) {

        this.viewFacade.selectOperation(document.resource.id);
        if (!this.viewFacade.getSelectedDocument()) { // if deselection happened during selectMainTypeDocument
            this.viewFacade.setActiveDocumentViewTab(undefined);
        }
    }


    private static getLabels(navigationPath: NavigationPath): NavigationButtonLabelMap {

        const labels: NavigationButtonLabelMap = {};

        navigationPath.segments.forEach(segment => {
            labels[segment.document.resource.id] = {
                text: segment.document.resource.identifier,
                fullText: segment.document.resource.identifier,
                shortened: false
            };
        });

        NavigationComponent.shortenLabelsIfNecessary(labels, navigationPath.selectedSegmentId);

        return labels;
    }


    private static shortenLabelsIfNecessary(labels: NavigationButtonLabelMap,
                                            selectedSegmentId: string|undefined) {

        const totalCharacters: number = this.getTotalLabelCharacterCount(labels);

        if (totalCharacters > this.maxTotalLabelCharacters) {
            const maxSingleLabelCharacters: number
                = this.computeMaxSingleLabelCharacters(labels, selectedSegmentId);

            Object.keys(labels).forEach(id => {
                if (labels[id].text.length > maxSingleLabelCharacters && id !== selectedSegmentId) {
                    labels[id].text = labels[id].text.substring(
                        0, Math.max(0, maxSingleLabelCharacters - 3)
                    ) + '...';
                    labels[id].shortened = true;
                }
            })
        }
    }


    private static getTotalLabelCharacterCount(labels: NavigationButtonLabelMap): number {

        let result: number = 0;
        Object.values(labels).forEach(label => result += label.text.length);

        return result;
    }


    private static computeMaxSingleLabelCharacters(labels: NavigationButtonLabelMap,
                                                   selectedSegmentId: string|undefined): number {

        let maxSingleLabelCharacters: number
            = this.maxTotalLabelCharacters - (selectedSegmentId ? labels[selectedSegmentId].text.length : 0);

        const labelCount: number = Object.keys(labels).length;
        if (labelCount > 1) maxSingleLabelCharacters /= selectedSegmentId ? labelCount - 1 : labelCount;

        return maxSingleLabelCharacters;
    }
}
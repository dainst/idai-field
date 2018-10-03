import {Component} from '@angular/core';
import {IdaiFieldDocument} from 'idai-components-2';
import {ViewFacade} from '../view/view-facade';
import {ModelUtil} from '../../../core/model/model-util';
import {NavigationPath} from '../view/state/navigation-path';
import {Loading} from '../../../widgets/loading';
import {ProjectConfiguration} from 'idai-components-2';


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


    constructor(
        public viewFacade: ViewFacade,
        private loading: Loading,
        public projectConfiguration: ProjectConfiguration) {

        this.viewFacade.navigationPathNotifications().subscribe(path => {
            this.navigationPath = path;
        });
    }

    public showOperationAsFirstSegment = () => !this.viewFacade.getBypassHierarchy() || !this.viewFacade.getSelectAllOperationsOnBypassHierarchy();

    public showOperationsAllAsFirstSegment = () => this.viewFacade.getBypassHierarchy() && this.viewFacade.getSelectAllOperationsOnBypassHierarchy();

    public getDocumentLabel = (document: any) => ModelUtil.getDocumentLabel(document);

    public getBypassHierarchy = () => this.viewFacade.getBypassHierarchy();

    public moveInto = (document: IdaiFieldDocument|undefined) => this.viewFacade.moveInto(document);


    public getTypeName() {

        return this.projectConfiguration.getLabelForType(this.viewFacade.getViewType() as any);
    }


    public getTooltip() {

        return this.viewFacade.getBypassHierarchy()
            ? 'Erweiterten Suchmodus deaktivieren'
            : 'Erweiterten Suchmodus aktivieren';
    }


    public async toggleDisplayHierarchy() {

        if (this.loading.isLoading()) return;

        await this.viewFacade.setBypassHierarchy(!this.viewFacade.getBypassHierarchy());
    }


    public showNavigation() {

        return !this.viewFacade.isInOverview() && this.viewFacade.getSelectedOperations().length > 0;
    }


    public showSwitchHierarchyModeButton() {

        return this.viewFacade.isInOverview() || this.viewFacade.getSelectedOperations().length > 0;
    }


    public showSelectAllOperationsOption() {

        return this.viewFacade.getBypassHierarchy() && this.viewFacade.getOperations().length > 1;
    }


    public async activateBypassOperationTypeSelection() {

        await this.viewFacade.setSelectAllOperationsOnBypassHierarchy(true);
    }


    public getSegments(): Array<IdaiFieldDocument> {

        return !this.viewFacade.getBypassHierarchy()
            ? this.navigationPath.segments.map(_ => _.document)
            : [];
    }


    public async chooseOperationTypeDocumentOption(document: IdaiFieldDocument) {

        this.viewFacade.selectOperation(document.resource.id);
        if (!this.viewFacade.getSelectedDocument()) { // if deselection happened during selectMainTypeDocument
            this.viewFacade.setActiveDocumentViewTab(undefined);
        }
    }
}
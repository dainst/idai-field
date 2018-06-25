import {Component} from '@angular/core';
import {IdaiFieldDocument} from 'idai-components-2/field';
import {ViewFacade} from '../state/view-facade';
import {ModelUtil} from '../../../core/model/model-util';
import {NavigationPath} from '../state/navigation-path';


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

    public navigationPath: NavigationPath = { elements: [], displayHierarchy: true };


    constructor(public viewFacade: ViewFacade) {

        this.viewFacade.navigationPathNotifications().subscribe(path => {
            this.navigationPath = path;
        });
    }


    public getDocumentLabel = (document: any) => ModelUtil.getDocumentLabel(document);

    public moveInto = (document: IdaiFieldDocument|undefined) => this.viewFacade.moveInto(document);


    public async toggleDisplayHierarchy() {

        await this.viewFacade.setDisplayHierarchy(!this.viewFacade.getDisplayHierarchy());
    }


    public getElements(): Array<IdaiFieldDocument> {

        return this.navigationPath.displayHierarchy
            ? this.navigationPath.elements
            : [];
    }


    public async chooseOperationTypeDocumentOption(document: IdaiFieldDocument) {

        this.viewFacade.selectOperationTypeDocument(document);
        if (!this.viewFacade.getSelectedDocument()) { // if deselection happened during selectMainTypeDocument
            this.viewFacade.setActiveDocumentViewTab(undefined);
        }
    }
}
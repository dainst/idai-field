import {Component} from '@angular/core';
import {IdaiFieldDocument} from 'idai-components-2/idai-field-model';
import {ViewFacade} from './state/view-facade';
import {ModelUtil} from '../../core/model/model-util';
import {NavigationPath} from './navigation-path';


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

    public navigationPath: NavigationPath = { elements: [] };


    constructor(public viewFacade: ViewFacade) {

        this.viewFacade.navigationPathNotifications().subscribe(path => {
            this.navigationPath = path;
        })
    }


    public getDocumentLabel = (document: any) => ModelUtil.getDocumentLabel(document);


    public async setRootDocument(document: IdaiFieldDocument|undefined) {

        await this.viewFacade.moveInto(document as any);
    }


    public async chooseOperationTypeDocumentOption(document: IdaiFieldDocument) {

        const isMatched = this.viewFacade.selectMainTypeDocument(document);
        if (!isMatched) this.viewFacade.setActiveDocumentViewTab(undefined);
    }
}
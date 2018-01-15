import {Component} from '@angular/core';
import {IdaiFieldDocument} from 'idai-components-2/idai-field-model';
import {ViewFacade} from './view/view-facade';
import {ModelUtil} from '../../core/model/model-util';


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

    public pathToRootDocument: Array<IdaiFieldDocument>;


    constructor(public viewFacade: ViewFacade) {

        this.viewFacade.pathToRootDocumentNotifications().subscribe(path => {
            this.pathToRootDocument = path;
        })
    }


    public getDocumentLabel = (document: any) => ModelUtil.getDocumentLabel(document);


    public async setRootDocument(resourceId: string) {

        await this.viewFacade.setRootDocument(resourceId as string);
    }


    public async chooseOperationTypeDocumentOption(document: IdaiFieldDocument) {

        const isMatched = this.viewFacade.selectMainTypeDocument(document);
        if (!isMatched) this.viewFacade.setActiveDocumentViewTab(undefined);
    }
}
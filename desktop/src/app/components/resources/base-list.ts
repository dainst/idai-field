import { Component, ViewChild } from '@angular/core';
import { CdkVirtualScrollViewport } from '@angular/cdk/scrolling';
import { FieldDocument } from 'idai-field-core';
import { ResourcesComponent } from './resources.component';
import { Loading } from '../widgets/loading';
import { PlusButtonStatus } from './plus-button.component';
import { NavigationPath } from '../../components/resources/view/state/navigation-path';
import { ViewFacade } from '../../components/resources/view/view-facade';
import { MenuContext } from '../../services/menu-context';
import { Menus } from '../../services/menus';
import { scrollTo } from '../../angular/scrolling';


@Component({
   template: ''
})
/**
 * @author Philipp Gerth
 * @author Thomas Kleinke
 */
export class BaseList {

    @ViewChild(CdkVirtualScrollViewport) scrollViewport: CdkVirtualScrollViewport;

    public navigationPath: NavigationPath;


    constructor(public resourcesComponent: ResourcesComponent,
                public viewFacade: ViewFacade,
                protected loading: Loading,
                protected menuService: Menus) {

        this.navigationPath = this.viewFacade.getNavigationPath();
        this.viewFacade.navigationPathNotifications().subscribe(path => this.navigationPath = path);
    }


    public getCurrentFilterCategory()  {

        const filterCategories = this.viewFacade.getFilterCategories();
        return filterCategories && filterCategories.length > 0 ? filterCategories[0] : undefined;
    }


    public getSelectedSegmentDoc() {

        const segment = NavigationPath.getSelectedSegment(this.navigationPath);
        return segment ? segment.document : undefined;
    }


    public isPlusButtonShown(): boolean {

        return this.menuService.getContext() !== MenuContext.GEOMETRY_EDIT
            && this.viewFacade.isReady()
            && !this.loading.isLoading();
    }


    public getPlusButtonStatus(): PlusButtonStatus {

        return this.viewFacade.isInExtendedSearchMode()
            ? 'disabled-hierarchy'
            : 'enabled';
    }


    protected scrollTo(doc: FieldDocument|undefined) {

        if (!doc) return;

        const index = this.viewFacade.getDocuments()
            .findIndex(document => document.resource.id === doc.resource.id);

        if (!this.scrollViewport) {
            setTimeout(() => this.scrollTo(doc), 100);
        } else {
            scrollTo(index, 'resource-' + doc.resource.identifier, this.scrollViewport);   
        }
    }
}

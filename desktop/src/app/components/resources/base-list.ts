import {Component, ViewChild} from '@angular/core';
import {CdkVirtualScrollViewport} from '@angular/cdk/scrolling';
import {FieldDocument} from 'idai-field-core';
import {ResourcesComponent} from './resources.component';
import {Loading} from '../widgets/loading';
import {PlusButtonStatus} from './plus-button.component';
import {NavigationPath} from '../../core/resources/view/state/navigation-path';
import {ViewFacade} from '../../core/resources/view/view-facade';
import {MenuContext, MenuService} from '../menu-service';


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
                protected menuService: MenuService) {

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

        setTimeout(() => {
            if (doc && !this.isVisible(doc)) {
                const index = this.viewFacade.getDocuments()
                    .findIndex(document => document.resource.id === doc.resource.id);
                this.scrollViewport.scrollToIndex(index, 'auto');
            }
        }, 0);
    }


    private isVisible(doc: FieldDocument|undefined): boolean {

        const element: HTMLElement|undefined = document.getElementById(
            'resource-' + doc.resource.identifier
        );
        if (!element) return false;

        const elementRect: ClientRect = element.getBoundingClientRect();
        const sidebarRect: ClientRect = this.scrollViewport.getElementRef().nativeElement.getBoundingClientRect();

        return elementRect.top > sidebarRect.top && elementRect.bottom <= sidebarRect.bottom;
    }
}

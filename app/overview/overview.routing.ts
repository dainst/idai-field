import {ModuleWithProviders}   from '@angular/core';
import {Routes, RouterModule} from '@angular/router';
import {OverviewComponent} from './overview.component';
import {MapWrapperComponent} from './map-wrapper.component';
import {DocumentEditWrapperComponent} from './document-edit-wrapper.component';
import {CanDeactivateDocumentEditWrapperGuard}  from './can-deactivate-document-edit-wrapper-guard';

const overviewRoutes: Routes = [
    {
        path: 'resources',
        component: OverviewComponent,
        children: [
            {
                path: '',
                component: MapWrapperComponent
            },
            {
                path: 'editGeometry/:id/:editMode',
                component: MapWrapperComponent
            },
            {
                path: 'new', // ;type=typename
                component: DocumentEditWrapperComponent,
                canDeactivate: [CanDeactivateDocumentEditWrapperGuard]
            },
            {
                path: ':id/edit',
                component: DocumentEditWrapperComponent,
                canDeactivate: [CanDeactivateDocumentEditWrapperGuard]
            }
        ]
    }
];

export const overviewRouting: ModuleWithProviders = RouterModule.forChild(overviewRoutes);
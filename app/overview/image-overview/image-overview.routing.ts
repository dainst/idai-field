import {ModuleWithProviders}   from '@angular/core';
import {Routes, RouterModule} from '@angular/router';
import {ImageOverviewComponent} from './image-overview.component';
import {ImageGridComponent} from './image-grid.component';
import {DocumentEditWrapperComponent} from '../document-edit-wrapper.component';
import {CanDeactivateDocumentEditWrapperGuard}  from '../can-deactivate-document-edit-wrapper-guard';

const overviewRoutes: Routes = [
    {
        path: 'images',
        component: ImageOverviewComponent,
        children: [
            {
                path: '',
                component: ImageGridComponent
            }
        ]
    }
];

export const imageOverviewRouting: ModuleWithProviders = RouterModule.forChild(overviewRoutes);
import {ModuleWithProviders} from "@angular/core";
import {Routes, RouterModule} from "@angular/router";
import {ImagesComponent} from "./images.component";
import {ImageGridComponent} from "./image-grid.component";
import {ImageViewComponent} from "./image-view.component";
import {EditNavigationComponent} from "./edit-navigation.component";
import {EditCanDeactivateGuard} from "./edit-can-deactivate-guard";

const routes: Routes = [
    {
        path: 'images',
        component: ImagesComponent,
        children: [
            {
                path: '',
                component: ImageGridComponent
            },
            {
                path: ':id/show',
                component: ImageViewComponent
            },
            {
                path: ':id/edit',
                component: EditNavigationComponent,
                canDeactivate: [EditCanDeactivateGuard]
            }
        ]
    }
];

export const imagesRouting: ModuleWithProviders = RouterModule.forChild(routes);
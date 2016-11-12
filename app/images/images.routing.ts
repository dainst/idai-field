import {ModuleWithProviders} from "@angular/core";
import {Routes, RouterModule} from "@angular/router";
import {ImagesComponent} from "./images.component";
import {ImageGridComponent} from "./image-grid.component";
import {ImageViewComponent} from "./image-view.component";
import {ImageEditComponent} from "./image-edit.component";

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
                component: ImageEditComponent
            }
        ]
    }
];

export const imagesRouting: ModuleWithProviders = RouterModule.forChild(routes);
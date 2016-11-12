import {ModuleWithProviders} from "@angular/core";
import {Routes, RouterModule} from "@angular/router";
import {ImageOverviewComponent} from "./image-overview.component";
import {ImageGridComponent} from "./image-grid.component";
import {ImageViewComponent} from "./image-view.component";

const routes: Routes = [
    {
        path: 'images',
        component: ImageOverviewComponent,
        children: [
            {
                path: '',
                component: ImageGridComponent
            },
            {
                path: ':id/show',
                component: ImageViewComponent
            }
        ]
    }
];

export const imageOverviewRouting: ModuleWithProviders = RouterModule.forChild(routes);
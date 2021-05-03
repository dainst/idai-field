import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {WidgetsModule} from '../../widgets/widgets.module';
import {ImageRowContextMenuComponent} from './image-row-context-menu.component';
import {ImageRowComponent} from './image-row.component';


@NgModule({
    imports: [
        BrowserModule,
        WidgetsModule
    ],
    declarations: [
        ImageRowComponent,
        ImageRowContextMenuComponent
    ],
    exports: [
        ImageRowComponent
    ]
})

export class ImageRowModule {}

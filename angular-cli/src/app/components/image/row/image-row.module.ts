import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {WidgetsModule} from '../../widgets/widgets.module';
import {ImageRowComponent} from './image-row.component';


@NgModule({
    imports: [
        BrowserModule,
        WidgetsModule
    ],
    declarations: [
        ImageRowComponent
    ],
    exports: [
        ImageRowComponent
    ]
})

export class ImageRowModule {}
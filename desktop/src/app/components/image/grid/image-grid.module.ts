import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { ImageGridComponent } from './image-grid.component';
import { DropAreaComponent } from './drop-area.component';
import { ImageUploadModule } from '../upload/image-upload.module';
import { ImageGridCellComponent } from './image-grid-cell.component';
import { WidgetsModule } from '../../widgets/widgets.module';


@NgModule({
    imports: [
        BrowserModule,
        NgbModule,
        FormsModule,
        RouterModule,
        ImageUploadModule,
        WidgetsModule
    ],
    declarations: [
        ImageGridComponent,
        ImageGridCellComponent,
        DropAreaComponent
    ],
    exports: [
        ImageGridComponent,
        DropAreaComponent
    ]
})

export class ImageGridModule {}

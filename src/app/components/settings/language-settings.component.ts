import {Component, Input} from '@angular/core';
import {CdkDragDrop} from '@angular/cdk/drag-drop';
import {Settings} from '../../core/settings/settings';

const cldr = typeof window !== 'undefined' ? window.require('cldr') : require('cldr');


@Component({
    selector: 'language-settings',
    templateUrl: './language-settings.html'
})
/**
 * @author Thomas Kleinke
 */
export class LanguageSettingsComponent {

    @Input() languages: string[];


    public getLabel(language: string): string {

        return cldr.extractLanguageDisplayNames(Settings.getLocale())[language];
    }


    public onDrop(event: CdkDragDrop<string[], any>) {

        this.languages.splice(
            event.currentIndex,
            0,
            this.languages.splice(event.previousIndex, 1)[0]
        );
    }
}

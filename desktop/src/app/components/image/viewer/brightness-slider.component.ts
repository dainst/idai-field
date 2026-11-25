import { Output, EventEmitter, Renderer2, Component } from '@angular/core';
import { Menus } from '../../../services/menus';
import { MenuContext } from '../../../services/menu-context';
import { ViewFacade } from '../../resources/view/view-facade';
import { MenuComponent } from '../../widgets/menu.component';


@Component({
    selector: 'brightness-slider',
    templateUrl: './brightness-slider.html',
    standalone: false
})
/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class BrightnessSliderComponent extends MenuComponent {

    public brightness: number = 50;

    @Output() onBrightnessChanged = new EventEmitter<number>();


    constructor(renderer: Renderer2,
                menuService: Menus,
                viewFacade: ViewFacade) {

        super(renderer, menuService, 'brightness-slider-button', 'brightness-slider-menu');

        viewFacade.navigationPathNotifications().subscribe(() => this.close());
    }


    public setBrightness(brightness: number) {

        this.brightness = brightness;
        this.onBrightnessChanged.emit(brightness);
    }


    protected isClosable(): boolean {

        return this.opened && this.menuService.getContext() !== MenuContext.DOCEDIT;
    }
}

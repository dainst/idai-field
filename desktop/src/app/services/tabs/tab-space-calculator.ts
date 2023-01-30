import { Tab } from './tab';


/**
 * @author Thomas Kleinke
 */
export class TabSpaceCalculator {

    private canvas: HTMLCanvasElement = document.createElement('canvas');
    private tabSpaceWidth: number;

    private static OVERVIEW_TAB_WIDTH: number = 100;
    private static TABS_DROPDOWN_WIDTH: number = 42;
    private static BASIC_TAB_WIDTH: number = 73;
    private static MAX_TAB_WIDTH: number = 500;
    private static FONT: string = '16px \'Open SansVariable\'';


    public setTabSpaceWidth(tabSpaceWidth: number) {

        this.tabSpaceWidth = tabSpaceWidth;
    }


    public getTabSpaceWidth(): number {

        return this.tabSpaceWidth
            - TabSpaceCalculator.OVERVIEW_TAB_WIDTH
            - TabSpaceCalculator.TABS_DROPDOWN_WIDTH;
    }


    public getTabWidth(tab: Tab): number {

        const context: CanvasRenderingContext2D|null = this.canvas.getContext('2d');
        if (!context) {
            console.error('Error while trying to get canvas context');
            return 1000;
        }

        context.font = TabSpaceCalculator.FONT;

        return Math.min(
            Math.ceil(context.measureText(tab.label).width + TabSpaceCalculator.BASIC_TAB_WIDTH),
            TabSpaceCalculator.MAX_TAB_WIDTH
        );
    }
}

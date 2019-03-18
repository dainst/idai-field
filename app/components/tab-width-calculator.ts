import {Tab} from './tab-manager';


/**
 * @author Thomas Kleinke
 */
export class TabWidthCalculator {

    private canvas: HTMLCanvasElement = document.createElement('canvas');
    private tabSpaceWidth: number;

    private static OVERVIEW_TAB_WIDTH: number = 100;
    private static TABS_DROPDOWN_WIDTH: number = 42;
    private static BASIC_TAB_WIDTH: number = 64;
    private static FONT: string = '16px Roboto';


    public setTabSpaceWidth(tabSpaceWidth: number) {

        this.tabSpaceWidth = tabSpaceWidth;
    }


    public getTabSpaceWidth(): number {

        return this.tabSpaceWidth;
    }


    public getAvailableTabSpaceWidth(tabs: Array<Tab>): number {

        return this.tabSpaceWidth
            - TabWidthCalculator.OVERVIEW_TAB_WIDTH
            - TabWidthCalculator.TABS_DROPDOWN_WIDTH
            - tabs
                .filter(tab => tab.shown)
                .reduce((totalTabsWidth: number, tab: Tab) => {
                    return totalTabsWidth + this.getTabWidth(tab);
                }, 0);
    }


    public getTabWidth(tab: Tab): number {

        const context: CanvasRenderingContext2D|null = this.canvas.getContext('2d');
        if (!context) {
            console.error('Error while trying to get canvas context');
            return 0;
        }

        context.font = TabWidthCalculator.FONT;

        return Math.ceil(context.measureText(tab.label).width + TabWidthCalculator.BASIC_TAB_WIDTH);
    }
}
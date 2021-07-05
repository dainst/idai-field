export type ContextMenuOrientation = 'top'|'bottom';


/**
 * @author Thomas Kleinke
 */
export class ContextMenu {

    public position: { x: number, y: number }|undefined;


    public open(event: MouseEvent, ...data: any) {

        this.position = { x: event.clientX, y: event.clientY };
    }


    public close() {

        this.position = undefined;
    }


    public isOpen(): boolean {

        return this.position !== undefined;
    }


    public static computeOrientation(yPosition?: number): ContextMenuOrientation {

        return !yPosition || yPosition <= window.innerHeight * 0.6
            ? 'top'
            : 'bottom';
    }


    public static getBottomPosition(yPosition: number): number {

        return window.innerHeight - yPosition;
    }
}

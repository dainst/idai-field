import {GraphManipulation} from './graph-manipulation';


/**
 * @author Thomas Kleinke
 */
export class SelectionRectangle {

    private startPositionX: number;
    private startPositionY: number;

    private mousePositionX: number;
    private mousePositionY: number;

    private svgElement: SVGRectElement;

    private static verticalOffset: number = 110;


    public start(event: MouseEvent, svgRoot: SVGSVGElement, htmlDocument: Document) {

        this.startPositionX = this.mousePositionX = event.x;
        this.startPositionY = this.mousePositionY = event.y - SelectionRectangle.verticalOffset;

        this.svgElement = GraphManipulation.createSVGElement('rect', htmlDocument) as SVGRectElement;
        this.svgElement.setAttribute('stroke', '#000');
        this.svgElement.setAttribute('stroke-width', '2');
        this.svgElement.setAttribute('stroke-dasharray', '10,10');
        this.svgElement.setAttribute('fill-opacity', '0');
        const gElement = GraphManipulation.createSVGElement('g', htmlDocument);
        svgRoot.appendChild(gElement);
        gElement.appendChild(this.svgElement);
    }


    public update(event: MouseEvent) {

        this.mousePositionX = event.x;
        this.mousePositionY = event.y - SelectionRectangle.verticalOffset;

        this.svgElement.setAttribute('x', this.getLeft().toString());
        this.svgElement.setAttribute('y', this.getTop().toString());
        this.svgElement.setAttribute('width', this.getWidth().toString());
        this.svgElement.setAttribute('height', this.getHeight().toString());
    }


    public remove(svgRoot: SVGSVGElement) {

        svgRoot.removeChild(this.svgElement.parentElement as Element);
    }


    public getSelectedElements(svgRoot: SVGSVGElement): Array<Element> {

        const selectedElements: Array<Element> = [];
        const ellipseElements = svgRoot.getElementsByTagName('ellipse');

        for (let i = 0; i < ellipseElements.length; i++) {
            if (this.isSelected(ellipseElements[i])) {
                selectedElements.push(ellipseElements[i].parentElement as Element);
            }
        }

        return selectedElements;
    }


    private isSelected(element: Element): boolean {

        const boundingBox = element.getBoundingClientRect();

        return boundingBox.right > this.getLeft()
            && boundingBox.left < this.getRight()
            && boundingBox.top - SelectionRectangle.verticalOffset < this.getBottom()
            && boundingBox.bottom - SelectionRectangle.verticalOffset > this.getTop();
    }


    private getLeft(): number {

        return Math.min(this.startPositionX, this.mousePositionX);
    }


    private getRight(): number {

        return Math.max(this.startPositionX, this.mousePositionX);
    }


    private getTop(): number {

        return Math.min(this.startPositionY, this.mousePositionY);
    }


    private getBottom(): number {

        return Math.max(this.startPositionY, this.mousePositionY);
    }


    private getWidth(): number {

        return this.getRight() - this.getLeft();
    }


    private getHeight(): number {

        return this.getBottom() - this.getTop();
    }
}
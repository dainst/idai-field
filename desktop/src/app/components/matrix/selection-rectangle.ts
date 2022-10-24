import { GraphManipulation } from './graph-manipulation';


/**
 * @author Thomas Kleinke
 */
export class SelectionRectangle {

    private svgElement: SVGRectElement;

    private startPosition: { x: number, y: number };
    private mousePosition: { x: number, y: number };

    private static verticalOffset: number = 114;


    public start(event: MouseEvent, svgRoot: SVGSVGElement, htmlDocument: Document) {

        this.startPosition = this.mousePosition = SelectionRectangle.getMousePosition(event);
        this.svgElement = SelectionRectangle.createSVGElement(htmlDocument);
        SelectionRectangle.attachSVGElementToRoot(this.svgElement, svgRoot, htmlDocument);
    }


    public update(event: MouseEvent) {

        this.mousePosition = SelectionRectangle.getMousePosition(event);
        this.updateAttributes();
    }


    public finish(svgRoot: SVGSVGElement) {

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


    private updateAttributes() {

        this.svgElement.setAttribute('x', this.getLeft().toString());
        this.svgElement.setAttribute('y', this.getTop().toString());
        this.svgElement.setAttribute('width', this.getWidth().toString());
        this.svgElement.setAttribute('height', this.getHeight().toString());
    }


    private getLeft(): number {

        return Math.min(this.startPosition.x, this.mousePosition.x);
    }


    private getRight(): number {

        return Math.max(this.startPosition.x, this.mousePosition.x);
    }


    private getTop(): number {

        return Math.min(this.startPosition.y, this.mousePosition.y);
    }


    private getBottom(): number {

        return Math.max(this.startPosition.y, this.mousePosition.y);
    }


    private getWidth(): number {

        return this.getRight() - this.getLeft();
    }


    private getHeight(): number {

        return this.getBottom() - this.getTop();
    }


    private static getMousePosition(event: MouseEvent): { x: number, y: number } {

        return {
            x: event.x,
            y: event.y - this.verticalOffset
        };
    }


    private static createSVGElement(htmlDocument: Document): SVGRectElement {

        const svgElement: SVGRectElement
            = GraphManipulation.createSVGElement('rect', htmlDocument) as SVGRectElement;
        svgElement.setAttribute('stroke', '#000');
        svgElement.setAttribute('stroke-width', '1');
        svgElement.setAttribute('stroke-dasharray', '5,5');
        svgElement.setAttribute('fill-opacity', '0');

        return svgElement;
    }


    private static attachSVGElementToRoot(svgElement: SVGRectElement, svgRoot: SVGSVGElement,
                                          htmlDocument: Document) {

        const gElement = GraphManipulation.createSVGElement('g', htmlDocument);
        svgRoot.appendChild(gElement);
        gElement.appendChild(svgElement);
    }
}
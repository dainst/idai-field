import {Component, ElementRef, Input, OnChanges, ViewChild} from '@angular/core';
import {IdaiFieldDocument} from 'idai-components-2/idai-field-model';
import {DotBuilder} from './dot-builder';


// TODO Use typings file from viz.js v1.8.1 as soon as it is released
declare var Viz: VizJs.Viz;

declare namespace VizJs {

    interface Viz {
        (src: string, opts?: VizOpts): string | HTMLImageElement
        svgXmlToPngImageElement(svgXml: string, scale: number | undefined, callback: ImageCallback): void
        svgXmlToPngImageElement(svgXml: string, scale?: number): HTMLImageElement
        svgXmlToPngBase64(svgXml: string, scale: number | undefined, callback: ImageCallback): void
    }

    interface ImageCallback {
        (error: Error | null, image: HTMLImageElement): void
    }

    interface VizOpts {
        format?: string
        engine?: string
        scale?: number
        images?: Image[]
        totalMemory?: number,
        files?: File[]
    }

    interface File {
        path: string
        data: string
    }

    interface Image {
        href: string
        height: string
        width: string
    }
}



@Component({
    moduleId: module.id,
    selector: 'graph',
    templateUrl: './graph.html'
})
/**
 * @author Thomas Kleinke
 */
export class GraphComponent implements OnChanges {

    @Input() documents: Array<IdaiFieldDocument>;

    @ViewChild('graphContainer') graphContainer: ElementRef;


    ngOnChanges() {

        this.reset();
        this.showGraph();
    }


    private reset() {

        while (this.graphContainer.nativeElement.firstChild) {
            this.graphContainer.nativeElement.removeChild(this.graphContainer.nativeElement.firstChild);
        }
    }


    private showGraph() {

        const graph: string = new DotBuilder().build(this.documents);

        const svg = Viz(graph, { format: 'svg', engine: 'dot' }) as string;
        const svgElement = new DOMParser().parseFromString(svg, 'image/svg+xml');

        this.graphContainer.nativeElement.appendChild(svgElement.getElementsByTagName('svg')[0]);
    }
}
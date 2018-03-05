import {IdaiFieldDocument} from 'idai-components-2/idai-field-model';


/**
 * @author Thomas Kleinke
 */
export class DotBuilder {

    private documents: Array<IdaiFieldDocument>;


    public build(documents: Array<IdaiFieldDocument>): string {

        this.documents = documents;

        let result: string = 'digraph { '
            + this.documents.map(document => this.getGraphString(document))
                .filter(graphString => graphString != undefined)
                .join(' ')
            + ' }';

        return result;
    }


    private getGraphString(document: IdaiFieldDocument): string|undefined {

        const relations: string[]|undefined = document.resource.relations['isAfter'];
        if (!relations || relations.length == 0) return;

        const relationIdentifiers: string = relations
            .map(targetId => this.getIdentifier(targetId))
            .join(', ');

        return relations.length == 1
            ? document.resource.identifier + ' -> ' + relationIdentifiers
            : document.resource.identifier + ' -> {' + relationIdentifiers + '}'
    }


    private getIdentifier(id: string): string {

        const document: IdaiFieldDocument|undefined = this.getDocument(id);

        return document ? document.resource.identifier : '';
    }


    private getDocument(id: string): IdaiFieldDocument|undefined {

        return this.documents.find(document => document.resource.id == id);
    }
}
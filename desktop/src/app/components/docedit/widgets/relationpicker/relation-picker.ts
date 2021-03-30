import {Document} from 'idai-field-core';


/**
 * @author Thomas Kleinke
 */
export abstract class RelationPicker {

    public selectedTarget: Document|undefined;


    public abstract updateSelectedTarget(): Promise<void>;

    public abstract createRelation(target: Document): void;

    public abstract deleteRelation(): void;

    public abstract leaveSuggestionMode(): void;

    public abstract getSuggestions(idSearchString: string): Promise<Array<Document>>;
}

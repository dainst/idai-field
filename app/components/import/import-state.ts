/**
 * @author Thomas Kleinke
 */
export class ImportState {

    private separator: string = ',';  // For CSV import


    public getSeparator(): string {

        return this.separator;
    }


    public setSeparator(separator: string) {

        if (separator.length === 1) this.separator = separator;
    }
}
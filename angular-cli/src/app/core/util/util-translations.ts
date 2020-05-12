/**
 * @author Thomas Kleinke
 */
export class UtilTranslations {

    private translations: { [key: string]: string } = {};


    public addTranslation(key: string, value: string) {

        this.translations[key] = value;
    }


    public getTranslation(key: string): string {

        return this.translations[key] ? this.translations[key] : '';
    }
}
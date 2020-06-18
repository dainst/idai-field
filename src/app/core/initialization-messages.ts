const INITIALIZATION_MESSAGES = {
    'de': {
        'loading1': 'Projekt',
        'loading2': 'wird geladen...',
        'loadTestProject': 'Testprojekt laden',
        'databaseError': 'Ein Fehler ist aufgetreten: Die Projektdatenbank konnte nicht geladen werden.',
        'configurationError': 'Ein Fehler ist aufgetreten: Die Projektkonfiguration konnte nicht geladen werden.',
        'fetchDocumentsError': 'Ein Fehler ist aufgetreten: Die Projektressourcen konnte nicht aus der Datenbank gelesen werden.',
        'indexingError': 'Ein Fehler ist aufgetreten: Die Indizierung der Projektressourcen ist fehlgeschlagen.',
    },
    'en': {
        'loading1': 'Loading project',
        'loading2': '...',
        'loadTestProject': 'Load test project',
        'databaseError': 'An error has occurred: The project database could not be loaded.',
        'configurationError': 'An error has occurred: The project configuration could not be loaded.',
        'fetchDocumentsError': 'An error has occurred: The project resources could not be read from the database.',
        'indexingError': 'An error has occurred: The indexing of the project resources has failed.',
    }
};


export const getMessage = (key: string, locale: string) => INITIALIZATION_MESSAGES[locale][key];

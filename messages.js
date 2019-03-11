const messageDictionary = {
    de: {
        'autoUpdate.available.title': 'Update verfügbar',
        'autoUpdate.available.message.1': 'Eine neue Version von iDAI.field (',
        'autoUpdate.available.message.2': ') ist verfügbar. Möchten Sie sie herunterladen und installieren?',
        'autoUpdate.available.yes': 'Ja',
        'autoUpdate.available.no': 'Nein',
        'autoUpdate.downloaded.title': 'Update installieren',
        'autoUpdate.downloaded.message.1': 'Version ',
        'autoUpdate.downloaded.message.2': ' von iDAI.field wurde geladen. Starten Sie die Anwendung neu, '
            + 'um sie zu installieren.',
        'menu.about': 'Über iDAI.field',
        'menu.settings': 'Einstellungen',
        'menu.file': 'Datei',
        'menu.file.import': 'Import',
        'menu.file.export': 'Export',
        'menu.file.exit': 'Beenden',
        'menu.edit': 'Bearbeiten',
        'menu.edit.undo': 'Rückgängig',
        'menu.edit.redo': 'Wiederherstellen',
        'menu.edit.cut': 'Ausschneiden',
        'menu.edit.copy': 'Kopieren',
        'menu.edit.paste': 'Einfügen',
        'menu.edit.selectAll': 'Alles auswählen',
        'menu.tools': 'Werkzeuge',
        'menu.tools.images': 'Bilderverwaltung',
        'menu.tools.backupCreation': 'Backup erstellen',
        'menu.tools.backupLoading': 'Backup einlesen',
        'menu.view': 'Anzeige',
        'menu.view.reload': 'Neu laden',
        'menu.view.toggleFullscreen': 'Vollbild an/aus',
        'menu.view.toggleDeveloperTools': 'Entwicklertools an/aus',
        'menu.window': 'Fenster',
        'menu.window.minimize': 'Minimieren',
        'menu.help': 'Hilfe'
    },
    en: {
        'autoUpdate.available.title': 'Update available',
        'autoUpdate.available.message.1': 'A new version of iDAI.field (',
        'autoUpdate.available.message.2': ') is available. Do you want to download and install it?',
        'autoUpdate.available.yes': ' Yes ',
        'autoUpdate.available.no': ' No ',
        'autoUpdate.downloaded.title': 'Install update',
        'autoUpdate.downloaded.message.1': 'Version ',
        'autoUpdate.downloaded.message.2': ' of iDAI.field has been downloaded. Please restart the ' +
            'application to install it.',
        'menu.about': 'About iDAI.field',
        'menu.settings': 'Settings',
        'menu.file': 'File',
        'menu.file.import': 'Import',
        'menu.file.export': 'Export',
        'menu.file.exit': 'Exit',
        'menu.edit': 'Edit',
        'menu.edit.undo': 'Undo',
        'menu.edit.redo': 'Redo',
        'menu.edit.cut': 'Cut',
        'menu.edit.copy': 'Copy',
        'menu.edit.paste': 'Paste',
        'menu.edit.selectAll': 'Select all',
        'menu.tools': 'Tools',
        'menu.tools.images': 'Image management',
        'menu.tools.backupCreation': 'Create backup',
        'menu.tools.backupLoading': 'Restore backup',
        'menu.view': 'View',
        'menu.view.reload': 'Reload',
        'menu.view.toggleFullscreen': 'Fullscreen on/off',
        'menu.view.toggleDeveloperTools': 'Developer tools on/off',
        'menu.window': 'Window',
        'menu.window.minimize': 'Minimize',
        'menu.help': 'Help'
    },
};


const get = (identifier) => messageDictionary[global.config.locale][identifier];


module.exports = {
    get: get
};

## Erste Schritte

Nach dem ersten Start des Clients befinden Sie sich zunächst im Projekt *"test"*, das es
Ihnen ermöglicht, die Funktionen des Programms anhand einiger Testdaten auszuprobieren.
Bitte beachten Sie, dass neu angelegte Datensätze nach einem Neustart des Clients
gelöscht und alle Änderungen zurückgesetzt werden, solange das Testprojekt ausgewählt ist.
Um mit dem Client produktiv zu arbeiten, sollten Sie zunächst die folgenden Schritte
durchführen:

1. Im Menü **Einstellungen**, das Sie über das Dropdown-Menü in der oberen
rechten Bildschirmecke erreichen, können Sie grundlegende Einstellungen vornehmen,
die für sämtliche Projekte gelten. Legen Sie hier bitte zunächst Ihren Bearbeiternamen
fest. Dieser Name wird bei allen von Ihnen vorgenommenen Änderungen in der
Datenbank hinterlegt und sollte unbedingt gesetzt werden, wenn Daten mit anderen
Clients synchronisiert werden sollen.

2. Darüber hinaus können Sie im Menü **Einstellungen** den Pfad des Bilderverzeichnisses
ändern. Dies ist erforderlich, wenn Sie auf ein Bilderverzeichnis zugreifen möchten,
das auf einem Netzwerk-Gerät (NAS) liegt und das von mehreren Nutzern bzw. Nutzerinnen
gleichzeitig verwendet wird. Bitte beachten Sie, dass Bilder in jedem Fall über den
Client importiert werden müssen. Bilddateien, die manuell in das Bilderverzeichnis
eingefügt werden, werden von der Anwendung **nicht** korrekt erkannt. 

3. Klicken Sie auf den Projektnamen *"test"*, um die **Projektverwaltung** aufzurufen. Hier
können Sie über den Plus-Button ein neues Projekt anlegen. Erlaubte Zeichen für den
Projektnamen sind Buchstaben, Zahlen und Bindestriche. Sobald das neue Projekt
geladen wurde, können Sie über den Editierungs-Button in der Projektverwaltung allgemeine
Metadaten des Projekts eingeben.

Beginnnen Sie mit der Dateneingabe, indem Sie in den Bereich **Übersicht** wechseln, wo
Sie Datensätze für Maßnahmen (Schnitte, Bauwerke, Survey-Areale) anlegen können. In den
Bereichen **Ausgrabung**, **Bauaufnahme** und **Survey** können Sie anschließend Ressourcen
innerhalb einer Maßnahme anlegen. 

Verwenden Sie das Menü **Backup erstellen**, das Sie ebenfalls über das Dropdown-Menü
in der oberen rechten Bildschirmecke erreichen, um regelmäßig Sicherungen Ihrer Projektdaten
anzulegen.

## Suche

### Suchen per Suchfilter

In der **Übersicht**, den Maßnahmenansichten **Ausgrabung**, **Bauaufnahme** und **Survey**, sowie in der 
Bilderverwaltung (Menüpunkt **Bilder**) steht ein Suchfilter zur Verfügung.

![Filter](manual/search_filter.png)

In dem Textfeld können Suchbegriffe eingeben werden, im Filtermenü, welches sich per Klick auf das
blaue Symbol öffnet, kann eine Typauswahl getroffen werden. Sowohl das Angeben eines Suchbegriffes als auch
die Auswahl eines Ressourcentypen schränkt die aktuell angezeigten Ressourcen ein, so dass sie den 
Filterkriterien ensprechen. In der Übersicht und den Maßnahmenansichten betrifft dass die Elemente in
der linken Seitenleiste sowohl auf der Karte (sofern Geometrien vorhanden), wenn die Kartenansicht gewählt ist,
oder die Listenelemente, wenn die Listenansicht gewählt ist. In der Bilderverwaltung betrifft das alle im Raster
angezeigten Bilder.

Wenn die aktuelle Anzeige (Maßnahmenübersicht, -ansichten) soweit durch die Filterkriterien eingeschränkt ist,
dass keine Suchtreffer angezeigt werden, werden auch Suchergebnisse aus anderen Kontexten angezeigt. 

![Filter Menü](manual/other_contexts.png)

Mit Klick auf eines der Elemente wechselt man in den entsprechenden Kontext.

#### Typfilter

Im Filtermenü

![Filter Menü](manual/filter_menu.png)

kann jeweils eine Auswahl für einen Ressourcentyp getroffen werden. Die Auswahl kann sich hierbei
entweder direkt auf einen Typ (z.B. "Erdbefund") oder eine ganze Typengruppe (z.B. "Stratigraphische Einheit")
beziehen.

#### Textfilter

* TODO: Identifier, ShortDescription
* TODO: Prefix Suche
* TODO: Platzhaltersuche

### Erweiterter Suchmodus

In den Ressourcenansichten kann mit Klick auf das Lupensymbol
 
 ![Filter Menü](manual/filter_menu.png)
 
 die erweiterte Suche aktiviert werden. Ein blaues Lupensymbol zeigt an, das der erweiterte Suchmodus aktiviert ist.
 
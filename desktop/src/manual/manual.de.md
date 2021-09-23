## Erste Schritte

Nach dem ersten Start der iDAI.field-Desktopanwendung befinden Sie sich zunächst im Projekt "test", das es
Ihnen ermöglicht, die Funktionen des Programms anhand einiger Testdaten auszuprobieren.
Bitte beachten Sie, dass neu angelegte Datensätze nach einem Neustart der Anwendung
gelöscht und alle Änderungen zurückgesetzt werden, solange das Testprojekt ausgewählt ist.
Aus diesem Grund findet im Testprojekt grundsätzlich keine Synchronisation mit anderen iDAI.field-Installationen
oder Datenbanken statt.

Um mit iDAI.field produktiv zu arbeiten und ein eigenes Projekt anzulegen, sollten Sie zunächst die folgenden Schritte durchführen:

1. Im Untermenü **Einstellungen**, das Sie über das Menü "iDAI.field" (MacOS) bzw. "Datei" (Windows)
erreichen, können Sie grundlegende Einstellungen vornehmen, die für sämtliche Projekte gelten. Legen Sie hier
bitte zunächst Ihren Bearbeiternamen bzw. Bearbeiterinnennamen fest. Dieser Name wird bei allen von Ihnen
vorgenommenen Änderungen in der Datenbank hinterlegt und sollte unbedingt gesetzt werden, insbesondere wenn
Daten synchronisiert werden sollen.

2. Darüber hinaus können Sie im Untermenü **Einstellungen** den Pfad des Bilderverzeichnisses
ändern. Dies ist erforderlich, wenn Sie auf ein Bilderverzeichnis zugreifen möchten,
das auf einem Netzwerk-Gerät (NAS) liegt und das von mehreren Nutzern bzw. Nutzerinnen
gleichzeitig verwendet wird. Bitte beachten Sie, dass Bilder in jedem Fall über die
iDAI.field-Anwendung importiert werden müssen. Bilddateien, die manuell in das Bilderverzeichnis
eingefügt werden, können von der Anwendung **nicht** verwendet werden.

3. Rufen Sie im Menü "Datei" den Menüpunkt **Neues Projekt...** auf und geben Sie den gewünschten Namen Ihres Projekts ein. Erlaubte Zeichen sind Buchstaben, Zahlen, Bindestriche und Unterstriche.

4. Sobald das neue Projekt geladen wurde, können Sie über das Menü "Datei" -> "Aktuelles Projekt" -> "Eigenschaften" allgemeine Projektdaten eingeben. Hier sollten Sie zunächst die Listen der **Teammitglieder** (Feld "Team" in der Sektion "Projekt") und der **Kampagnen** (Feld "Kampagnen", ebenfalls in der Sektion "Projekt") anlegen. Sie können diese Listen zu einem späteren Zeitpunkt jederzeit erweitern.

Verwenden Sie das Untermenü **Backup erstellen**, das Sie über das Menü "Werkzeuge" erreichen, um regelmäßig
Sicherungen Ihrer Projektdaten anzulegen.


<hr>

## Ressourcen

Die Ressourcenverwaltung bildet das Herzstück von iDAI.field.

### Maßnahmen

Nach dem Anlegen bzw. Öffnen eines Projekts befinden Sie sich zunächst im Tab **Übersicht** (gekennzeichnet
durch ein Haus-Symbol), in dem alle Maßnahmen und Orte des Projekts verwaltet werden.

Verwenden Sie den grünen Plus-Button unten in der Ressourcenliste, um eine neue Maßnahme anzulegen. 

<p align="center"><img src="images/de/resources/create_operation.png" alt="Maßnahmen-Ressource erstellen"/></p>

Dabei wählen Sie in einem ersten Schritt die Kategorie der Maßnahme aus und können anschließend optional eine
Geometrie für die neue Ressource anlegen. Schließlich öffnet sich der Editor, in dem Sie sämtliche Daten der
Maßnahme eintragen können. Je nach gewählter Maßnahmenkategorie stehen unterschiedliche Felder zur Auswahl,
die jeweils in Gruppen aufgeteilt sind. Zwischen den Feldgruppen können Sie jederzeit per Klick auf einen der
Buttons auf der linken Seite wechseln.

Bevor die Maßnahme über den grünen Speichern-Button gesichert werden kann, muss in jedem Fall das Feld
**Bezeichner** in der Gruppe "Stammdaten" ausgefüllt werden.

<p align="center"><img src="images/de/resources/save_operation.png" alt="Maßnahmen-Ressource speichern"/></p>

Die neue Maßnahme wird nun in der Ressourcenliste angezeigt. Benutzen Sie den Button "Zur Maßnahme wechseln"
(Symbol: Pfeil nach rechts oben), um einen neuen Tab für die Maßnahme zu öffnen.

<p align="center"><img src="images/de/resources/goto_operation.png" alt="Maßnahmen-Ressource öffnen"/></p>

In Abhängigkeit von der Maßnahmenkategorie können innerhalb eines Maßnahmen-Tabs mithilfe des Plus-Buttons
Ressourcen verschiedener Kategorien angelegt werden (etwa stratigraphische Einheiten innerhalb eines Schnitts
oder Räume innerhalb eines Gebäudes).

<p align="center"><img src="images/de/resources/create_more.png" alt="Ressource erstellen"/></p>

### Hierarchische Anordnung

Ressourcen können in hierarchischen Strukturen angeordnet werden, beispielsweise um Funde einer
stratigraphischen Einheit zuzuweisen. Benutzen Sie den Button "Untergeordnete Ressourcen anzeigen"
(Symbol: rechtwinkliger Pfeil nach rechts unten), um eine Liste aller Ressourcen anzuzeigen, die der
ausgewählten Ressource untergeordnet wurden. Bei einer neu angelegten Ressource ist diese Liste zunächst leer.

<p align="center"><img src="images/de/resources/open_collection.png" alt="Kollektion öffnen"/></p>

Per Klick auf **Kollektion öffnen** kann auf die tiefere Hierarchieebene gewechselt werden, sodass nun die
untergeordneten Ressourcen angezeigt werden (etwa die Funde einer stratigraphischen Einheit).
Die Verwendung des Plus-Buttons führt jetzt dazu, dass Ressourcen entsprechend auf dieser Ebene angelegt
werden.

Der Navigationspfad oberhalb der Ressourcenliste zeigt die gerade ausgewählte Hierarchieebene an. Sie können
jederzeit per Klick auf einen der Buttons des Navigationspfades in eine andere Ebene wechseln.

<p align="center"><img src="images/de/resources/navpath.png" alt="Navigationspfad"/></p>

### Verwaltung

Ressourcen in der Liste können per Klick ausgewählt werden; bei gedrückter Strg/Cmd- oder Shift-Taste lassen
sich mehrere Ressourcen gleichzeitig selektieren. Nach einem Rechtsklick auf eine oder mehrere ausgewählte
Ressourcen öffnet sich ein Kontextmenü, das die folgenden Optionen bereitstellt:

* *Bearbeiten*: Öffnet den Editor (alternativ auch per Doppelklick auf den Ressourceneintrag in der Liste
erreichbar)
* *Verschieben*: Erlaubt es, Ressourcen aus ihrem aktuellen Kontext zu entfernen und einer anderen
Ressource unterzuordnen
* *Löschen*: Entfernt Ressourcen nach einer Sicherheitsabfrage (optional können außerdem alle Bilder entfernt werden,
die ausschließlich mit den zu löschenden Ressourcen verknüpft sind)

Darüber hinaus stellt das Kontextmenü Funktionen zum Anlegen bzw. Bearbeiten von Geometrien bereit. Bitte beachten Sie,
dass bei Auswahl mehrerer Ressourcen ausschließlich die Optionen *Verschieben* und *Löschen* verfügbar sind.

<p align="center"><img src="images/de/resources/context_menu.png" alt="Kontextmenü"/></p>


<hr>

## Suche

In der **Übersicht**, den **Maßnahmen-Tabs** sowie in der **Bilderverwaltung** (erreichbar über das Menü
"Werkzeuge") stehen **Suchfilter** zur Verfügung, die Sie verwenden können, um die Menge der aktuell
angezeigten Ressourcen anhand grundlegender Suchkriterien  (Bezeichner, Kurzbeschreibung, Kategorie)
einzuschränken.

Möchten Sie komplexere Suchanfragen formulieren, können Sie innerhalb der **Übersicht** und der
**Maßnahmen-Tabs** darüber hinaus in den **erweiterten Suchmodus** wechseln. 
Dieser Modus ermöglicht es Ihnen einerseits, über Hierarchieebenen hinweg und auch innerhalb des gesamten
Projektes zu suchen und dabei andererseits zusätzliche feldspezifische Suchkriterien zu definieren.


### Suchfilter

Der Suchfilter stellt eine schnelle Möglichkeit dar, Ressourcen nach bestimmten Kriterien anzuzeigen bzw.
auszublenden, und besteht aus einem *Textfilter* (Eingabefeld) sowie einem *Kategoriefilter* (blauer Button).

<p align="center"><img src="images/de/search/search_filter.png" alt="Suchfilter"/></p>

Nach der Eingabe eines Suchbegriffes und/oder der Auswahl einer Kategorie wird die Menge der aktuell
angezeigten Ressourcen so eingeschränkt, dass sie den Filterkriterien entspricht. In der **Übersicht** und den
**Maßnahmen-Tabs** betrifft das die Ressourcen in der linken Seitenleiste und auf der Karte (in der
Kartenansicht) bzw. die Elemente der Liste (in der Listenansicht). In der **Bilderverwaltung** sind alle im
Raster angezeigten Bilder vom Suchfilter betroffen.


#### Kategoriefilter

<p align="center"><img src="images/de/search/filter_menu.png" alt="Kategoriefilter-Auswahl"/></p>

Über den Kategoriefilter-Button können Sie eine Kategorie wählen. Unterschieden wird zwischen Oberkategorien und
Unterkategorien: Wählen Sie eine Unterkategorie (z. B. "Erdbefund"), werden ausschließlich Ressourcen der
entsprechenden Kategorie angezeigt. Wählen Sie dagegen eine Oberkategorie (z. B. "Stratigraphische Einheit"),
werden Ressourcen der ausgewählten Kategorie sowie aller seiner Unterkategorien (z. B. "Erdbefund", "Grab",
"Architektur", "Fußboden" etc.) berücksichtigt. Klicken Sie ein weiteres Mal, um lediglich die Oberkategorie
selbst auszuwählen.
 
Welche Kategorien zur Auswahl stehen, hängt jeweils vom gerade aktiven Kontext ab: In der Übersicht
können Maßnahmenkategorien gewählt werden, in der Bilderverwaltung Bildkategorien etc. 


#### Textfilter

Suchbegriffe werden derzeit mit den Feldern "Bezeichner" und "Kurzbeschreibung" von Ressourcen abgeglichen. 
 
*Beispiel:*
 
In der Übersicht werden die folgenden drei Schnitte angezeigt:

    (1)
    Bezeichner: "S01"
    Kurzbeschreibung: "Schnitt-01"
    
    (2)
    Bezeichner: "S02"
    Kurzbeschreibung: "Schnitt-02"
    
    (3)
    Bezeichner: "ms1"
    Kurzbeschreibung: "Mein Schnitt 1" 

**Mögliche Suchbegriffe** sind die jeweils durch Leerzeichen oder Bindestriche getrennten Textfolgen in den
Bezeichnern und Kurzbeschreibungen, also im Beispiel: "S01", "S02", "ms1", "Schnitt", "01", "02", "Mein", "1".
  
Der Suchbegriff "s01" liefert beispielsweise die Ressource (1), die Suche nach "mein" liefert (3) als
Suchtreffer. **Groß- bzw. Kleinschreibung** spielt dabei keine Rolle und wird ignoriert.

Es handelt sich um eine sogenannte **Präfix-Suche**, d. h. es wird stets auf den Anfang eines Suchbegriffs
geprüft: Da die Bezeichner von (1) und (2) mit der Textfolge "s0" beginnen, liefert der Suchbegriff "s0"
sowohl (1) als auch (2) als Suchtreffer. Eine Suche nach "Schn" liefert (1), (2) und (3) zurück, eine Suche
nach "itt" oder "chni" hingegen nichts.


#### Platzhaltersuche

Im Textfilter ist auch eine Platzhaltersuche möglich: Statt eines Zeichens können Sie innerhalb eckiger
Klammern eine Menge unterschiedlicher erlaubter Zeichen angeben. Ein solcher Platzhalter kann pro Suchanfrage
einmal verwendet werden.

*Beispiel:*

    (1) Bezeichner: "Landscape-0001"
    (2) Bezeichner: "Landscape-0009"
    (3) Bezeichner: "Landscape-0010"
    (4) Bezeichner: "Landscape-0011"
    (5) Bezeichner: "Landscape-0022"

Eine Suche nach "Landscape-00[01]" liefert (1), (2), (3), (4), da für die dritte Ziffer sowohl 0 als auch 1
als zulässige Zeichen angegeben wurden. Alle weiteren Zeichen danach sind aufgrund der Präfix-Suche erlaubt.

Eine Suche nach "Landscape-00[01]1" liefert (1) und (4), da die Ziffer nach dem Platzhalter genau eine 1 sein
muss.


#### Suchergebnisse aus anderen Kontexten

Werden bei gesetztem Suchfilter keine Suchergebnisse im aktuellen Kontext gefunden, werden unterhalb des
Textfelds Suchergebnisse aus anderen Kontexten angezeigt.

<p align="center"><img src="images/de/search/other_contexts.png" alt="Suchergebnisse in anderen Kontexten"/></p>

Durch einen Klick auf eine der angezeigten Ressourcen wechseln Sie sofort in den dazugehörigen Kontext und
wählen die entsprechende Ressource aus.


### Erweiterter Suchmodus

In der **Übersicht** und in den **Maßnahmen-Tabs** können Sie durch einen Klick auf den Lupen-Button in
den erweiterten Suchmodus wechseln.
 
<p align="center"><img src="images/de/search/extended_search_button.png" alt="Button zur Aktivierung des erweiterten Suchmodus"/></p>

Im erweiterten Suchmodus ist eine Suche über größere Datenmengen möglich:

* In der **Übersicht** wird über alle im Projekt angelegten Ressourcen gesucht.
* In den **Maßnahmen-Tabs** wird über alle Ressourcen der Maßnahme gesucht.

In beiden Fällen werden alle gefundenen Suchergebnisse links in der Liste angezeigt. Die Buttons "Im Kontext
anzeigen" (Symbol: Pfeil nach oben) bzw. "Im Kontext einer Maßnahme anzeigen" (Symbol: Pfeil nach rechts oben)
erlauben es, direkt in den hierarchischen Kontext einer Ressource zu wechseln; dabei wird der erweiterte
Suchmodus beendet und wenn erforderlich ein neuer Tab geöffnet. 

<p align="center"><img src="images/de/search/show_in_context.png" alt="Im Kontext anzeigen"/></p>

Bei aktiviertem erweiterten Suchmodus können keine neuen Ressourcen angelegt werden, was durch den
ausgegrauten Plus-Button angezeigt wird. Um neue Ressourcen anzulegen, verlassen Sie den erweiterten
Suchmodus zunächst wieder.

Die Anzahl der gleichzeitig angezeigten Suchergebnisse ist aus Performancegründen immer auf maximal **200**
beschränkt. Das Programm zeigt die weiteren Ressourcen nicht an, weist aber darauf hin, dass die Maximalanzahl
überschritten ist. Fügen Sie weitere Suchkriterien hinzu oder verlassen Sie den erweiterten Suchmodus, um auf
die ausgeblendeten Ressourcen zugreifen zu können.
 

#### Feldspezifische Suchkriterien
 
Ist der erweiterte Suchmodus aktiviert, können Sie eine Suche über spezifische Felder einer Ressource
anstoßen, indem Sie auf den Plus-Button links neben dem Kategoriefilter-Button klicken. Dabei werden Felder
zur Suche angeboten, die der als Filter ausgewählten Kategorie entsprechen. Sie können beliebig viele Felder
auswählen, sodass Sie mehrere Suchkriterien miteinander kombinieren können. Darüber hinaus können Sie die
feldspezifischen Suchkriterien selbstverständlich auch in Kombination mit dem Textfilter verwenden.

<p align="center"><img src="images/de/search/criteria_search.png" alt="Feldspezifische Suchkriterien"/></p>

Handelt es sich um Freitextfelder, so geben Sie den Suchbegriff direkt ein; bei Feldern mit Wertelisten
wählen Sie den Begriff aus der Liste aller erlaubten Werte in einem Dropdown-Menü aus.
 
**Achtung**: Im Gegensatz zum Suchfilter wird an dieser Stelle keine Präfix-Suche durchgeführt. Der
eingestellte Begriff muss exakt mit dem Feldinhalt des entsprechenden Feldes einer Ressource
übereinstimmen, damit die Ressource als Suchergebnis auftaucht.

Alternativ zur Angabe eines konkreten Suchbegriffs kann außerdem nach allen Ressourcen gesucht werden, bei
denen das Feld gesetzt (Option "Beliebiger Wert") bzw. nicht gesetzt ist (Option "Kein Wert").

Die Zahl neben dem Kategoriefilter-Button gibt die Anzahl der aktiven Suchkriterien an. Sie können
Suchkriterien auch nachträglich wieder entfernen, indem Sie das Menü durch einen Klick auf die Zahl erneut
öffnen und das entsprechende Kriterium auswählen.


<hr>


## Matrix

In der Ansicht **Matrix** (erreichbar über das Menu "Werkzeuge") finden Sie für jeden Schnitt des Projekts
eine Matrix vor, die automatisch aus den stratigraphischen Einheiten des jeweiligen Schnitts generiert wird.
Die Kanten der Matrix werden dabei auf Grundlage der Relationen erstellt, die für die Einheiten angelegt
wurden.

<p align="center"><img src="images/de/matrix/trench_selection.png" alt="Schnitt-Auswahl"/></p>

Wählen Sie den Schnitt, für den Sie eine Matrix generieren möchten, über den Dropdown-Button links oben in der
Toolbar aus.


### Optionen

Über den **Optionsbutton** in der rechten oberen Ecke der Matrixansicht können Sie verschiedene Einstellungen
vornehmen, mit denen Sie die Darstellung der Matrix individuell anpassen können. Die gewählten Einstellungen
gelten für alle Matrizen in allen Schnitten des Projekts und bleiben auch nach einem Programmneustart
erhalten.

<p align="center"><img src="images/de/matrix/matrix_tools.png" alt="Optionsmenü"/></p>


#### Relationen

* *Zeitlich*: Kanten werden auf Basis der Relationen "Zeitlich vor", "Zeitlich nach" und "Zeitgleich mit"
  (Feldgruppe "Zeit") erstellt.
* *Räumlich*: Kanten werden auf Basis der Relationen "Liegt über", "Liegt unter", "Schneidet", "Wird
  geschnitten von" und "Gleich wie" (Feldgruppe "Lage") erstellt.


#### Kanten

* *Gerade*: Alle Kanten bestehen aus geraden Linien.
* *Gebogen*: Kanten können gebogen sein, wenn keine direkte Verbindungslinie zwischen zwei Einheiten der
  Matrix gezogen werden kann.


#### Gruppierung nach Grobdatierung

Aktivieren Sie diese Option, um die stratigraphischen Einheiten in der Matrix anhand des Eintrags im Feld
"Grobdatierung" zu gruppieren. Sind als Grobdatierung zwei Werte (von/bis) eingetragen, wird jeweils nur
der Wert aus "Grobdatierung (von)" verwendet. Stratigraphische Einheiten mit gleichen Werten für die
Grobdatierung werden nun nahe beieinander platziert und mit einem Rechteck umrahmt.

<p align="center"><img src="images/de/matrix/matrix_phases.png" alt="Gruppierung nach Grobdatierung"/></p>


### Navigation

Bewegen Sie die Maus bei gedrückter **rechter Maustaste**, um die Position der Matrix innerhalb des
Anzeigebereichs zu verändern. Verwenden Sie das **Mausrad** oder die **Zoom-Buttons** in der linken oberen
Ecke des Anzeigebereichs, um die Zoomstufe anzupassen. Mit der **linken Maustaste** können Sie mit Einheiten
der Matrix interagieren; die Art der Interaktion (Editierung oder Selektion) ist dabei vom gewählten
Interaktionsmodus abhängig.

Wenn Sie mit dem Mauszeiger über eine Einheit fahren, werden die davon ausgehenden Kanten farbig markiert:
Grüne Linien zeigen Verbindungen zu Einheiten auf höheren Ebenen an, blaue zu Einheiten auf niedrigeren Ebenen
und orange zu Einheiten auf der gleichen Ebene innerhalb der Matrix.


### Editierung

Standardmäßig befinden Sie sich im **Editierungsmodus**: Klicken Sie auf eine Einheit in der Matrix, um den
Editor zu öffnen, in dem Sie die entsprechende Ressource bearbeiten können. Durch die Editierung der
Relationen in den Gruppen "Zeit" bzw. "Lage" können Sie auf diese Weise auch die Einordnung der Einheit
innerhalb der Matrix verändern. Nach einem Klick auf den Button **Speichern** wird die Matrix automatisch auf
Grundlage der geänderten Daten aktualisiert.


### Anzeige von Teilmatrizen

Um die Übersicht in großen Matrizen zu erleichtern, können auch Teilmatrizen aus ausgewählten Einheiten
der Matrix generiert werden. Verwenden Sie die Buttons auf der rechten Seite der Toolbar, um Einheiten zu
selektieren und eine neue Teilmatrix aus der aktuellen Selektion zu erstellen:

<p align="center"><img src="images/de/matrix/interaction_mode_buttons.png" alt="Interaktionsmodus-Buttons"/></p>

* *Bearbeitungsmodus*: Einheiten können per Linksklick editiert werden.
* *Einzelauswahlmodus*: Einheiten können einzeln per Linksklick selektiert und (bei erneutem Klick)
  deselektiert werden.
* *Gruppenauswahlmodus*: Einheiten können gruppenweise selektiert werden, indem ein Rechteck mit der Maus
  gezogen wird.

<p align="center"><img src="images/de/matrix/subgraph_buttons.png" alt="Buttons zur Erstellung von Teilmatrizen"/></p>

* *Auswahl aufheben*: Alle Einheiten werden deselektiert.
* *Matrix aus Auswahl erstellen*: Eine neue Matrix wird generiert, in der ausschließlich die selektierten
  Einheiten angezeigt werden. Die Generierung der Kanten geschieht weiterhin auf Grundlage aller
  stratigraphischen Einheiten des Schnitts, sodass diese Funktion auch dazu verwendet werden kann, um auf
  schnelle Weise zu prüfen, ob zwei Einheiten über mehrere Relationen/Ressourcen hinweg miteinander
  verknüpft sind.
* *Matrix neu laden*: Die ursprüngliche Matrix mit allen stratigraphischen Einheiten des gewählten Schnitts
  wird wiederhergestellt.


<hr>


## Synchronisation

Um mit mehreren Computern an einem Projekt zu arbeiten, können Daten zwischen verschiedenen iDAI.field-Installationen synchronisiert werden. Das bedeutet, dass Änderungen (neue Ressourcen, gelöschte Ressourcen oder Editierungen bestehender Ressourcen), die über die iDAI.field-Anwendung auf einem anderen Rechner vorgenommen werden, automatisch auch in die eigene Datenbank übertragen werden und umgekehrt. So wird erreicht, dass alle Mitarbeitenden zu jeder Zeit mit dem aktuellen Stand des Projekts arbeiten können. Die Synchronisation kann dabei über das Internet oder über ein lokales Netzwerk stattfinden. Sie können weiterhin auch bei konfigurierter Synchronisation offline mit dem Projekt arbeiten – die Datenbanken werden dann synchronisiert, sobald Sie wieder mit dem Netzwerk verbunden sind.

Bitte beachten Sie, dass vor der Einrichtung der Synchronisation in jedem Fall das Feld **Name des Bearbeiters/der Bearbeiterin** in den Einstellungen ausgefüllt sein sollte.


### Projekt herunterladen

Um mit einem bestehenden Projekt zu arbeiten, das bei einer anderen iDAI.field-Desktopinstallation oder auf einem Datenbankserver vorliegt, laden Sie das Projekt zunächst herunter. Wählen Sie dazu im Menü "Datei" den Menüpunkt **Projekt herunterladen...** aus und geben Sie die Zugangsdaten ein:

* *Adresse*: Tragen Sie hier die Adresse des Projekts ein, das Sie herunterladen möchten. Das kann die Netzwerkadresse eines anderen Computers sein, auf dem iDAI.field gerade geöffnet ist (diese Adresse kann in den Einstellungen unter *Eigene Adresse* eingesehen werden), oder die Adresse einer CouchDB-Datenbank, die über das Internet oder ein lokales Netzwerk erreichbar ist (z. B. *https://field.dainst.org/sync* für den iDAI.field-Datenbankserver des DAI).
* *Projektname*: Der Name des Projekts, das Sie herunterladen möchten.
* *Passwort*: Das Passwort des Projekts bzw. der iDAI.field-Installation, von der Sie das Projekt herunterladen möchten.

Der Download kann bei größeren Projekten unter Umständen eine längere Zeit dauern. Das heruntergeladene Projekt wird anschließend automatisch geöffnet und eine Synchronisationsverbindung unter Verwendung der gleichen Zugangsdaten hergestellt.


### Synchronisation konfigurieren

Sowohl heruntergeladene als auch neu angelegte Projekte können jederzeit mit anderen Datenbanken synchronisiert werden. Die Synchronisation kann über den Menüpunkt "Datei" -> "Aktuelles Projekt" -> "Synchronisieren..." konfiguriert werden.

* *Adresse*: Tragen Sie hier die Adresse der Datenbank ein, mit der Sie eine Synchronisationsverbindung herstellen möchten. Das kann die Netzwerkadresse eines anderen Computers sein, auf dem iDAI.field gerade geöffnet ist (diese Adresse kann in den Einstellungen unter *Eigene Adresse* eingesehen werden), oder die Adresse einer CouchDB-Datenbank, die über das Internet oder ein lokales Netzwerk erreichbar ist (z. B. *https://field.dainst.org/sync* für den iDAI.field-Datenbankserver des DAI).
* *Passwort*: Das Passwort des Projekts bzw. der iDAI.field-Installation, mit der Sie die Synchronisationsverbindung herstellen möchten.

Über den Schalter **Synchronisation aktivieren** können Sie die Verbindung starten bzw. unterbrechen. Bestätigen Sie Ihre Einstellungen zuletzt über den Button **Einstellungen übernehmen**.


### Synchronisationsstatus

Das Wolken-Icon oben rechts in der Navigationsleiste zeigt den atuellen Status der von Ihnen eingerichteten Synchronisationsverbindung an.

<p align="center"><img src="images/de/synchronization/synchronization_icon.png" alt="Synchronisations-Icon"/></p>

Konnte die Verbindung erfolgreich hergestellt werden, zeigt das Icon einen Haken an. Werden gerade Dateien herunter- oder hochgeladen, wird dies durch einen Pfeil signalisiert. Im Falle eines Fehlers erscheint ein Ausrufezeichen. Zusätzliche Informationen zum Synchronisationsstatus können Sie abfragen, indem Sie den Mauszeiger über das Icon bewegen.


### Konflikte

Zu Konflikten kann es kommen, wenn eine Ressource gleichzeitig auf mehreren Computern bearbeitet wird oder wenn sich zwei Datenbanken miteinander synchronisieren, in denen zuvor die gleiche Ressource bearbeitet wurde. In solchen Fällen stehen sich zwei unterschiedliche Versionen der Ressource gegenüber: die *aktuelle Version* (die in der Ressourcenverwaltung und anderen Bereichen der Anwendung angezeigt wird) und die *konkurrierende Version* (die im Hintergrund gespeichert bleibt, aber vorerst nicht angezeigt wird). Die Versionen können sich in der Anzahl der ausgefüllten Felder unterscheiden; möglicherweise wurden auch verschiedene Werte in die gleichen Felder eingetragen.

Ressourcen mit Konflikten werden in der Liste mit einer roten Linie markiert. Darüber hinaus erscheint in der Navigationsleiste ein Icon, das die Anzahl der Konflikte im Projekt mitteilt:

<p align="center"><img src="images/de/synchronization/conflicts_icon.png" alt="Konflikte-Icon"/></p>

Klicken Sie auf das Icon, um eine Liste sämtlicher Ressourcen mit Konflikten zu öffnen. Wenn Sie eine der Ressourcen anwählen, gelangen Sie in den **Konflikte**-Tab des Editors, wo Sie die Ressource bereinigen können.

Um den Konflikt aufzulösen, muss für jedes Feld mit voneinander abweichenden Werten entschieden werden, welche Version die jeweils gültige ist. Alternativ können Sie per Klick auf *Aktuelle Version* oder *Konkurrierende Version* eine der beiden Versionen in Gänze übernehmen. Bestätigen Sie Ihre Entscheidung anschließend über den Button **Konflikt lösen**. Falls in der Ressource mehrere Konflikte aufgetreten sind, können Sie diese auf die gleiche Weise der Reihe nach lösen. Sie können dabei auch weitere Anpassungen in den anderen Editor-Tabs vornehmen. Um die Änderungen zu übernehmen, muss die Ressource zum Schluss über den **Speichern**-Button gesichert werden. 


### Synchronisationsverbindungen zur eigenen iDAI.field-Installation erlauben

Sie können anderen erlauben, eine Synchronisationsverbindung mit Ihrem Projekt herzustellen, indem Sie ihnen die Zugangsdaten mitteilen, die Sie im Menü **Einstellungen** im Abschnitt **Synchronisation** finden können:

* *Eigene Adresse*: Ihre Netzwerkdresse, über die sich andere aus ihrer iDAI.field-Installation heraus mit Ihrer Datenbank verbinden können. Sie können diese Adresse zusammen mit Ihrem Passwort weitergeben, um anderen zu ermöglichen, ihre Projektdaten mit Ihnen zu synchronisieren.
* *Eigenes Passwort*: Standardmäßig wird die Datenbank mit einem zufällig generierten Passwort vor unbefugtem Zugriff geschützt. An dieser Stelle können Sie das Passwort ändern.

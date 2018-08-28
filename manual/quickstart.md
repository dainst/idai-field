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

In der **Übersicht**, den Maßnahmenansichten **Ausgrabung**, **Bauaufnahme** und **Survey**, sowie in der 
Bilderverwaltung (Menüpunkt **Bilder**) steht ein **Suchfilter** zur Verfügung. Dieser kann genutzt werden, um
die aktuell angezeigten Ressourcen weiter einzuschränken. 

In der Übersicht sowie in dem Maßnahmenansichten steht darüber hinaus ein **erweiterter Suchmodus** bereit,
der zusätzliche Suchoptionen ermöglicht, zum einen was den Suchbereich angeht, in dem Ressourcen gesucht werden,
als auch was genauere Suchkriterien angeht.

Der Suchfilter bietet die schnellste Möglichkeit, angezeigte Ressourcen nach bestimmten Kriterien 
einzuschränken. In der Bilderverwaltung kann etwa die auf maximal **59** (je nach Zoomstufe) 
angezeigte Ressourcen beschränkte Anzeige angepasst werden, so dass diejenigen Bilder angezeigt werden, 
deren Namen beispielsweise mit einem bestimmten Suchbegriff anfangen. Der Suchfilter kann (und sollte) genutzt
werden, um die Suchergebnisse der erweiterten Suche weiter einzuschränken.

### Suchen per Suchfilter

![Filter](manual/search_filter.png)

In dem Textfeld können Suchbegriffe eingeben werden, im Filtermenü, welches sich per Klick auf das
blaue Symbol öffnet, kann eine Typauswahl getroffen werden. Sowohl das Angeben eines Suchbegriffes als auch
die Auswahl eines Ressourcentypen schränkt die aktuell angezeigten Ressourcen ein, so dass sie den 
Filterkriterien entsprechen. In der Übersicht und den Maßnahmenansichten betrifft dass die Elemente in
der linken Seitenleiste sowohl auf der Karte (sofern Geometrien vorhanden), wenn die Kartenansicht gewählt ist,
oder die Listenelemente, wenn die Listenansicht gewählt ist. In der Bilderverwaltung betrifft das alle im Raster
angezeigten Bilder.

Wenn die aktuelle Anzeige (Maßnahmenübersicht, -ansichten) soweit durch die Filterkriterien eingeschränkt ist,
dass keine Suchtreffer angezeigt werden, werden auch Suchergebnisse aus anderen Kontexten angezeigt. 

![Andere Kontexte](manual/other_contexts.png)

Mit Klick auf eines der Elemente wechselt man in den entsprechenden Kontext.

#### Typfilter

Im Filtermenü

![Filter Menü](manual/filter_menu.png)

kann jeweils eine Auswahl für einen Ressourcentyp getroffen werden. Die Auswahl kann sich hierbei
entweder direkt auf einen Typ (z.B. "Erdbefund") oder eine ganze Typengruppe (z.B. "Stratigraphische Einheit")
beziehen. Im ersten Fall werden nur Ressourcen vom entsprechenden Typ angezeigt, im letzteren Fall werden Ressourcen
vom ausgewählten Typ inklusive aller seiner Subtypen angezeigt. Bei einer Auswahl von z.B. 
"Stratigraphische Einheit" werden Ressourcen vom Typ "Stratigraphische Einheit", "Erdbefund", "Architektur", "Fußboden" 
etc. angezeigt. Welche Typen zur Auswahl stehen, hängt jeweils vom gerade aktiven Kontext ab.   

#### Textfilter

Suchbegriffe werden derzeit mit den Felder Bezeichner und Kurzbeschreibung von Ressourcen abgeglichen. 
 
Ein Beispiel: In der Ressourcenübersicht ist der Typfilter "Schnitt" ausgewählt und es gibt 
drei Schnitte wie folgt:

    (1)
    Bezeichner: "S01"
    Kurzbeschreibung: "Schnitt 01"
    
    (2)
    Bezeichner: "S02"
    Kurzbeschreibung: "Schnitt 02"
    
    (3)
    Bezeichner: "ms1"
    Kurzbeschreibung: "Mein Schnitt 1" 

Alle möglichen **Suchtokens** sind die jeweils durch Leerzeichen getrennten Begriffe in den Bezeichnern und 
Kurzbeschreibungen, also "s01, s02, schnitt, 01, 02, ms1, mein, schnitt, 1".
  
Der Suchbegriff "s01" liefert beispielsweise (1), die Suche nach "mein" liefert (3) als Suchtreffer, 
**Groß- und Kleinschreibung** spielt dabei keine Rolle und wird ignoriert.

Der Suchbegriff "s0" liefert (1) und (2) als Suchtreffer, da die Bezeichner von (1) und (2) mit "s0" beginnen.
Es handelt sich um eine sogenannte **Präfix-Suche**. Eine Suche nach "Schn" liefert (1), (2) und (3) zurück, 
eine Suche nach "itt" oder "chni" hingegen nichts.

#### Platzhaltersuche

Im Textfilter ist auch eine Platzhaltersuche möglich. Diese ist auf einen Platzhalter beschränkt und funktioniert 
wie folgt:

    (1) Bezeichner: "Landscape-0001"
    (2) Bezeichner: "Landscape-0009"
    (3) Bezeichner: "Landscape-0010"
    (4) Bezeichner: "Landscape-0011"
    (5) Bezeichner: "Landscape-0022"

Eine Suche nach "Landscape-00[01]" liefert (1), (2), (3), (4), da für die dritte Ziffer sowohl 0 als auch 1
als zulässige Zeichen angegeben wurden. Alle weiteren Zeichen danach sind aufgrund der Präfix-Suche erlaubt.

Eine Suche nach "Landscape-00[01]1" liefert (1) und (4), da die Ziffer nach dem Platzhalter genau eine 1 sein muss.

### Erweiterter Suchmodus

In den Ressourcenansichten kann mit Klick auf das Lupensymbol
 
 ![Lupensymbol](manual/looking_glass.png)
 
 die erweiterte Suche aktiviert werden. Ein blaues Lupensymbol zeigt an, das der erweiterte Suchmodus aktiviert ist.
 
#### Suchverhalten
 
Wir die Suche in der Übersicht aktiviert, werden nicht nur Ressourcen von Maßnahmentypen und Orte gelistet,
sondern sämtliche im Projekt angelegten Ressourcen. Bitte beachten Sie, dass die Anzahl der gleichzeitig 
angelegten Ressourcen aus Performancegründen immer auf maximal **200** beschränkt ist (das Programm zeigt die weiteren 
Ressourcen nicht an, zeigt aber an, wann die Beschränkung aktiv ist). Es sollte also in jedem Fall weiter
mittels Text- oder Typfilter gefiltert werden. Der Typfilter bietet in dem Fall auch Typen aus anderen Maßnahmen
an. So kann in der Suchübersicht beispielsweise im gesamten Projekt nach allen Ressourcen vom Typ "Keramik"
gesucht werden.
 
In den Maßnahmenansichten wird jeweils in der gesamten gerade ausgewählten Maßnahme gesucht, wobei eine Hierarchie,
wie sie durch "Liegt in"-Beziehungen angelegt wird, ignoriert wird. Es kann auch über alle Maßnahmen eines bestimmten
Typs gleichzeitig gesucht werden. Hierzu steht die Option "Alle" zur Verfügung, die nicht angezeigt wird, wenn
der erweiterte Suchmodus nicht aktiviert ist 

![Alle Maßnahmen](manual/all_operations.png)
  
Im erweiterten Suchmodus ist das Anlegen von Ressourcen nicht möglich. 

### Spezifische Suchkriterien
 
Ist der erweiterte Suchmodus aktiviert, ist es, sobald ein Typfilter aktiviert ist, möglich, eine Suche
über spezifische Felder einer Ressource anzustoßen. Dabei werden Felder zur Suche angeboten, die der entsprechenden
Typendefinition entsprechen. Es können ein oder mehrere Werte ausgewählt werden. 

![Suchkriterien](manual/criteria_search.png)

Handelt es sich um Freitextfelder, so kann ein genauer Suchbegriff eingestellt werden. Achtung: Im Gegensatz zum Suchfilter 
wird hier keine Präfix-Suche verwendet. Der eingestellte Begriff muss exakt so mit dem Feldinhalt des entsprechenden
Feldes einer Ressource übereinstimmen, damit die Ressource im Suchergebnis auftaucht. Bei Feldern mit Wertelisten
können die Suchbegriffe direkt aus einer entsprechenden Werteliste ausgewählt werden. 

Neben der Auswahl mehrerer Suchbegriffe und der Notwendigkeit, einen Typfilter auszuwählen, funktioniert 
die Suche selbstverständlich auch in Kombination mit dem Textfilter.



 
 
## First steps

After starting the client for the first time, the project "test" will be active, allowing you to experiment
with the application's functionality using a set of test data. Please note that as long as the test project is
selected, any newly created data sets will be deleted and all changes will be reset when restarting the
client. For this reason, synchronization with other clients or databases is not performed for the test
project.  

In order to work with the client productively, you should first follow these steps:

1. The submenu **Settings**, which is accessible via the menu "iDAI.field" (MacOS) respectively "File"
(Windows), allows you to change some basic settings applied to all projects. As a first step, please enter
your editor name. This name will be stored in the database along with every change you make. It is strongly
recommended to fill in this field, especially if data is going to be synchronized with other clients.  

2. In the submenu **Settings** you can also change the path to the image directory. This may be necessary if
you want to access an image directory located on a network device (NAS) used by several users simultaneously.
Please note that in each case images must be imported via the client. Image files that are manually placed in
the image directory can **not** be used by the application. 

3. Click on the project name "test" in order to open the **Project management**. In this menu, you can create
a new project by clicking the plus button. Allowed characters for the project name are letters, numbers and
hyphens.

4. As soon as the new project has been loaded, you can enter basic project data by clicking the edit
button in the project management menu. First of all, you should create the lists of **staff members** (field
"Staff" of section "Project") and **campaigns** (field "Campaigns", also of section "Project"). You can extend
these lists at any time.

Use the menu option **Create backup**, which is accessible via the menu "Tools", to create backup files of
your project data regularly.

<hr>

## Resources

<<<<<<< HEAD
<<<<<<< HEAD
<<<<<<< HEAD
The entities stored in the database, such as "trench", "images", "finds", "types", "stratigraphical units" etc. are called 
"resources". The resource management facilities are at the core of iDAI.field. Resources can be realated to each 
other, in that way the information entered into iDAI.field becomes structured. For example: images can be linked to finds and finds can be 
set within stratigraphical units etc. The various resources in iDAI.field fulfill specific functionalities to cover
the general needs of archaeological documentation. Each resource is configured with a set of attributes called 
"fields" which must be filled in with "values" by the user to produce valuable data.

### Project

The "project" is the highest level resource of iDAI.field - all other resources must be within a "project". With your 
installation of iDAI.field you can work on multiple projects. In the app, click on the top-right name of the project to
create, modify or delete projects. 

<p align="center"><img src="images/en/resources/manage_projects.png" alt="Manage projects"/></p>

### Creating, modifying and deleting resources

All resources are created in more or less the same way. Wherever you find a green plus button you are able to 
create a new resource of a specific category. After creating a project or opening 
an existing one, you begin in the tab **Overview** (recognizable by the home symbol) where all of the project's operations 
and places are managed. Use the green plus button at the bottom of the resources list to create a new operation.
=======
The resource management facilities are at the core of iDAI.field.

=======
The resource management facilities are at the core of iDAI.field.

>>>>>>> parent of 17455b04f... Update manual.en.md
=======
The resource management facilities are at the core of iDAI.field.

>>>>>>> parent of 17455b04f... Update manual.en.md
### Operations

After creating a project or opening an existing one, you begin in the tab **Overview** (recognizable by the
home symbol) where all of the project's operations and places are managed.

Use the green plus button at the bottom of the resources list to create a new operation.
<<<<<<< HEAD
<<<<<<< HEAD
>>>>>>> parent of 17455b04f... Update manual.en.md
=======
>>>>>>> parent of 17455b04f... Update manual.en.md
=======
>>>>>>> parent of 17455b04f... Update manual.en.md

<p align="center"><img src="images/en/resources/create_operation.png" alt="Create operation resource"/></p>

In the process, you firstly choose the category of the operation, before you may optionally create a geometry
for the new resource. Afterwards the editor is opened, where all data of the operation can be filled in.
Depending on the chosen operation category, different fields are available, which are arranged in multiple
groups. You can switch between field groups by clicking the buttons on the left side.

Before the resource can be saved via the green save button, at the very least the **identifier** field in the
core section has to be filled in.

<p align="center"><img src="images/en/resources/save_operation.png" alt="Save operation resource"/></p>

<<<<<<< HEAD
<<<<<<< HEAD
<<<<<<< HEAD
The process of creating resources works in this way no matter which category of resource is being created. 
Always the **identifier** is the very least information which needs to be entered. It is not possible to
create a resource if the identifier is already existing in the current project. After saving the new operation is 
displayed in the resources list with a circular icon including the initial letter of the resource category.

You can come back to a resource after you have saved it and modify it by double clicking it on the resource list on the left window or
by right clicking a resource in the list. Right-click will open a context menu providing the following options:

* *Edit*: Opens the editor (also available by doubleclicking the resource entry in the list)
* *Move*: Allows removing the resource from its current context and assigning it to another parent resource
* *Delete*: Removes the resource after a security check

Furthermore, the context menu contains options for creating and editing geometries.

<p align="center"><img src="images/en/resources/context_menu.png" alt="Kontextmenü"/></p>

Deleting resources is so dangerous to the database, that answering the security check is mandatory. In cases where 
mass manipulation becomes necessary refer to the respective chapter in this manual. 

### Geometries of resources

For any resource in iDAI.field a geometry can be supplied. It represents the geographical extend or location of the respective resource.
Whenever you create a new resource you will be asked if you want to create a geometry as well. You can, i.e. vectorize
stratigraphical units pictured on a hand-drawn, scanned and georeferenced plan or digital orthoimage. Go to **Image management** to 
read more about georefenced images in iDAI.field.

The mapping functionalities in iDAI.field are basic and include import, export, storing, vectorizing and viewing 
2D-geometries (points, lines, polygons) attached to resources.

The ability of iDAI.field to handle geometries on a map is essential for an archaeological information system because all archaeological data should be localized explicitly.
The Geographical Information System (GIS) functionalities in iDAI.field allow for basic vectorizing, however it is not planned to replace a full-fledged GIS like QGIS or ArcGIS. 
At the moment (Version 2.15.3) the app does not support reprojections, thus, it cannot project geometries of different cooridate systems on the same map.  
Length, and area measurements and more elaborate spatial analysis must be preformed with other software (QGIS, R etc.). 

Geometries in iDAI.field are compatible with GIS. All resources with geometries can be exported as a geojson file which can easily be imported in GIS.
In iDAI.field, click on **Export** within the "File"-tab, select "Format" : "GeoJSON" and filter by "Operation" if needed.
Save all resources with geometries in your database to one file. Mind that only resources with geometry and
that only the fields "identifier", "category" and "shortDescription" are being exported together with the geometries.

<p align="center"><img src="images/en/resources/export_geojson.png" alt="Export Geojson"/></p>

In QGis open the "Data Source Manager" and go to the "Vector"-tab select "Source Type" : "File" and search for 
the GeoJSON-file exported from iDAI.field. Open and add it to your QGis-Project. If you have different "Geometry types" in your 
GeoJSON, QGis will have to split the Geometries into homogene layers and thus seperate points, lines and polygons.
Your data is now represented as layers with features, each feature corresponds to one resource in your iDAI.field database.
Check the layers properties to make sure the correct coordinate reference system is selected.

<p align="center"><img src="images/en/resources/import_geojson_qgis.png" alt="Import Geojson to QGIS"/></p>





#### Image management








However  For 

In iDAI

### Places

The **Place** resource shall represent the research site generally and can simply be documented with a single central point and the name of the site.
Best practice is to give the GazetteerID used for this site on https://gazetteer.dainst.org.

### Operations 

Within the **Overview** tab it is not possible to create finds or features. Before creating actual archaeological entities 
it is required to create **Operations**, meaning research operations like "excavation" (trench), "survey" (survey area) and "building research" (building).
The geometries which ought to be created for the operations shall represent the actual research area or object.
The fields in the respective operation category ask for specific organisational and methodological information.

Use the button "Switch to operation" (Symbol: Arrowup right) in order to enter this operation.
=======
The new operation is now displayed in the resources list. Use the button "Switch to operation" (Symbol: Arrow
up right) in order to open a new tab for the operation.
>>>>>>> parent of 17455b04f... Update manual.en.md
=======
The new operation is now displayed in the resources list. Use the button "Switch to operation" (Symbol: Arrow
up right) in order to open a new tab for the operation.
>>>>>>> parent of 17455b04f... Update manual.en.md
=======
The new operation is now displayed in the resources list. Use the button "Switch to operation" (Symbol: Arrow
up right) in order to open a new tab for the operation.
>>>>>>> parent of 17455b04f... Update manual.en.md

<p align="center"><img src="images/en/resources/goto_operation.png" alt="Open operation resource"/></p>

Depending on the category of the operation, resources of different categories can be created within an
operation tab via the plus button (e. g. stratigraphical units within a trench or rooms within a building).

<p align="center"><img src="images/en/resources/create_more.png" alt="Create resource"/></p>

<<<<<<< HEAD
<<<<<<< HEAD
<<<<<<< HEAD
### 


=======
>>>>>>> parent of 17455b04f... Update manual.en.md
=======
>>>>>>> parent of 17455b04f... Update manual.en.md
=======
>>>>>>> parent of 17455b04f... Update manual.en.md
### Hierarchical ordering

Resources can be arranged in hierarchical structures, for example to assign finds to a stratigraphical unit.
Use the button "Show child resources" (Symbol: rectangular arrow down right) to show a list of all resources
that are subordinate to the selected resource. This list is initially empty for a newly created resource.

<p align="center"><img src="images/en/resources/open_collection.png" alt="Open collection"/></p>

By clicking "Open collection" you can switch to the lower level of the hierarchy, which means that now the
subordinated resources are shown (e. g. the finds of a stratigraphical unit).
Usage of the plus button will now lead to all resources getting created at that level. 

The navigation path above the resources list indicates the currently selected hierarchy level. You can always
switch to another level by clicking one of the buttons of the navigation path.

<p align="center"><img src="images/en/resources/navpath.png" alt="Navigation path"/></p>

### Management

Right clicking a resource in the list opens a context menu providing the following options:
<<<<<<< HEAD
<<<<<<< HEAD

* *Edit*: Opens the editor (also available by doubleclicking the resource entry in the list)
* *Move*: Allows removing the resource from its current context and assigning it to another parent resource
* *Delete*: Removes the resource after a security check

Furthermore, the context menu contains options for creating and editing geometries.

=======

* *Edit*: Opens the editor (also available by doubleclicking the resource entry in the list)
* *Move*: Allows removing the resource from its current context and assigning it to another parent resource
* *Delete*: Removes the resource after a security check

Furthermore, the context menu contains options for creating and editing geometries.

>>>>>>> parent of 17455b04f... Update manual.en.md
=======

* *Edit*: Opens the editor (also available by doubleclicking the resource entry in the list)
* *Move*: Allows removing the resource from its current context and assigning it to another parent resource
* *Delete*: Removes the resource after a security check

Furthermore, the context menu contains options for creating and editing geometries.

>>>>>>> parent of 17455b04f... Update manual.en.md
<p align="center"><img src="images/en/resources/context_menu.png" alt="Kontextmenü"/></p>


<hr>

## Search

In the **overview**, in the **operation tabs** as well as in the **image management** (accessible via the menu
"Tools"), a **search filter** is available. You can use it to restrict the currently displayed resources by
the means of some basic search criteria (identifier, short description, category).

If you want to express more complex search queries, you can furthermore switch into the **extended search
mode** while in the **overview** or one of the **operation tabs**. This mode allows you to expand the search
bypassing hierarchical orderings, to search over the whole project and to define additional field specific
search criteria.

### Search filter

The search filter is a fast way to show or hide resources based on specific criteria. It consists of a
*text filter* (an input field) and a *category filter* (a blue button).

<p align="center"><img src="images/en/search/search_filter.png" alt="Search filter"/></p>

After entering a search term and/or choosing a category, only the resources matching these filter
criteria are shown. In the **overview** and the **operation tabs**, this affects all resources in the left
sidebar and on the map (in map view) respectively the elements of the list (in list view). In the **image
management**, all images shown in the grid are affected by the search filter.


#### Category filter

<p align="center"><img src="images/en/search/filter_menu.png" alt="Category filter selection"/></p>

The category filter button allows you to choose a resource category. There are supercategories and
subcategories: If you choose a subcategory (e. g. "Layer"), only the resources of the respective category are
shown. In contrast, if you choose a supercategory (e. g. "Stratigraphical unit"), the resources of the
selected category as well as all of its subcategories (e. g. "Layer", "Grave", "Architecture", "Floor" etc.)
are included. Click again to select only the supercategory itself.

The current context decides which categories are available: In the overview you can choose operation
categories, in the image management image categories etc.


#### Text filter

Search terms are currently compared with the resource fields "Identifier" and "Short description".
 
*Example:*
 
The following three trenches are shown in the overview:

    (1)
    Identifier: "T01"
    Short description: "Trench-01"
    
    (2)
    Identifier: "T02"
    Short description: "Trench-02"
    
    (3)
    Identifier: "mt1"
    Short description: "My trench 1" 

**Possible search terms** are the text strings of the identifiers and short descriptions, each split by space
characters or hyphens, as in the example: "T01", "T02", "mt1", "Trench", "01", "02", "My", "1".  

Therefore, a search for the term "t01" returns the resource (1), and a search for "my" returns (3) as a
result. **Capitalization** is ignored. 
  
The search performed is a so-called **prefix search**, which means that in each case the beginning of the
search term is checked: As the identifiers of (1) and (2) start with the text string "t0", a search for the
term "t0" returns (1) as well as (2) as results. A search for "tr" returns (1), (2) and (3), while a search
for "ench" or "ren" returns nothing.


#### Placeholder search

When entering text into the text filter field, placeholders can be used: Instead of a single character, you
can specify a set of different allowed characters within square brackets. Such a placeholder can be used one
time per search query.

*Example:*

    (1) Identifier: "Landscape-0001"
    (2) Identifier: "Landscape-0009"
    (3) Identifier: "Landscape-0010"
    (4) Identifier: "Landscape-0011"
    (5) Identifier: "Landscape-0022"

A search for "Landscape-00[01]" returns (1), (2), (3), (4), because 0 as well as 1 are defined as allowed
characters for the third digit. All following characters are allowed due to the prefix search.

A search for "Landscape-00[01]1" returns (1) and (4), as the digit after the placeholder must be a 1.


#### Search results from other contexts

If no search results are found in the current context, search results from other contexts are shown below the
text input field.

<p align="center"><img src="images/en/search/other_contexts.png" alt="Search results from other contexts"/></p>

By clicking one of the resources, you can immediately switch to the corresponding context and select the
resource.


### Extended search mode

In the **overview** as well as in the **operation tabs**, you can switch to the extended search mode by
clicking the magnifier button.
 
<p align="center"><img src="images/en/search/extended_search_button.png" alt="Extended search mode button"/></p>

The extended search mode allows searching over larger amounts of data:

* In the **overview**, the search is performed over all of the project's resources.
* In the **operation tabs**, the search is performed over all of the operation's resources.

In both cases all the resources found get shown in the list on the left side. The buttons "Show in context"
(Symbol: Arrow up) respectively "Show in context of an operation" (Symbol: Arrow up right) allow you to
switch to the hierarchical context of a resource; in doing so the extended search mode is ended and a new tab
is opened if necessary.

<p align="center"><img src="images/en/search/show_in_context.png" alt="Show in context"/></p>

While in extended search mode, it is not possible to create resources, which is indicated by the deactivated
create button. In order to create new resources, please leave the extended search mode.

The number of search results shown simultaneously is restricted to a maximum of **200** for performance
reasons. Other resources are not displayed by the application and instead a notice is shown informing about
the maximum being exceeded. Add further search criteria or leave the extended search mode in order to access
these resources. 


#### Field specific search criteria
 
If the extended search mode is activated, you can start a search over specific fields of a resource by
clicking the plus button to the left of the category filter button. Fields available for search are those
corresponding to the selected category. You can choose as many fields as you want in order to combine
multiple search criteria. Of course, you can also use the field specific search criteria in combination with
the text filter. 

<p align="center"><img src="images/en/search/criteria_search.png" alt="Field specific search criteria"/></p>

In case of a text field, just enter the search term directly; for fields with value lists, choose the term
from a list of all allowed values in a dropdown menu. 

**Important**: In contrast to the search filter, no prefix search is performed in this case. The chosen search
term must match the content of the resource field exactly for the resource to appear in the list of search
results. 

As an alternative to specifying a particular search term, you can also search for all resources in which the
field is set (option "Any value") or not set (option "No value"). 

The number appearing next to the category filter button indicates the number of active search criteria. You can
remove search criteria by clicking the number. This opens up the menu again and you can choose the search
criterion to remove.


<hr>


## Matrix

The **Matrix** view (accessible via the menu "Tools") displays a matrix for each trench of the project,
generated automatically from the stratigraphical units of the respective trench. The edges of the matrix are
built on the basis of the relations created for the units.

<p align="center"><img src="images/en/matrix/trench_selection.png" alt="Trench selection"/></p>

Choose the trench for which a matrix shall be generated via the dropdown button on the left side of the
toolbar.


### Options

Via the **Options button** in the upper right corner of the matrix view, you can customize the matrix
visualization by adjusting different settings. The chosen settings are applied to all matrices for all of the
project's trenches and are preserved when restarting the application.

<p align="center"><img src="images/en/matrix/matrix_tools.png" alt="Options menu"/></p>


#### Relations

* *Temporal*: Edges are built based on the relations "Before", "After" and "Contemporary with" (field group
"Time"). 
* *Spatial*: Edges are built based on the relations "Above", "Below", "Cuts", "Cut by" and "Equivalent to"
(field group "Position").


#### Edges

* *Straight*: All edges are composed of straight lines.
* *Curved*: Edges may be curved if there is no direct connecting line between two units of the matrix.


#### Group by period

Activate this option in order to group the stratigraphical units of the matrix based on the value of the field
"Period". If two values are set for the field (from/until), the value of "Period (from)" is used in each case.
Stratigraphical units with equal period values are placed close to each other and framed by a rectangle. 

<p align="center"><img src="images/en/matrix/matrix_phases.png" alt="Group by period"/></p>


### Navigation

Move the mouse with the **right mouse button** pressed in order to change the position of the matrix within
the display area. Use the **mouse wheel** or the **zoom buttons** in the upper left corner of the display area
to adjust the zoom level. By using the **left mouse button**, you can interact with units of the matrix; the
type of interaction (editing or selection) depends on the selected interaction mode.

When the mouse cursor is moved over a unit, the edges starting at this unit are highlighted in color: Green
lines show connections to units on higher levels, blue ones to units on lower levels and orange ones to units
on the same level of the matrix. 


### Editing

By default, the **edit mode** is active: Click a unit in the matrix in order to open up the editor allowing
you to make changes to the corresponding resource. In this way, you can also change the position of the unit
within the matrix by editing the relations in the field groups "Time" respectively "Position". After clicking
**Save**, the matrix is updated automatically on the basis of the changed data. 


### Display of sub-matrices

To facilitate the overview in large matrices, sub-matrices can also be generated from selected units of the
matrix. Use the buttons on the right side of the toolbar in order to select units and create a new sub-matrix
from the current selection: 

<p align="center"><img src="images/en/matrix/interaction_mode_buttons.png" alt="Interaction mode buttons"/></p>

* *Edit mode*: Units can be edited by left click.
* *Single selection mode*: Units can be selected and deselected separately by left click.
* *Group selection mode*: Units can be selected in groups by drawing a rectangle using the mouse.

<p align="center"><img src="images/en/matrix/subgraph_buttons.png" alt="Sub-matrix creation buttons"/></p>

* *Deselect*: All units are deselected.
* *Create matrix from selection*: A new matrix is generated consisting only of the selected units. Edges are
  still built on the basis of all stratigraphical units of the trench; thus the function can also be used as a
  fast way to check if two units are connected across multiple relations/resources.
* *Reload matrix*: The original matrix with all stratigraphical units of the selected trench is restored.
  

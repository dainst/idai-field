# iDAI.field

This is a monorepo containing five packages:

* [Field Desktop](desktop): The Field Desktop client based on AngularJS and Electron
* [Field Mobile](mobile): The Field Mobile client based on React Native
* [Field Server](server): The FieldHub server application
* [Field Core](core): Shared TypeScript modules
* [iDAI.field Web](web): The iDAI.field Web publication platform

## Collaborative work

Field supports automatic database- and filesyncing between different Field Desktop Clients and FieldHub. Here are some network topologies currently in use.

### Syncing between <span style="color: #008B00;">desktop</span> clients only

This setup does not require a FieldHub server installation. All researchers sync between their machines (laptops or desktop PCs) directly.

```mermaid
flowchart LR;
    A[Researcher A] <--> B[Researcher B];
    A[Researcher A] <--> C[Researcher C];
    C[Researcher C] <--> D[Researcher D];
    C[Researcher C] <--> E[Researcher E];
    A[Researcher A] <--> E[Researcher E];
    
    classDef default color:#fff
    style A fill:#008B00
    style B fill:#008B00
    style C fill:#008B00
    style D fill:#008B00
    style E fill:#008B00
```

### Syncing between <span style="color: #008B00;">desktop</span> clients and institution's <span style="color: #00008B;">FieldHub</span> server

If your institution wants to collect all research data centrally, you may setup a FieldHub server instance and let all your researchers sync to it.

```mermaid
flowchart LR;
    Hub[FieldHub Server] <--> A[Researcher A, Project A];
    Hub[FieldHub Server] <--> B[Researcher B, Project A];
    Hub[FieldHub Server] <--> C[Researcher C, Project B];
    Hub[FieldHub Server] <--> D[Researcher D, Project B];

    classDef default color:#fff
    style Hub fill:#00008B
    style A fill:#008B00
    style B fill:#008B00
    style C fill:#008B00
    style D fill:#008B00
```

### Using a <span style="color: #008B00;">Desktop</span> client as a pseudo proxy server

If bandwidth is a concern on excavation, you may also use a Desktop PC/Laptop on site running the desktop client as a local 'pseudo server' to collect data and facilitate syncing to your institution's FieldHub server. This will reduce redundant upload/download bandwith usage compared to the topology variant above.

```mermaid
flowchart LR;
    Pseudo[Pseudo Server] <-->  Hub[FieldHub Server];
    Pseudo[Pseudo Server] <--> A[Researcher A];
    Pseudo[Pseudo Server] <--> B[Researcher B];
    Pseudo[Pseudo Server] <--> C[Researcher C];
    Pseudo[Pseudo Server] <--> D[Researcher D];

    classDef default color:#fff
    style Hub fill:#00008B
    style Pseudo fill:#008B00
    style A fill:#008B00
    style B fill:#008B00
    style C fill:#008B00
    style D fill:#008B00
```

### Mix and match

The topologies above can also be combined.

```mermaid
flowchart LR;
    Pseudo[Pseudo Server] <-->  Hub[FieldHub Server];
    Pseudo[Pseudo Server] <--> A[Researcher A, Project A];
    Pseudo[Pseudo Server] <--> B[Researcher B, Project A];
    Hub[FieldHub Server] <--> C[Researcher C, Project B];
    Hub[FieldHub Server] <--> D[Researcher D, Project B];
    A[Researcher A, Project A] <--> E[Researcher E, Project A];
    A[Researcher A, Project A] <--> F[Researcher F, Project A];
    G[Researcher G, Project A] <--> Hub[FieldHub Server];

    classDef default color:#fff
    style Hub fill:#00008B
    style Pseudo fill:#008B00
    style A fill:#008B00
    style B fill:#008B00
    style C fill:#008B00
    style D fill:#008B00
    style E fill:#008B00
    style F fill:#008B00
    style G fill:#008B00
```

## Post-project data usage

After field research documentation has been created using [Field Desktop](desktop), there are several ways to process or publish your data.
* Export CSV/GeoJSON/Shapefiles from within the Field Desktop client.
* Import your data in [R](https://www.r-project.org) using [sofa](https://github.com/ropensci/sofa), an example implementation by [Lisa Steinmann](https://orcid.org/0000-0002-2215-1243) can be found [here](https://github.com/lsteinmann/idaifieldR).

## Development

The repository uses [lerna](https://github.com/lerna/lerna) to manage sub-package dependecies.
When first checking out the code base, bootstrap the dependencies with:

    $ npm run bootstrap

Refer to the sub-package READMEs for detailed instructions on how to set up individual
development environments.

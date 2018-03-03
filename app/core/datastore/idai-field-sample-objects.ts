import {Document} from 'idai-components-2/core';


export const DOCS: Array<Document> = [
    {
        "resource": {
            "id": "test",
            "identifier": "test",
            "shortDescription": "Testprojekt",
            "relations": {
                "isRecordedIn": []
            },
            "type": "Project"
        }
    },
    {
        "resource": {
            "id": "t1",
            "identifier": "trench1",
            "shortDescription": "Goldener Schnitt",
            "relations": {
                "isRecordedIn": [ "test" ]
            },
            "geometry": {
                "type": "Point",
                "coordinates": [ -0.8994746477806455, -0.9951833618310227, -5.45066680229818 ]
            },
            "type": "Trench"
        }
    },
    {
        "resource": {
            "id": "t2",
            "identifier": "trench2",
            "shortDescription": "3D-Testschnitt",
            "relations": {
                "has3DRepresentation": [ "obj3d", "vra_trench", "vra_trench_georef" ],
                "isRecordedIn": [ "test" ]
            },
            "type": "Trench"
        }
    },
    {
        "resource": {
            "id": "c1",
            "identifier": "context1",
            "shortDescription": "Ein Befund",
            "relations": {
                "isRecordedIn": [ "t1" ],
                "includes": [ "tf1", "wall1" ]
            },
            "geometry": {
                "type": "Point",
                "coordinates": [ 27.1892209283, 39.1411510096 ]
            },
            "type": "Feature"
        }
    },
    {
        "resource": {
            "id": "l1",
            "identifier": "layer1",
            "shortDescription": "Erdbefund",
            "relations": {
                "isRecordedIn": [ "t1" ]
            },
            "geometry": {
                "type": "Polygon",
                "coordinates": [[
                    [ -0.3877585029102312, -0.46227262115293377, -4.815723748738051 ],
                    [ -0.24837439727090138, 0.20747249047775296, -4.8734058885751065 ],
                    [ 0.13019944929879645, 0.4261670459494882, -4.859676229120316 ],
                    [ 0.7387265662420579, 0.4550025087401067, -4.982321189861148 ],
                    [ 0.6242972784800536, -0.4181520006665652, -4.905370749217381 ],
                    [ 0.34671502420224276, -0.5783505400429254, -4.891124986111626 ],
                    [ 0.0917967743690784, -0.595520053612953, -4.865325730424526 ],
                    [ -0.3877585029102312, -0.46227262115293377, -4.815723748738051 ]
                ]]
            },
            "type": "Feature"
        }
    },
    {
        "resource": {
            "id": "tf1",
            "identifier": "testf1",
            "shortDescription": "Testfund",
            "relations": {
                "isRecordedIn": [ "t1" ],
                "liesWithin": [ "c1" ],
                "has3DRepresentation": [ "brandlehm"]
            },
            "geometry": {
                "type": "Point",
                "coordinates": [ 27.1892609283, 39.1411810096 ]
            },
            "type": "Find"
        }
    },
    {
        "resource": {
            "id": "w1",
            "identifier": "wall1",
            "shortDescription": "Mauer",
            "relations": {
                "isRecordedIn": [ "t1" ],
                "includes": [ "c1" ]
            },
            "geometry": {
                "type": "LineString",
                "coordinates": [
                    [ -2.2095436172975216, -1.436992752962385, -5.102948079909838 ],
                    [ -1.8109481359427646, -1.5983842407899034, -5.038467276526666 ],
                    [ -1.3305057824768185, -1.5953595641055394, -5.000968914089073 ],
                    [ -0.8972719087199742, -1.800754498503687, -5.001872175929329 ],
                    [ -0.38366033811825595, -1.8849288056426847, -5.072992699627526 ],
                    [ 0.17176131734742994, -1.9461711775762744, -5.19699178993693 ],
                    [ 0.4232096508073948, -1.8506835891849063, -5.030903031922371 ]
                ]
            },
            "type": "Feature"
        }
    },
    {
        "resource": {
            "id": "o25",
            "identifier": "PE07-So-07_Z001.jpg",
            "shortDescription": "Test Layer 1",
            "type": "Drawing",
            "originalFilename" : "PE07-So-07_Z001.jpg",
            "height" : 2423,
            "width" : 3513,
            "relations": {
                "depicts": []
            },
            "georeference": {
                "bottomLeftCoordinates": [0.0, 0.0],
                "topLeftCoordinates": [5.0, 0.0],
                "topRightCoordinates": [5.0, 10.0]
            }
        }
    },
    {
        "resource": {
            "id": "o26",
            "identifier": "mapLayerTest2.png",
            "shortDescription": "Test Layer 2",
            "type": "Image",
            "relations": {
                "depicts": []
            },
            "originalFilename" : "mapLayerTest2.png",
            "height" : 782,
            "width" : 748,
            "georeference": {
                    "bottomLeftCoordinates": [0.0, 0.0],
                    "topLeftCoordinates": [0.5, 0.0],
                    "topRightCoordinates": [0.5, 0.5]
                }
        }
    },
    {
        "resource": {
            "id": "obj3d",
            "identifier": "object3d",
            "shortDescription": "3D-Testobjekt",
            "type": "Object3D",
            "relations": {
                "is3DRepresentationOf": ["t2"]
            }
        }
    },
    {
        "resource": {
            "id": "vra_trench",
            "identifier": "vraTrench",
            "shortDescription": "VRATrench",
            "type": "Object3D",
            "relations": {
                "is3DRepresentationOf": ["t2"]
            }
        }
    },
    {
        "resource": {
            "id": "vra_trench_georef",
            "identifier": "vraTrenchGeoref",
            "shortDescription": "VRATrench (georeferenziert)",
            "type": "Object3D",
            "relations": {
                "is3DRepresentationOf": ["t2"]
            }
        }
    },
    {
        "resource": {
            "id": "brandlehm",
            "identifier": "brandlehm",
            "shortDescription": "Brandlehm",
            "type": "Object3D",
            "relations": {
                "is3DRepresentationOf": ["tf1"]
            }
        }
    }
];

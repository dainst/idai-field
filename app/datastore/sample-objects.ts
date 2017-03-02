import {IdaiFieldDocument} from '../model/idai-field-document';

export var DOCS: IdaiFieldDocument[] = [
    {
        "resource": {
            "id": "o1",
            "identifier": "ob1",
            "shortDescription": "Obi One Kenobi",
            "relations": {
                "depictedIn": ["o21"]
            },
            "geometries": [{ "type": "Polygon","coordinates":
                [[[2.34375,-2.90625],[0.7421875,-2.8984375],[0.7421875,-3.921875],[2.34375,-3.90625]]]
                ,"crs":"local"
            }],
            "type": "jedi"
        },
        "synced": 0
    }, {
        "resource": {
            "id": "o2",
            "identifier": "ob2",
            "shortDescription": "Boba Fett",
            "relations": {
                "depictedIn": ["o13"]
            },
            "geometries": [{
                "type":"Point","coordinates":[4.71875,-12.96875],"crs":"local"
            }],
            "type": "dude"
        },
        "synced": 0
    }, {
        "resource": {
            "id": "o3",
            "identifier": "ob3",
            "shortDescription": "Luke Skywalker",
            "type": "jedi",
            "lightsaber_color": ["Blau", "Grün"],
            "relations": {
                "sonOf": ["o6"],
                "friendOf": ["o4", "o5"],
                "origin": ["o7"],
                "depictedIn": ["o24"]
            },
            "geometries": [{
                "type": "Polygon","coordinates":
                    [[[2.140625,9.71875],[1.265625,9.796875],[1.234375,9.15625],[-3.796875,9.171875],[-3.8125,7.578125],
                        [-3.171875,7.5],[-3.171875,8.484375],[1.28125,8.40625],[1.265625,7.5],[2.15625,7.484375]]],
                "crs": "local"
            }]
        },
        "synced": 0
    }, {
        "resource": {
            "id": "o4",
            "identifier": "ob4",
            "shortDescription": "Han Solo",
            "type": "dude",
            "relations": {
                "friendOf": ["o3", "o5"],
                "owns": ["o11"],
                "depictedIn": ["o12"]
            },
            "geometries": [{
                "type": "Point","coordinates": [0.828125,0.375],"crs": "local"
            }]
        },
        "synced": 0
    }, {
        "resource": {
            "id": "o5",
            "identifier": "ob5",
            "shortDescription": "Leia Organa",
            "type": "dude",
            "relations": {
                "friendOf" : ["o3", "o4"],
                "depictedIn": ["o16"]
            }
        },
        "synced": 0
    }, {
        "resource": {
            "id": "o6",
            "identifier": "ob6",
            "shortDescription": "Darth Vader",
            "type": "jedi",
            "lightsaber_color": ["Rot"],
            "relations": {
                "fatherOf" : ["o3"],
                "depictedIn": ["o14"]
            }
        },
        "synced": 0
    }, {
        "resource": {
            "id": "o7",
            "identifier": "ob7",
            "shortDescription": "Tatooine",
            "type": "planet",
            "relations": {}
        },
        "synced": 0
    },
    {
        "resource": {
            "id": "o8",
            "identifier": "ob8",
            "shortDescription": "Naboo",
            "type": "planet",
            "relations": {
                "depictedIn": ["o17"]
            }
        },
        "synced": 0
    },
    {
        "resource": {
            "id": "o9",
            "identifier": "ob9",
            "shortDescription": "Hoth",
            "type": "planet",
            "relations": {
                "depictedIn": ["o20"]
            }
        },
        "synced": 0
    },
    {
        "resource": {
            "id": "o10",
            "identifier": "ob10",
            "shortDescription": "Coruscant",
            "type": "planet",
            "relations": {}
        },
        "synced": 0
    },
    {
        "resource": {
            "id": "o11",
            "identifier": "ob11",
            "shortDescription": "Millenium Falcon",
            "type": "vessel",
            "relations": {
                "belongsTo": [ "o4" ],
                "depictedIn": ["o22"]
            }
        },
        "synced": 0
    },
    {
        "resource": {
            "id": "o12",
            "identifier": "hans.jpg",
            "shortDescription": "SWCA - Pink Chewie and Reno-911 Han Solo; Star Wars Celebration in Anaheim, April 2015.",
            "type": "image",
            "relations": {
                "depicts": ["o4"]
            },
            "filename" : "hans.jpg",
            "height" : 1066,
            "width" : 1599,
            "author" : "William Tung from USA"
        },
        "synced": 0
    },
    {
        "resource": {
            "id": "o13",
            "identifier": "boba.jpg",
            "shortDescription": "Boba Fett (the parade at DragonCon 2006).",
            "type": "image",
            "relations": {
                "depicts": ["o2"]
            },
            "filename" : "boba.jpg",
            "height" : 600,
            "width" : 452,
            "author": "Michael Neel from Knoxville, TN, USA"
        },
        "synced": 0
    },
    {
        "resource": {
            "id": "o14",
            "identifier": "vader.jpg",
            "shortDescription": "Bernie Thomas took this photograph of Darth Vader in Columbus Ohio on Friday of August 11th of 2006.",
            "type": "photo",
            "relations": {
                "depicts": ["o6"]
            },
            "filename" : "vader.jpg",
            "height" : 600,
            "width" : 793,
            "author": "Bernie Thomas"
        },
        "synced": 0
    },

    {
        "resource": {
            "id": "o16",
            "identifier": "leia.jpg",
            "shortDescription": "You can't unsee this. Read more at the Official Celebration IV blog. Costumes at Star Wars Celebration IV in 2007 at the Los Angeles Convention Center in Los Angeles.",
            "type": "image",
            "relations": {
                "depicts": ["o5"]
            },
            "filename" : "leia.jpg",
            "height" : 800,
            "width" : 533,
            "author": "Jenny Elwick"
        },
        "synced": 0
    },
    {
        "resource": {
            "id": "o17",
            "identifier": "naboo.jpg",
            "shortDescription": "Snoqualmie Falls",
            "type": "image",
            "relations": {
                "depicts": ["o8"]
            },
            "filename" : "naboo.jpg",
            "height": 853,
            "width": 1280,
            "author": "Meher Anand Kasam"
        },
        "synced": 0
    },
    {
        "resource": {
            "id": "o18",
            "identifier": "tatooine.jpg",
            "shortDescription": "Abstract in sand and sky",
            "type": "image",
            "relations": {},
            "filename": "tatooine.jpg",
            "height": 768,
            "width": 1024,
            "author": "Peter Dowley from Dubai, United Arab Emirates"
        },
        "synced": 0
    },



    {
        "resource": {
            "id": "o19",
            "identifier": "map.jpg",
            "shortDescription": "Star Wars: Knights of the Old Republic Quest map based on File:Galaxymap p1.jpg",
            "type": "image",
            "relations": {},
            "filename" : "map.jpg",
            "height" : 1695,
            "width" : 2400,
            "author": "W. R. van Hage and FR"
        },
        "synced": 0
    },
    {
        "resource": {
            "id": "o20",
            "identifier": "hoth.jpg",
            "shortDescription": "Star Wars Celebration V - scenes from the Hoth Echo Base Battle diorama",
            "type": "image",
            "relations": {
                "depicts": ["o9"]
            },
            "filename" : "hoth.jpg",
            "height" : 768,
            "width" : 1024,
            "author": "The Conmunity - Pop Culture Geek from Los Angeles, CA, USA"
        },
        "synced": 0
    },
    {
        "resource": {
            "id": "o21",
            "identifier": "gandalf.jpg",
            "shortDescription": "Gandalf the Grey",
            "type": "drawing",
            "relations": {
                "depicts": ["o1"]
            },
            "filename" : "gandalf.jpg",
            "height" : 768,
            "width" : 548,
            "author": "http://nidoart.blogspot.fr/"
        },
        "synced": 0
    },

    {
        "resource": {
            "id": "o22",
            "identifier": "enterprise.png",
            "shortDescription": "Copy of USS Enterprise NCC-1701-A from Star Trek movies",
            "type": "image",
            "relations": {
                "depicts": ["o11"]
            },
            "filename" : "enterprise.png",
            "height" : 315,
            "width" : 800,
            "author" : "Vulcan.jpg: dave_7"
        },
        "synced": 0
    },

    {
        "resource": {
            "id": "o23",
            "identifier": "ob23",
            "shortDescription": "Finn",
            "type": "dude",
            "relations": {}
        },
        "synced": 0
    },

    {
        "resource": {
            "id": "o24",
            "identifier": "finn.jpg",
            "shortDescription": "Finn",
            "type": "photo",
            "relations": {
                "depicts": ["o3"]
            },
            "filename" : "finn.jpg",
            "height" : 337,
            "width" : 300
        },
        "synced": 0
    },

    {
        "resource": {
            "id": "o25",
            "identifier": "mapLayerTest1.png",
            "shortDescription": "Test Layer 1",
            "type": "image",
            "relations": {},
            "filename" : "mapLayerTest1.png",
            "height" : 701,
            "width" : 845,
            "georeference": {
                "topLeftCoordinates": [25, -25],
                "topRightCoordinates": [25, 25],
                "bottomLeftCoordinates": [-25, -25]
            }
        },
        "synced": 0
    },

    {
        "resource": {
            "id": "o26",
            "identifier": "mapLayerTest2.png",
            "shortDescription": "Test Layer 2",
            "type": "image",
            "relations": {},
            "filename" : "mapLayerTest2.png",
            "height" : 782,
            "width" : 748,
            "georeference": {
                "topLeftCoordinates": [25, -75],
                "topRightCoordinates": [25, -25],
                "bottomLeftCoordinates": [-25, -75]
            }
        },
        "synced": 0
    },
];
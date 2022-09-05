package org.dainst.idaifield.converter;

import junit.framework.TestCase;
import org.dainst.idaifield.model.Geometry;
import org.dainst.idaifield.model.GeometryType;
import org.dainst.idaifield.model.Resource;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;

/**
 * @author Thomas Kleinke
 */
public class JsonlSerializerTest extends TestCase {

    public JsonlSerializerTest(String testName) {

        super(testName);
    }


    public void testGetJsonlForResourceWithFields() {

        Geometry geometry = new Geometry();
        geometry.setCoordinates(new double[][][][]{{{{ 1.0, 1.0 }}}});
        geometry.setType(GeometryType.MULTIPOINT);

        HashMap<String, String> shortDescription = new HashMap<String, String>();
        shortDescription.put("de", "Kurzbeschreibung");
        shortDescription.put("en", "Short description");

        Resource resource = new Resource();
        resource.setIdentifier("identifier");
        resource.setShortDescription(shortDescription);
        resource.setCategory("category");
        resource.setGeometry(geometry);

        List<Resource> resources = new ArrayList<>();
        resources.add(resource);

        assertEquals("{ \"identifier\": \"identifier\", "
                        + "\"shortDescription\": { \"de\": \"Kurzbeschreibung\", \"en\": \"Short description\" }, "
                        + "\"category\": \"category\", "
                        + "\"geometry\": { \"coordinates\": [1.0, 1.0], "
                        + "\"type\": \"Point\" } }\n",
                JsonlSerializer.getJsonl(resources)
        );
    }


    public void testGetJsonlForResourcesWithMultiGeometries() {

        Geometry geometry1 = new Geometry();
        geometry1.setCoordinates(new double[][][][]{
                {{{ 1.0, 1.0 }, { 1.0, 2.0 }, { 2.0, 2.0 }}},
                {{{ 3.0, 3.0 }, { 3.0, 4.0 }, { 4.0, 4.0 }}}
        });
        geometry1.setType(GeometryType.MULTIPOLYGON);

        Resource resource1 = new Resource();
        resource1.setIdentifier("identifier1");
        resource1.setGeometry(geometry1);

        Geometry geometry2 = new Geometry();
        geometry2.setCoordinates(new double[][][][]{{
                {{-1.0, -1.0}, {-1.0, -2.0}, {-2.0, -2.0}},
                {{-3.0, -3.0}, {-3.0, -4.0}, {-4.0, -4.0}}
        }});
        geometry2.setType(GeometryType.MULTIPOLYLINE);

        Resource resource2 = new Resource();
        resource2.setIdentifier("identifier2");
        resource2.setGeometry(geometry2);

        Geometry geometry3 = new Geometry();
        geometry3.setCoordinates(new double[][][][]{{{{ 5.0, 5.0 }, { -5.0, -5.0 }}}});
        geometry3.setType(GeometryType.MULTIPOINT);

        Resource resource3 = new Resource();
        resource3.setIdentifier("identifier3");
        resource3.setGeometry(geometry3);

        List<Resource> resources = new ArrayList<>();
        resources.add(resource1);
        resources.add(resource2);
        resources.add(resource3);

        assertEquals("{ \"identifier\": \"identifier1\", "
                        + "\"geometry\": { \"coordinates\": [[[[1.0, 1.0], [1.0, 2.0], [2.0, 2.0]]], "
                        + "[[[3.0, 3.0], [3.0, 4.0], [4.0, 4.0]]]], "
                        + "\"type\": \"MultiPolygon\" } }\n"
                        + "{ \"identifier\": \"identifier2\", "
                        + "\"geometry\": { \"coordinates\": [[[-1.0, -1.0], [-1.0, -2.0], [-2.0, -2.0]], "
                        + "[[-3.0, -3.0], [-3.0, -4.0], [-4.0, -4.0]]], "
                        + "\"type\": \"MultiLineString\" } }\n"
                        + "{ \"identifier\": \"identifier3\", "
                        + "\"geometry\": { \"coordinates\": [[5.0, 5.0], [-5.0, -5.0]], "
                        + "\"type\": \"MultiPoint\" } }\n",
                JsonlSerializer.getJsonl(resources)
        );
    }


    public void testGetJsonlForResourcesWithSingleGeometries() {

        Geometry geometry1 = new Geometry();
        geometry1.setCoordinates(new double[][][][]{{{{ 1.0, 1.0 }, { 1.0, 2.0 }, { 2.0, 2.0 }}}});
        geometry1.setType(GeometryType.MULTIPOLYGON);

        Resource resource1 = new Resource();
        resource1.setIdentifier("identifier1");
        resource1.setGeometry(geometry1);

        Geometry geometry2 = new Geometry();
        geometry2.setCoordinates(new double[][][][]{{{{ 0.0, 0.0 }, { 2.0, 2.0 }, { 4.0, 4.0 }}}});
        geometry2.setType(GeometryType.MULTIPOLYLINE);

        Resource resource2 = new Resource();
        resource2.setIdentifier("identifier2");
        resource2.setGeometry(geometry2);

        Geometry geometry3 = new Geometry();
        geometry3.setCoordinates(new double[][][][]{{{{ 5.0, 5.0 }}}});
        geometry3.setType(GeometryType.MULTIPOINT);

        Resource resource3 = new Resource();
        resource3.setIdentifier("identifier3");
        resource3.setGeometry(geometry3);

        List<Resource> resources = new ArrayList<>();
        resources.add(resource1);
        resources.add(resource2);
        resources.add(resource3);

        assertEquals("{ \"identifier\": \"identifier1\", "
                        + "\"geometry\": { \"coordinates\": [[[1.0, 1.0], [1.0, 2.0], [2.0, 2.0]]], "
                        + "\"type\": \"Polygon\" } }\n"
                        + "{ \"identifier\": \"identifier2\", "
                        + "\"geometry\": { \"coordinates\": [[0.0, 0.0], [2.0, 2.0], [4.0, 4.0]], "
                        + "\"type\": \"LineString\" } }\n"
                        + "{ \"identifier\": \"identifier3\", "
                        + "\"geometry\": { \"coordinates\": [5.0, 5.0], "
                        + "\"type\": \"Point\" } }\n",
                JsonlSerializer.getJsonl(resources)
        );
    }
}

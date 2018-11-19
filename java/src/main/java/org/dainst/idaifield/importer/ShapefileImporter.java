package org.dainst.idaifield.importer;

import org.dainst.idaifield.datastore.Datastore;
import org.dainst.idaifield.model.Geometry;
import org.dainst.idaifield.model.Resource;
import org.json.JSONObject;

import java.text.DateFormat;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.List;
import java.util.TimeZone;


/**
 * @author Thomas Kleinke
 */
public class ShapefileImporter {

    private static DateFormat dateFormat = createDateFormat();


    public static void run(String projectName, String userName, String shapefilePath) throws Exception {

        List<Resource> resources = ShapefileReader.read(shapefilePath);

        for (Resource resource : resources) {
            updateExistingDocument(projectName, userName, resource);
        }
    }


    private static void updateExistingDocument(String projectName, String userName,
                                               Resource shapefileResource) throws Exception {

        if (!hasValue(shapefileResource.getId())) throw new Exception("ID_MISSING");

        JSONObject document = Datastore.getJSONDocument(projectName, shapefileResource.getId());
        updateGeometry(shapefileResource, document.getJSONObject("resource"));
        addActionToModified(document, userName);

        Datastore.update(projectName, document);
    }


    private static void updateGeometry(Resource shapefileResource, JSONObject existingResource) {

        if (existingResource.has("geometry")) existingResource.remove("geometry");
        existingResource.put("geometry", getGeometryJSON(shapefileResource.getGeometry()));
    }


    private static JSONObject getGeometryJSON(Geometry geometry) {

        JSONObject geometryJSON = new JSONObject();

        String type = geometry.getGeojsonType();
        geometryJSON.put("type", type);

        switch (type) {
            case "Point":
                geometryJSON.put("coordinates", geometry.getCoordinates()[0][0][0]);
                break;
            case "MultiPoint":
            case "LineString":
                geometryJSON.put("coordinates", geometry.getCoordinates()[0][0]);
                break;
            case "MultiLineString":
            case "Polygon":
                geometryJSON.put("coordinates", geometry.getCoordinates()[0]);
                break;
            case "MultiPolygon":
                geometryJSON.put("coordinates", geometry.getCoordinates());
        }

        return geometryJSON;
    }


    private static void addActionToModified(JSONObject document, String userName) {

        JSONObject action = new JSONObject();
        action.put("user", userName);
        action.put("date", dateFormat.format(new Date()));

        document.getJSONArray("modified").put(action);
    }


    private static DateFormat createDateFormat() {

        DateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'");
        dateFormat.setTimeZone(TimeZone.getTimeZone("UTC"));

        return dateFormat;
    }


    private static boolean hasValue(String field) {

        return field != null && !field.equals("");
    }
}

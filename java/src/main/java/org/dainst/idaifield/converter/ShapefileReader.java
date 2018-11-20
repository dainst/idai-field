package org.dainst.idaifield.converter;

import org.dainst.idaifield.ErrorMessage;
import org.dainst.idaifield.model.Geometry;
import org.dainst.idaifield.model.Resource;
import org.geotools.data.DataStore;
import org.geotools.data.DataStoreFinder;
import org.geotools.data.FeatureSource;
import org.geotools.feature.FeatureCollection;
import org.geotools.feature.FeatureIterator;
import org.opengis.feature.Property;
import org.opengis.feature.simple.SimpleFeature;
import org.opengis.feature.simple.SimpleFeatureType;
import org.opengis.filter.Filter;

import java.io.File;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;


/**
 * @author Thomas Kleinke
 */
class ShapefileReader {

    static List<Resource> read(String shapefilePath) throws Exception {

        List<Resource> resources = new ArrayList<>();

        try (FeatureIterator<SimpleFeature> features = getFeatureCollection(shapefilePath).features()) {
            while (features.hasNext()) resources.add(createResource(features.next()));
        }

        return resources;
    }


    private static FeatureCollection<SimpleFeatureType, SimpleFeature> getFeatureCollection(
            String shapefilePath) throws Exception {

        try {
            File file = new File(shapefilePath);
            Map<String, Object> parameters = new HashMap<>();
            parameters.put("url", file.toURI().toURL());

            DataStore dataStore = DataStoreFinder.getDataStore(parameters);
            String typeName = dataStore.getTypeNames()[0];

            FeatureSource<SimpleFeatureType, SimpleFeature> source = dataStore.getFeatureSource(typeName);

            return source.getFeatures(Filter.INCLUDE);
        } catch (Exception e) {
            throw new Exception(ErrorMessage.CONVERTER_SHAPEFILE_READ_ERROR.name() + " " + shapefilePath);
        }
    }


    private static Resource createResource(SimpleFeature feature) throws Exception {

        Resource resource = new Resource();
        setResourceFields(resource, feature);
        resource.setGeometry(getGeometry(feature));

        return resource;
    }


    private static void setResourceFields(Resource resource, SimpleFeature feature) {

        for (Property attribute : feature.getProperties()) {
            switch(attribute.getName().toString()) {
                case "id":
                    resource.setId(attribute.getValue().toString());
                    break;
                case "identifier":
                    resource.setIdentifier(attribute.getValue().toString());
                    break;
                case "shortdesc":
                    resource.setShortDescription(attribute.getValue().toString());
                    break;
                case "type":
                    resource.setType(attribute.getValue().toString());
            }
        }
    }


    private static Geometry getGeometry(SimpleFeature feature) throws Exception {

        String wkt = feature.getDefaultGeometryProperty().getValue().toString();

        if (wkt.startsWith("MULTIPOINT")) {
            return WktParser.getMultiPointGeometry(wkt);
        } else if (wkt.startsWith("MULTILINESTRING")) {
            return WktParser.getMultiPolylineGeometry(wkt);
        } else if (wkt.startsWith("MULTIPOLYGON")) {
            return WktParser.getMultiPolygonGeometry(wkt);
        } else {
            throw new Exception(ErrorMessage.CONVERTER_UNSUPPORTED_GEOMETRY_TYPE.name() + " " + wkt);
        }
    }
}

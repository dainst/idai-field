package org.dainst.idaifield.converter;

import org.dainst.idaifield.ErrorMessage;
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
import java.nio.charset.Charset;
import java.util.*;


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

        DataStore dataStore = null;

        try {
            File file = new File(shapefilePath);
            Map<String, Object> parameters = new HashMap<>();
            parameters.put("url", file.toURI().toURL());
            parameters.put("charset", Charset.forName("UTF-8"));

            dataStore = DataStoreFinder.getDataStore(parameters);
            String typeName = dataStore.getTypeNames()[0];

            FeatureSource<SimpleFeatureType, SimpleFeature> source = dataStore.getFeatureSource(typeName);

            return source.getFeatures(Filter.INCLUDE);
        } catch (Exception e) {
            throw new Exception(ErrorMessage.CONVERTER_SHAPEFILE_READ_ERROR.name());
        } finally {
            if (dataStore != null) dataStore.dispose();
        }
    }


    private static Resource createResource(SimpleFeature feature) throws Exception {

        Resource resource = new Resource();
        setResourceFields(resource, feature);
        setGeometry(resource, feature);

        return resource;
    }


    private static void setResourceFields(Resource resource, SimpleFeature feature) {

        for (Property attribute : feature.getProperties()) {
            String attributeName = attribute.getName().toString();
            switch(attributeName) {
                case "identifier":
                    resource.setIdentifier(attribute.getValue().toString());
                    break;
                case "category":
                case "type":
                    resource.setCategory(attribute.getValue().toString());
                    break;
                case "sdesc":
                case "shortdesc":
                    updateShortDescription(
                        resource,
                        "unspecifiedLanguage",
                        attribute.getValue().toString()
                    );
                    break;
                default:
                    if (attributeName.startsWith("sdesc_")) {
                        updateShortDescription(
                            resource,
                            attributeName.replace("sdesc_", ""),
                            attribute.getValue().toString()
                        );
                    }
            }
        }
    }


    private static void updateShortDescription(Resource resource, String language, String content) {

        if (resource.getShortDescription() == null) {
            resource.setShortDescription(new HashMap<String, String>());
        }
        
        resource.getShortDescription().put(language, content);
    }


    private static void setGeometry(Resource resource, SimpleFeature feature) throws Exception {

        resource.setGeometry(
                GeometryConverter.convert((org.locationtech.jts.geom.Geometry) feature.getDefaultGeometry())
        );
    }
}

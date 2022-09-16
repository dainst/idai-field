package org.dainst.idaifield.exporter;

import org.dainst.idaifield.ErrorMessage;
import org.dainst.idaifield.model.GeometryType;
import org.dainst.idaifield.model.Resource;
import org.geotools.data.DataUtilities;
import org.geotools.data.DefaultTransaction;
import org.geotools.data.FileDataStoreFinder;
import org.geotools.data.Transaction;
import org.geotools.data.memory.MemoryDataStore;
import org.geotools.data.shapefile.ShapefileDataStore;
import org.geotools.data.shapefile.ShapefileDataStoreFactory;
import org.geotools.data.simple.SimpleFeatureCollection;
import org.geotools.data.simple.SimpleFeatureSource;
import org.geotools.data.simple.SimpleFeatureStore;
import org.geotools.feature.simple.SimpleFeatureBuilder;
import org.geotools.geometry.jts.JTSFactoryFinder;
import org.geotools.util.URLs;
import org.locationtech.jts.geom.*;
import org.opengis.feature.simple.SimpleFeature;
import org.opengis.feature.simple.SimpleFeatureType;

import java.io.File;
import java.io.IOException;
import java.io.Serializable;
import java.nio.charset.Charset;
import java.util.*;


/**
 * @author Thomas Kleinke
 */
class ShapefileWriter {

    static void write(File shapefileFolder, Map<GeometryType, List<Resource>> resources,
                      String epsg) throws Exception {

        try {
            for (GeometryType geometryType : resources.keySet()) {
                createFiles(resources.get(geometryType), shapefileFolder, geometryType, epsg);
            }
        } catch (Exception e) {
            throw new Exception(ErrorMessage.EXPORTER_SHAPEFILE_WRITE_ERROR.name());
        }
    }


    private static void createFiles(List<Resource> resources, File folder,
                                    GeometryType geometryType, String epsg) throws Exception {

        String outputFilePath = folder.getAbsolutePath() + File.separator
                + geometryType.name().toLowerCase() + "s.shp";

        File outputFile = new File(outputFilePath);

        MemoryDataStore memoryDataStore = createMemoryDataStore(resources, geometryType, epsg);

        if (memoryDataStore != null) writeShapefile(memoryDataStore, outputFile);
    }


    private static MemoryDataStore createMemoryDataStore(List<Resource> resources, GeometryType geometryType,
                                                         String epsg) throws Exception {

        List<String> languages = getUsedLanguages(resources);
        SimpleFeatureType featureType = createFeatureType(geometryType, languages, epsg);

        MemoryDataStore memoryDataStore = new MemoryDataStore();
        memoryDataStore.createSchema(featureType);

        GeometryBuilder geometryBuilder = new GeometryBuilder(JTSFactoryFinder.getGeometryFactory());

        Transaction transaction = Transaction.AUTO_COMMIT;

        boolean dataStoreEmpty = true;

        for (Resource resource : resources) {
            if (addFeature(resource, languages, featureType, geometryType, geometryBuilder, memoryDataStore,
                    transaction)) {
                dataStoreEmpty = false;
            }
        }

        transaction.close();

        return dataStoreEmpty ? null : memoryDataStore;
    }


    private static SimpleFeatureType createFeatureType(GeometryType geometryType, List<String> languages,
                                                       String epsg) throws Exception {

        String geometryName = null;

        switch(geometryType) {
            case MULTIPOINT:
                geometryName = "MultiPoint";
                break;
            case MULTIPOLYLINE:
                geometryName = "MultiLineString";
                break;
            case MULTIPOLYGON:
                geometryName = "MultiPolygon";
                break;
        }

        String schema = "the_geom:" + geometryName;
        if (epsg != null) schema += ":srid=" + epsg;
        schema += "," + getDataSchema(languages);

        return DataUtilities.createType(geometryType.name().toLowerCase(), schema);
    }


    private static String getDataSchema(List<String> languages) {

        String dataSchema = "identifier:String,";

        if (languages.contains("unspecifiedLanguage")) dataSchema += "sdesc:String,";
        for (String language : languages) {
            if (!language.equals("unspecifiedLanguage")) dataSchema += "sdesc_" + language + ":String,";
        }

        return dataSchema + "category:String";
    }


    private static boolean addFeature(Resource resource, List<String> languages, SimpleFeatureType featureType,
                                      GeometryType geometryType, GeometryBuilder geometryBuilder,
                                      MemoryDataStore memoryDataStore, Transaction transaction) throws Exception {

        SimpleFeatureBuilder featureBuilder = new SimpleFeatureBuilder(featureType);

        switch(geometryType) {
            case MULTIPOINT:
                featureBuilder.add(geometryBuilder.buildMultiPointGeometry(resource.getGeometry()));
                break;
            case MULTIPOLYLINE:
                featureBuilder.add(geometryBuilder.buildMultiPolylineGeometry(resource.getGeometry()));
                break;
            case MULTIPOLYGON:
                MultiPolygon multiPolygon = geometryBuilder.buildMultiPolygonGeometry(resource.getGeometry());
                if (multiPolygon != null) {
                    featureBuilder.add(multiPolygon);
                    break;
                } else {
                    return false;
                }
        }

        fillFeatureFields(resource, languages, featureBuilder);

        SimpleFeature feature = featureBuilder.buildFeature(null);
        memoryDataStore.addFeature(feature);

        try {
            transaction.commit();
        } catch (Exception e) {
            transaction.rollback();
            transaction.close();
            throw new Exception("Could not write feature for resource " + resource.getIdentifier()
                    + " and featureType " + featureType.getTypeName(), e);
        }

        return true;
    }


    private static void fillFeatureFields(Resource resource, List<String> languages,
                                          SimpleFeatureBuilder featureBuilder) {

        featureBuilder.add(resource.getIdentifier());

        if (languages.contains("unspecifiedLanguage")) {
            featureBuilder.add(getFromShortDescription(resource, "unspecifiedLanguage"));
        }

        for (String language : languages) {
            if (!language.equals("unspecifiedLanguage")) {
                featureBuilder.add(getFromShortDescription(resource, language));
            }
        }

        featureBuilder.add(resource.getCategory());
    }


    private static String getFromShortDescription(Resource resource, String language) {

        if (resource.getShortDescription() != null && resource.getShortDescription().containsKey(language)) {
            return resource.getShortDescription().get(language);
        } else {
            return "";
        }
    }


    private static void writeShapefile(MemoryDataStore memoryDataStore, File outputFile) throws Exception {

        SimpleFeatureSource featureSource = memoryDataStore.getFeatureSource(memoryDataStore.getTypeNames()[0]);
        SimpleFeatureType featureType = featureSource.getSchema();

        Map<String, Serializable> creationParams = new HashMap<>();
        creationParams.put("url", URLs.fileToUrl(outputFile));

        ShapefileDataStoreFactory factory = (ShapefileDataStoreFactory) FileDataStoreFinder.getDataStoreFactory("shp");
        ShapefileDataStore dataStore = (ShapefileDataStore) factory.createNewDataStore(creationParams);
        dataStore.setCharset(Charset.forName("UTF-8"));
        dataStore.createSchema(featureType);

        SimpleFeatureStore featureStore = (SimpleFeatureStore) dataStore.getFeatureSource(dataStore.getTypeNames()[0]);

        Transaction transaction = new DefaultTransaction();
        try {
            SimpleFeatureCollection collection = featureSource.getFeatures();
            featureStore.addFeatures(collection);
            transaction.commit();
        } catch (IOException e) {
            try {
                transaction.rollback();
                throw new Exception("Failed to commit datastore to feature store", e);
            } catch (IOException e2) {
                throw new Exception("Failed to commit datastore to feature store; transaction rollback failed", e2);
            }
        } finally {
            transaction.close();
        }
    }


    private static List<String> getUsedLanguages(List<Resource> resources) {

        Set<String> languagesSet = new HashSet<String>();

        for (Resource resource: resources) {
            if (resource.getShortDescription() != null) {
                languagesSet.addAll(resource.getShortDescription().keySet());
            }
        }
        
        List<String> languages = new ArrayList<String>(languagesSet);
        languages.sort(Comparator.naturalOrder());

        return languages;
    }
}

package org.dainst.idaifield.exporter;

import junit.framework.TestCase;
import org.apache.commons.io.FileUtils;
import org.dainst.idaifield.model.Geometry;
import org.dainst.idaifield.model.GeometryType;
import org.dainst.idaifield.model.Resource;

import java.io.File;
import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * @author Thomas Kleinke
 */
public class ShapefileWriterTest extends TestCase {

    private static final String tempFolderPath = "src" + File.separator + "test" + File.separator
            + "resources" + File.separator + "temp";
    private static final File tempFolder = new File(tempFolderPath);


    public ShapefileWriterTest(String testName) {

        super(testName);
    }


    public void testWriteShapefile() {

        tempFolder.mkdirs();

        try {
            ShapefileWriter.write(tempFolder, getResourceMap(), null);
            assertThatGeneratedFilesExist();
        } catch (Exception e) {
            fail(e.getMessage());
        } finally {
            try {
                FileUtils.deleteDirectory(tempFolder);
            } catch (IOException e) {
                System.err.println("Failed to delete temp folder: " + tempFolder.getAbsolutePath());
            }
        }
    }


    private Map<GeometryType, List<Resource>> getResourceMap() {

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

        List<Resource> multiPolygonResources = new ArrayList<>();
        multiPolygonResources.add(resource1);
        List<Resource> multiPolylineResources = new ArrayList<>();
        multiPolylineResources.add(resource2);
        List<Resource> multiPointResources = new ArrayList<>();
        multiPointResources.add(resource3);

        Map<GeometryType, List<Resource>> resources = new HashMap<>();
        resources.put(GeometryType.MULTIPOLYGON, multiPolygonResources);
        resources.put(GeometryType.MULTIPOLYLINE, multiPolylineResources);
        resources.put(GeometryType.MULTIPOINT, multiPointResources);

        return resources;
    }


    private void assertThatGeneratedFilesExist() throws IOException {

        String[] fileNames = { "multipoints", "multipolylines", "multipolygons" };
        String[] fileExtensions = { "dbf", "fix", "prj", "shp", "shx" };

        for (String fileName : fileNames) {
            for (String fileExtension : fileExtensions) {
                assertTrue(FileUtils.directoryContains(tempFolder, new File(tempFolderPath +
                        File.separator + fileName + "." + fileExtension)));
            }
        }
    }
}
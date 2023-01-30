package org.dainst.idaifield.exporter;

import org.apache.commons.io.FileUtils;
import org.dainst.idaifield.ErrorMessage;
import org.dainst.idaifield.datastore.Datastore;
import org.dainst.idaifield.model.GeometryType;
import org.dainst.idaifield.model.Resource;

import java.io.File;
import java.util.List;
import java.util.Map;


/**
 * @author Thomas Kleinke
 */
public class ShapefileExporter {

    public static void run(String projectIdentifier, String password, String outputFilePath, String tempFolderPath,
                           String operationId, String epsg) throws Exception {

        String outputFolderPath = outputFilePath.substring(0, outputFilePath.lastIndexOf(File.separator));
        String outputFileName = outputFilePath.substring(
                outputFilePath.lastIndexOf(File.separator),
                outputFilePath.lastIndexOf('.') != -1
                    ? outputFilePath.lastIndexOf('.')
                    : outputFilePath.length()
        );

        File shapefileFolder = createShapefileFolder(tempFolderPath, outputFileName);
        if (shapefileFolder == null) {
            throw new Exception(ErrorMessage.EXPORTER_TEMP_FOLDER_CREATION_ERROR.name() + " "
                    + tempFolderPath);
        }

        try {
            Map<GeometryType, List<Resource>> resources = Datastore.getResourcesWithGeometry(
                    projectIdentifier, password, operationId
            );
            ShapefileWriter.write(shapefileFolder, resources, epsg);
            ZipArchiveBuilder.buildZipArchive(shapefileFolder, outputFolderPath);
        } finally {
            FileUtils.deleteDirectory(shapefileFolder);
        }
    }


    private static File createShapefileFolder(String pathToTempFolder, String outputFileName) {

        File tempFolder = new File(pathToTempFolder + File.separator + outputFileName);
        if (!tempFolder.exists()) {
            if (!tempFolder.mkdirs()) return null;
        }

        return tempFolder;
    }
}

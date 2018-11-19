package org.dainst.idaifield;

import org.dainst.idaifield.exporter.ShapefileExporter;
import org.dainst.idaifield.importer.ShapefileImporter;

import java.io.File;


/**
 * @author Thomas Kleinke
 */
public class ShapefileTool {

    public static void main(String[] arguments) {

        try {
            switch(arguments[0]) {
                case "import":
                    runImporter(arguments);
                    break;
                case "export":
                    runExporter(arguments);
                    break;
                default:
                    printUsageInformation();
            }
        } catch(Exception e) {
            e.printStackTrace();
        }
    }


    private static void runImporter(String[] arguments) throws Exception {

        if (arguments.length != 4) {
            printUsageInformation();
            return;
        }

        ShapefileImporter.run(arguments[1], arguments[2], arguments[3]);
    }


    private static void runExporter(String[] arguments) throws Exception {

        if (arguments.length < 5 || arguments.length > 6 || !arguments[2].contains(File.separator)) {
            printUsageInformation();
            return;
        }

        ShapefileExporter.run(arguments[1], arguments[2], arguments[3], arguments[4],
                arguments.length == 6 ? arguments[5] : null);
    }


    private static void printUsageInformation() {

        System.err.println("java -jar shapefile-tool.jar import [projectName] [userName] [shapefilePath]");
        System.err.println("java -jar shapefile-tool.jar export [projectName] [outputFilePath] "
                + "[tempFolderPath] [operation] [epsg]");
    }
}

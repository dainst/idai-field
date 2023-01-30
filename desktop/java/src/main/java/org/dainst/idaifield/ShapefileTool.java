package org.dainst.idaifield;

import org.dainst.idaifield.exporter.ShapefileExporter;
import org.dainst.idaifield.converter.JsonlConverter;

import java.io.File;


/**
 * @author Thomas Kleinke
 */
public class ShapefileTool {

    public static void main(String[] arguments) {

        if (arguments.length == 0) {
            printUsageInformation();
            return;
        }

        try {
            switch(arguments[0]) {
                case "convert":
                    runJsonlConverter(arguments);
                    break;
                case "export":
                    runExporter(arguments);
                    break;
                default:
                    printUsageInformation();
            }
        } catch(Exception e) {
            System.err.println(e.getMessage());
        }
    }


    private static void runJsonlConverter(String[] arguments) throws Exception {

        if (arguments.length != 3) {
            printUsageInformation();
            return;
        }

        JsonlConverter.run(arguments[1], arguments[2]);
    }


    private static void runExporter(String[] arguments) throws Exception {

        if (arguments.length < 6 || arguments.length > 7 || !arguments[3].contains(File.separator)) {
            printUsageInformation();
            return;
        }

        ShapefileExporter.run(arguments[1], arguments[2], arguments[3], arguments[4], arguments[5],
                arguments.length == 7 ? arguments[6] : null);
    }


    private static void printUsageInformation() {

        System.err.println("java -jar shapefile-tool.jar convert [shapefilePath] [outputFilePath]");
        System.err.println("java -jar shapefile-tool.jar export [projectIdentifier] [password] [outputFilePath] "
                + "[tempFolderPath] [operation] [epsg]");
    }
}

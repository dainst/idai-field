package org.dainst.idaifield.importer;

import org.apache.commons.io.FileUtils;
import org.dainst.idaifield.model.Resource;

import java.io.File;
import java.util.List;


/**
 * @author Thomas Kleinke
 */
public class ShapefileImporter {

    public static void run(String shapefilePath, String outputFilePath) throws Exception {

        List<Resource> resources = ShapefileReader.read(shapefilePath);
        FileUtils.write(new File(outputFilePath), JsonlSerializer.getJsonl(resources), "utf-8");
    }
}

package org.dainst.idaifield.converter;

import org.apache.commons.io.FileUtils;
import org.dainst.idaifield.ErrorMessage;
import org.dainst.idaifield.model.Resource;

import java.io.File;
import java.io.IOException;
import java.util.List;


/**
 * @author Thomas Kleinke
 */
public class JsonlConverter {

    public static void run(String shapefilePath, String outputFilePath) throws Exception {

        List<Resource> resources = ShapefileReader.read(shapefilePath);
        String jsonl = JsonlSerializer.getJsonl(resources);

        try {
            FileUtils.write(new File(outputFilePath), jsonl, "utf-8");
        } catch (IOException e) {
            throw new Exception(ErrorMessage.CONVERTER_JSONL_WRITE_ERROR.name() + " " + outputFilePath);
        }
    }
}

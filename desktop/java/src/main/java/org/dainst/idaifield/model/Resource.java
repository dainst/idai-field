package org.dainst.idaifield.model;
import java.util.HashMap;


/**
 * @author Thomas Kleinke
 */
public class Resource {

    private String identifier;
    private HashMap<String, String> shortDescription;
    private String category;
    private Geometry geometry;


    public String getIdentifier() {

        return identifier;
    }


    public void setIdentifier(String identifier) {

        this.identifier = identifier;
    }


    public HashMap<String, String> getShortDescription() {

        return shortDescription;
    }


    public void setShortDescription(HashMap<String, String> shortDescription) {

        this.shortDescription = shortDescription;
    }


    public String getCategory() {

        return category;
    }


    public void setCategory(String category) {

        this.category = category;
    }


    public Geometry getGeometry() {

        return geometry;
    }


    public void setGeometry(Geometry geometry) {

        this.geometry = geometry;
    }
}

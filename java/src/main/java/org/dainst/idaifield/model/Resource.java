package org.dainst.idaifield.model;


/**
 * @author Thomas Kleinke
 */
public class Resource {

    private String identifier;
    private String shortDescription;
    private String type;
    private Geometry geometry;


    public String getIdentifier() {

        return identifier;
    }


    public void setIdentifier(String identifier) {

        this.identifier = identifier;
    }


    public String getShortDescription() {

        return shortDescription;
    }


    public void setShortDescription(String shortDescription) {

        this.shortDescription = shortDescription;
    }


    public String getType() {

        return type;
    }


    public void setType(String type) {

        this.type = type;
    }


    public Geometry getGeometry() {

        return geometry;
    }


    public void setGeometry(Geometry geometry) {

        this.geometry = geometry;
    }
}

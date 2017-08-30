# Configuraton.json - Structure

## Top level elements 

The top level elements are

```
{
  "types": [],
  "relations" : []
}
```

## Type definitions

Types are defined as shown here

```
{
  "type": "a_type_identifier",
  "label" : "A label",
  "description" : "a text shown on hovering over the type label"
  "fields": []
}
```

## Field definitions

Fields look like

```
{
  "name" : "the_field_identifier",
  "label" : "The field label"
}
```

## Relations

A relation definition looks like this

```
{
  "name": "a_relation_identifier",
  "label": "The relation label",
  "domain": [],
  "range": []
}
```

## Core Fields

In iDAI.field 2, the fields `identifier` and `shortDescription`
automatically get added to every defined type, if not defined
explicitely.


Furthermore, the `image` type has to be defined. Otherwise the
application won't start.


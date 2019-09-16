# Valuelists

* neue Werte -> neue Werteliste. Unveränderlichkeit


Spätere Struktur
```
'uuid1': {
    createdBy: '',
    description: {
      de: ''
    }
    extends?: 'uuid2
    values: {
        'A': {
            references?: { uri: 'xyzA' } 
            translations?: { de: 'A_' }  
        },
        'B': {
            references?: { uri: 'xyzB'}
            translations?: { de: 'B_' }
        }
    }
}
```
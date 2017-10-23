French postal codes API for Node.js
------

> Recherche de nom de commune et code INSEE à partir d'un code postal.

Based on the [official postal codes database](https://www.data.gouv.fr/fr/datasets/base-officielle-des-codes-postaux/) from [La Poste](http://www.laposte.fr/).

## Usage
```js
var codesPostaux = require('codes-postaux');

codesPostaux.find(75001);
codesPostaux.find('75001');
```

Will return
```js
[ { nomCommune: 'Paris',
    codeInsee: '75056',
    codePostal: '75001',
    departement: { code: '75', nom: 'Paris' },
    population: 2229621,
    region: { code: '11', nom: 'Île-de-France' } } ]
```


## Architecture

A dump from the [GéoAPI](https://api.gouv.fr/api/geoapi.html) is available in the package.
On `postinstall`, it is unzipped.
On `require`, it is indexed and loaded into memory. Finding postal codes is just an object lookup.


## Alternatives in other languages

These community-maintained libraries are based on the same dataset and offer equivalent features in other languages:
- [Dart](https://pub.dartlang.org/packages/code_postaux)

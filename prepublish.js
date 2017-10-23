var request = require('request');
var fs = require('fs');
var assert = require('assert');


request('https://geo.api.gouv.fr/communes', {
    json: true,
    qs: {
        boost: 'population',
        fields: 'nom,code,codesPostaux,departement,population,region',
    },
}, function (error, response, body) {
    assert.ok(response.statusCode == 200, `Response status code should be 200 (not ${response.statusCode}).`);
    assert.ok(500 < body.length, `Too few cities (${body.length})`);
    assert.ok(body.length < 40000, `Too many cities (${body.length})`);

    var index = {};
    body.forEach(function (commune) {
        commune.codesPostaux.forEach(function (codePostal) {
            if (!(codePostal in index)) {
                index[codePostal] = [];
            }
            // Mitigate missing data for Saint Martin
            var departement = commune.departement || {};
            var region = commune.region || {};
            index[codePostal].push({
                nomCommune: commune.nom,
                codeInsee: commune.code,
                codePostal: codePostal,
                departement: {
                    code: departement.code,
                    nom: departement.nom,
                },
                population: commune.population,
                region: {
                    code: region.code,
                    nom: region.nom,
                },
            });
        });
    });

    // Sort by population
    for (var codePostal in index) {
        index[codePostal].sort(function (a, b) {
            var aPopulation = a.population || 0;
            var bPopulation = b.population || 0;
            if (aPopulation <= bPopulation) return 1;
            if (aPopulation >= bPopulation) return -1;
            return 0;
        });
    }

    fs.writeFileSync('codes-postaux.json', JSON.stringify(index, null, 1));
});

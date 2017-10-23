var assert = require('assert');

var subject = require('./index');
var actual;

// Lookup
actual = subject.find(75002)[0];
assert.equal(actual.nomCommune, 'Paris');
assert.equal(actual.codeInsee, '75056');

assert.ok('departement' in actual);
assert.ok('nom' in actual.departement);
assert.equal(actual.departement.nom, 'Paris');

assert.ok('population' in actual);

assert.ok('region' in actual);
assert.ok('nom' in actual.region);
assert.equal(actual.region.nom, 'Île-de-France');


// Population sort
actual = subject.find(54490);
assert.equal(actual.length, 7);
for (var i = 0; i < actual.length-1; i++) {
  assert.ok(actual[i].population >= actual[i + 1].population);
}

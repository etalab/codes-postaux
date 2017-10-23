// Index by postalCode value
var index = require('./codes-postaux.json');

exports.find = function(codePostal) {
    return index[codePostal] || [];
};

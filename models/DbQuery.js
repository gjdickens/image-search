var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var DbQuerySchema   = new Schema({
    term: String,
    when: Date
});

module.exports = mongoose.model('DbQuery', DbQuerySchema);

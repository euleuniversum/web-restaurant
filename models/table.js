//Требуется Mongoose
const mongoose = require('mongoose');

const Schema = mongoose.Schema;

let TableSchema = new Schema({
    numb : {type: Number, unique : true, required: true},
    comfort : {type: String, unique : false, required: true, enum: ['Обычный', 'Уютный', 'Люкс'], default: 'Обычный'},
    capacity : {type: Number, unique : false, required: true},
    floor : {type: Number, unique : false, default: 1},
});

TableSchema
    .virtual('description')
    .get(() =>
        (this.comfort +
        " столик под номером " +
        this.numb.toString() +
        " на " +
        this.capacity.toString() +
        " человек" +
            (this.floor ? " на " + this.floor + " этаже" : "")));

TableSchema
    .virtual('url')
    .get(() => ('/tables/' + this._id));

module.exports = mongoose.model('TableModel', TableSchema );
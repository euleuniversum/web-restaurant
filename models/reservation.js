//Требуется Mongoose
let mongoose = require('mongoose');
let moment = require('moment');

//Определяем схему
let Schema = mongoose.Schema;

let ReservationSchema = new Schema({
    table : {type: Number, required: true},
    date : {type: String, required: true},
    time : {type: String, required: true},
    name : {type: String, required: true, trim: true, max: 100},
    phone : {type: String, required: true},
});

ReservationSchema
    .virtual('description')
    .get(function () {
        return this.table.description + " забронирован на " + moment(this.date).format('DD-MM-YYYY') + " на имя " + this.name + " по номеру телефона " + this.phone;
    });

ReservationSchema
    .virtual('url')
    .get(function () {
        return '/reservation/' + this.phone;
    });

ReservationSchema
    .virtual('code')
    .get(function () {
        return this['_id'].toString().substring(17, 24);
    });

//экспортируется функция для содания класса модели
module.exports = mongoose.model('ReservationModel', ReservationSchema );
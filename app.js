const path = require('path');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const hbs = require("express-handlebars");
const mongoose = require("mongoose");
const express = require("express");
const rootDir = process.cwd();
const port = 3090;
const app = express();
const urlencodedParser = bodyParser.urlencoded({
    extended: false,
});
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "/static")));

app.set("view engine", "hbs");
app.engine(
    "hbs",
    hbs({
        extname: "hbs",
        defaultView: "default",
        layoutsDir: path.join(rootDir, "/views/layouts/"),
        partialsDir: path.join(rootDir, "/views/partials/"),
    })
);

const startServer = () => {
    app.listen(port, () => console.log(`App started on port ${port}`))
}

const uri = "mongodb+srv://user:sMlu1kg@web.ogbif.mongodb.net/web?retryWrites=true&w=majority";

const connectDb = () => {
    mongoose.connect(uri, {
        useNewUrlParser: true,
        useFindAndModify: false,
        useCreateIndex: true,
        useUnifiedTopology: true,
    })
    return mongoose.connection
}

connectDb()
    .on('error', console.log)
    .on('disconnected', connectDb)
    .once('open', startServer);

const TableModel = require('./models/table');
const ReservationModel = require('./models/reservation');

app.get("/", (_, res) => {
    res.redirect('/tables');
});

app.get("/tables", urlencodedParser, async (req, res, next) => {
    try {
        await TableModel.find({}, {__v: 0, _id: 0})
            .exec(function (err, tables) {
                const table = JSON.parse(JSON.stringify(tables));
                if (err) {
                    return next(err);
                }
                res.render("tables", {
                    layout: "default",
                    items: table,
                });
            });
    } catch (err) {
        res.send("err");
    }
});

app.get("/buy/:table", (req, res) => {
    res.render("reservation", {
        layout: "default",
        numb: req.params.table,
    })
});

app.post("/buy/:table", urlencodedParser, async (req, res) => {
    try {
        await ReservationModel.find({table: req.params.table, date: req.body.date}, { time: 1, _id: 0 }, function (err, times) {
            if (err) return console.log(err);

            let allTimes = (JSON.parse(JSON.stringify(times)));
            let isFree = true;

            if (allTimes.length !== 0) {
                allTimes = allTimes.map((item) => Object.values(item)).flat().map((item) => parseInt(item.slice(0, 2), 10));
                const time = parseInt(req.body.timeDate.slice(0, 2), 10);

                for (const item of allTimes) {
                    const [startTime, endTime] = [item - 2, item + 4];
                    if (time >= startTime && time <= endTime) {
                        isFree = false;
                        break;
                    }
                }
            }

            if (isFree) {
                const id = reservationCreate(req.params.table, req.body.date, req.body.timeDate, req.body.username, req.body.phone);
                res.render("success", {
                    layout: "default",
                    code: id,
                });
            } else {
                res.render("error", {
                    layout: "default",
                    message: "Приносим свои извинения, но этот столик уже занят на выбранное время",
                });
            }
        });
    } catch (err) {
        console.log(err);
        res.send("err");
    }
});

app.get("/login", (req, res) => {
    res.render("login", {
        layout: "default",
    })
});

app.post("/login", urlencodedParser, async (req, res, next) => {
    try {
        await ReservationModel.find({phone: req.body.phone}, {phone: 0, __v: 0})
            .exec(function (err, doc) {
                const tables = JSON.parse(JSON.stringify(doc));
                if (err) { return next(err); }

                if (tables.length !== 0) {
                    const name = tables[0].name;
                    const tablesList = tables.map((item) => {
                        delete item.name;
                        item.code = item['_id'].toString().substring(17, 24);
                        delete item['_id'];
                        return item;
                    });
                    res.render("cart", {
                        layout: "default",
                        username: name,
                        phone: req.body.phone,
                        items: tablesList,
                    });
                } else {
                    res.render("error", {
                        layout: "default",
                        message: "На данный номер брони не найдены",
                    });
                }
            });
    } catch (err) {
        console.log(err);
        res.send("err");
    }
});

app.get("/*", (req, res) => {
    res.status('404');
    res.render("error", {
        layout: "default",
        message: "Страница не найдена"
    })
});

function tableCreate(numb, comfort, capacity, floor) {
    const table = new TableModel({
        numb: numb,
        comfort: comfort,
        capacity: capacity,
        floor: floor
    });
    table.save(function (err) {
        if (err) return console.log(err);
        console.log(`Сохранен стол ${table}`);
    });
}

function reservationCreate(table, date, time, name, phone) {
    const reservation = new ReservationModel({
        table: table,
        date: date,
        time: time,
        name: name,
        phone: phone
    });
    reservation.save(function (err) {
        if (err) return console.log(err);
        console.log(`Сохранен клиент ${reservation}`);
    });
    return reservation.code;
}

module.exports = app;
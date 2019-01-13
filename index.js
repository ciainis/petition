const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");

const db = require("./db.js");

var hb = require("express-handlebars");
app.engine("handlebars", hb());
app.set("view engine", "handlebars");

app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

app.use(express.static(__dirname + "/static"));

app.get("/petition", (req, res) => {
    if (req.cookies.signed) {
        res.redirect("/petition/signers");
    } else {
        res.render("petition", {
            layout: "main"
        });
    }
});

app.post("/petition", (req, res) => {
    db.addSigners(req.body.first, req.body.second, req.body.signature)
        .then(() => {
            res.cookie("signed", "yes");
            res.redirect("/petition/thanks");
        })
        .catch(err => {
            console.log(err);
            res.render("petition", {
                err: err,
                layout: "main"
            });
        });
});

app.get("/petition/thanks", (req, res) => {
    if (req.cookies.signed) {
        db.getSigners()
            .then(data => {
                res.render("thanks", {
                    numOfSigners: data.rows.length,
                    layout: "main"
                });
            })
            .catch(err => console.log(err));
    } else {
        res.redirect("/petition");
    }
});

app.get("/petition/signers", (req, res) => {
    if (req.cookies.signed) {
        db.getSigners()
            .then(data => {
                res.render("signers", {
                    signers: data.rows,
                    layout: "main"
                });
            })
            .catch(err => console.log(err));
    } else {
        res.redirect("/petition");
    }
});

app.listen(8080, () => console.log("listening!"));

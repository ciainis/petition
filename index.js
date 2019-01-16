const express = require("express");
const app = express();

const bodyParser = require("body-parser");
const cookieSession = require("cookie-session");
// const csurf = require("csurf");

const { giphyKey } = require("./secrets.json");
const giphy = require("giphy-api")(`${giphyKey}`);

var hb = require("express-handlebars");
app.engine("handlebars", hb());
app.set("view engine", "handlebars");

const db = require("./db.js");
const bcrypt = require("./bcrypt");

app.use(bodyParser.urlencoded({ extended: false }));

app.use(
    cookieSession({
        secret: `I'm always angry.`,
        maxAge: 1000 * 60 * 60 * 24 * 14
    })
);

// app.use(csurf());

app.use(express.static(__dirname + "/static"));

app.use((req, res, next) => {
    res.setHeader("X-Frame-Options", "DENY");
    next();
});

app.use(function(req, res, next) {
    console.log(req.session);
    if (!req.session.userId && req.url != "/register" && req.url != "/login") {
        res.redirect("/register");
    } else {
        next();
    }
});

const requireLoggedOutUser = (req, res, next) => {
    if (req.session.userId) {
        res.redirect("/petition");
    } else {
        next();
    }
};

const requireSignature = (req, res, next) => {
    if (!req.session.signatureId) {
        res.redirect("/petition");
    } else {
        next();
    }
};

const requireNoSignature = (req, res, next) => {
    if (req.session.signatureId) {
        res.redirect("/petition/thanks");
    } else {
        next();
    }
};

app.get("/register", requireLoggedOutUser, (req, res) => {
    res.render("register", {
        layout: "main"
    });
});

app.post("/register", requireLoggedOutUser, (req, res) => {
    bcrypt
        .hash(req.body.password)
        .then(hash => {
            return db.registerUser(
                req.body.first,
                req.body.last,
                req.body.email,
                hash
            );
        })
        .then(data => {
            req.session = {
                userId: data.rows[0].id,
                first: req.body.first,
                last: req.body.last
            };
            res.redirect("/login");
        })
        .catch(err => {
            console.log(err);
            res.render("register", {
                layout: "main",
                err: err
            });
        });
});

app.get("/login", requireLoggedOutUser, (req, res) => {
    res.render("login", {
        layout: "main"
    });
});

app.post("/login", requireLoggedOutUser, (req, res) => {
    let user = {};
    db.verifyPassword(req.body.email)
        .then(data => {
            user.id = data.rows[0].id;
            user.first = data.rows[0].first;
            user.last = data.rows[0].last;
            return bcrypt.compare(req.body.password, data.rows[0].password);
        })
        .then(bool => {
            if (bool == true) {
                return db.getSignatureId(user.id);
            } else {
                throw new Error();
            }
        })
        .then(data => {
            console.log(data);
            if (data.rows[0]) {
                req.session = {
                    userId: user.id,
                    first: user.first,
                    last: user.last,
                    signatureId: data.rows[0].id
                };
            }
            res.redirect("/petition");
        })
        .catch(err => {
            console.log(err);
            res.render("login", {
                layout: "main",
                err: err
            });
        });
});

app.get("/petition", requireNoSignature, (req, res) => {
    res.render("petition", {
        layout: "main"
    });
});

app.post("/petition", (req, res) => {
    console.log(req.body.signature);
    db.addSigners(
        req.session.first,
        req.session.last,
        req.session.userId,
        req.body.signature
    )
        .then(val => {
            console.log(val.rows[0]);
            req.session.signatureId = val.rows[0].id;
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

app.get("/petition/thanks", requireSignature, (req, res) => {
    Promise.all([
        db.getSigners(),
        db.getSignature(req.session.signatureId),
        giphy.random("thankyou")
    ])
        .then(data => {
            res.render("thanks", {
                layout: "main",
                numOfSigners: data[0].rows.length,
                signature: data[1].rows[0].signature,
                gif: data[2].data["image_url"]
            });
        })
        .catch(err => console.log(err));
});

app.get("/petition/signers", requireSignature, (req, res) => {
    db.getSigners()
        .then(data => {
            res.render("signers", {
                signers: data.rows,
                layout: "main"
            });
        })
        .catch(err => console.log(err));
});

app.get("/logout", (req, res) => {
    req.session = null;
    res.redirect("/petition");
});

app.listen(8080, () => console.log("listening!"));

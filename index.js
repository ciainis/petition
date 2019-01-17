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

//make sure all urls start with http:// or https:// or //
var checkUrl = function(url) {
    if (url != "") {
        if (
            url.startsWith("https://") ||
            url.startsWith("http://") ||
            url.startsWith("//")
        ) {
            return url;
        } else {
            return "http://".concat(url);
        }
    }
};

var lowCaseCity = function(city) {
    return city.toLowerCase();
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
            res.redirect("/profile");
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
    db.verifyPasswordAndGetSignatureId(req.body.email)
        .then(data => {
            req.session = {
                userId: data.rows[0].id,
                first: data.rows[0].first,
                last: data.rows[0].last,
                signatureId: data.rows[0].signatureId
            };
            return bcrypt.compare(req.body.password, data.rows[0].password);
        })
        .then(bool => {
            if (bool == true) {
                res.redirect("/petition");
            }
        })
        .catch(err => {
            console.log(err);
            res.render("login", {
                layout: "main",
                err: err
            });
        });
});

app.get("/profile", (req, res) => {
    res.render("profile", {
        layout: "main"
    });
});

app.post("/profile", (req, res) => {
    var goodUrl = checkUrl(req.body.homepage);
    var loweredCaseCity = lowCaseCity(req.body.city);

    if (req.body.age == "") {
        db.addProfile(null, loweredCaseCity, goodUrl, req.session.userId)
            .then(() => res.redirect("/petition"))
            .catch(err => console.log(err));
    } else {
        db.addProfile(
            req.body.age,
            loweredCaseCity,
            goodUrl,
            req.session.userId
        )
            .then(() => res.redirect("/petition"))
            .catch(err => console.log(err));
    }
});

app.get("/petition", requireNoSignature, (req, res) => {
    res.render("petition", {
        layout: "main"
    });
});

app.post("/petition", (req, res) => {
    db.addSigners(req.session.userId, req.body.signature)
        .then(val => {
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
    db.getProfile()
        .then(data => {
            res.render("signers", {
                layout: "main",
                signers: data.rows
            });
        })
        .catch(err => console.log(err));
});

app.get("/petition/signers/:city", (req, res) => {
    const city = req.params.city;
    console.log(city);
    db.getCity(city)
        .then(data => {
            console.log(data.rows);
            res.render("city", {
                layout: "main",
                signers: data.rows,
                city: city
            });
        })
        .catch(err => console.log(err));
});

app.get("/profile/edit", (req, res) => {
    //console.log(req.session.userId);
    db.getProfileInfo(req.session.userId)
        .then(data => {
            //console.log(data);
            res.render("edit_profile", {
                layout: "main",
                first: data.rows[0].first,
                last: data.rows[0].last,
                email: data.rows[0].email,
                age: data.rows[0].age,
                city: data.rows[0].city,
                url: data.rows[0].url
            });
        })
        .catch(err => console.log(err));
});

app.post("/profile/edit", (req, res) => {
    if (req.body.password != "") {
        bcrypt.hash(req.body.password).then(hash => {
            Promise.all([
                db.updateUsers(
                    req.body.first,
                    req.body.last,
                    req.body.email,
                    hash,
                    req.session.userId
                ),
                db.updateUserProfiles(
                    req.body.age,
                    req.body.city,
                    req.body.url,
                    req.session.userId
                )
            ])
                .then(() => res.redirect("/petition/signers"))
                .catch(err => console.log(err));
        });
    } else {
        Promise.all([
            db.updateUsersNoPass(
                req.body.first,
                req.body.last,
                req.body.email,
                req.session.userId
            ),
            db.updateUserProfiles(
                req.body.age,
                req.body.city,
                req.body.url,
                req.session.userId
            )
        ])
            .then(() => res.redirect("/petition/signers"))
            .catch(err => console.log(err));
    }
});

app.post("/delete-signature", (req, res) => {
    db.deleteSignature(req.session.userId)
        .then(() => {
            req.session.signatureId = null;
            res.redirect("/petition");
        })
        .catch(err => console.log(err));
});

app.post("/profile/delete", (req, res) => {
    db.deleteProfile(req.session.userId)
        .then(() => {
            req.session = null;
            res.redirect("/logout");
        })
        .catch(err => console.log(err));
});

app.get("/logout", (req, res) => {
    req.session = null;
    res.redirect("/petition");
});

app.listen(8080, () => console.log("listening!"));

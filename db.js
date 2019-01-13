const spicedPg = require("spiced-pg");
const { dbUser, dbPass } = require("./secrets.json");
const db = spicedPg(`postgres:${dbUser}:${dbPass}@localhost:5432/funkyduck`);

module.exports.addSigners = function(first, last, signature) {
    return db.query(
        `INSERT INTO signatures (first, last, signature)
        VALUES ($1, $2, $3)`,
        [first, last, signature]
    );
};

module.exports.getSigners = function() {
    return db.query("SELECT first, last FROM signatures");
};

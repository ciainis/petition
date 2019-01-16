const spicedPg = require("spiced-pg");
const { dbUser, dbPass } = require("./secrets.json");
const db = spicedPg(`postgres:${dbUser}:${dbPass}@localhost:5432/funkyduck`);

module.exports.addSigners = function(first, last, user_id, signature) {
    return db.query(
        `INSERT INTO signatures (first, last, user_id, signature)
        VALUES ($1, $2, $3, $4) RETURNING id`,
        [first, last, user_id, signature]
    );
};

module.exports.getSigners = function() {
    return db.query(`SELECT first, last FROM signatures`);
};

module.exports.getSignature = function(signatureId) {
    return db.query(`SELECT signature FROM signatures WHERE id = $1`, [
        signatureId
    ]);
};

module.exports.getSignatureId = function(userId) {
    return db.query(`SELECT id FROM signatures WHERE id = $1`, [userId]);
};

module.exports.registerUser = function(first, last, email, password) {
    return db.query(
        `INSERT INTO users (first, last, email, password)
        VALUES ($1, $2, $3, $4) RETURNING id`,
        [first, last, email, password]
    );
};

module.exports.verifyPassword = function(email) {
    return db.query(`SELECT * FROM users WHERE email = $1`, [email]);
};

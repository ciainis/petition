const spicedPg = require("spiced-pg");
const { dbUser, dbPass } = require("./secrets.json");
const db = spicedPg(`postgres:${dbUser}:${dbPass}@localhost:5432/funkyduck`);

module.exports.addSigners = function(user_id, signature) {
    return db.query(
        `INSERT INTO signatures (user_id, signature)
        VALUES ($1, $2) RETURNING id`,
        [user_id, signature]
    );
};

module.exports.getSigners = function() {
    return db.query(`SELECT id, user_id, created_at FROM signatures`);
};

module.exports.getProfile = function() {
    return db.query(
        `SELECT first, last, age, city, url
        FROM users
        LEFT JOIN user_profiles
        ON users.id = user_profiles.user_id
        JOIN signatures
        ON users.id = signatures.user_id`
    );
};

module.exports.getSignature = function(signatureId) {
    return db.query(`SELECT signature FROM signatures WHERE id = $1`, [
        signatureId
    ]);
};

// module.exports.getSignatureId = function(userId) {
//     return db.query(`SELECT id FROM signatures WHERE user_id = $1`, [userId]);
// };

module.exports.registerUser = function(first, last, email, password) {
    return db.query(
        `INSERT INTO users (first, last, email, password)
        VALUES ($1, $2, $3, $4) RETURNING id`,
        [first, last, email, password]
    );
};

// module.exports.verifyPassword = function(email) {
//     return db.query(`SELECT * FROM users WHERE email = $1`, [email]);
// };

module.exports.addProfile = function(age, city, url, userId) {
    return db.query(
        `INSERT INTO user_profiles (age, city, url, user_id)
        VALUES ($1, $2, $3, $4)`,
        [age, city, url, userId]
    );
};

module.exports.getCity = function(userCity) {
    return db.query(
        `SELECT first, last, age, city, url
        FROM users
        LEFT JOIN user_profiles
        ON users.id = user_profiles.user_id
        JOIN signatures
        ON users.id = signatures.user_id
        WHERE LOWER(city) = LOWER($1)`,
        [userCity]
    );
};

module.exports.verifyPasswordAndGetSignatureId = function(email) {
    return db.query(
        `SELECT users.id, users.first, users.last, users.password, signatures.id AS "signatureId"
        FROM users
        JOIN signatures
        ON users.id = signatures.user_id
        WHERE users.email = $1`,
        [email]
    );
};

module.exports.getProfileInfo = function(userId) {
    return db.query(
        `SELECT users.first, users.last, users.email, user_profiles.age, user_profiles.city, user_profiles.url
        FROM users
        JOIN user_profiles
        ON users.id = user_profiles.user_id
        WHERE users.id = $1`,
        [userId]
    );
};

module.exports.updateUsers = function(first, last, email, password, userId) {
    db.query(
        `UPDATE users
        SET first = $1,
            last = $2,
            email = $3,
            password = $4
        WHERE id = $5`,
        [first, last, email, password, userId]
    );
};

module.exports.updateUsersNoPass = function(first, last, email, userId) {
    db.query(
        `UPDATE users
        SET first = $1,
            last = $2,
            email = $3
        WHERE id = $4`,
        [first, last, email, userId]
    );
};

module.exports.updateUserProfiles = function(age, city, url, userId) {
    db.query(
        `INSERT INTO user_profiles (age, city, url, user_id)
        VALUES($1, $2, $3, $4)
        ON CONFLICT (user_id)
        DO UPDATE SET age = $1, city = $2, url = $3`,
        [age, city, url, userId]
    );
};

module.exports.deleteSignature = function(userId) {
    return db.query(
        `DELETE FROM signatures
        WHERE user_id = $1`,
        [userId]
    );
};

module.exports.deleteProfile = function(userId) {
    return db.query(`DELETE FROM users WHERE id = $1`, [userId]);
};

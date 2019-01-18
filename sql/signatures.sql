DROP TABLE IF EXISTS signatures;

CREATE TABLE signatures(
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    signature TEXT NOT NULL CHECK (signature <> ''),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

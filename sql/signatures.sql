DROP TABLE IF EXISTS signatures;

CREATE TABLE signatures(
    id SERIAL PRIMARY KEY,
    first VARCHAR(200) NOT NULL CHECK (first <> ''),
    last VARCHAR(300) NOT NULL,
    signature TEXT NOT NULL
)

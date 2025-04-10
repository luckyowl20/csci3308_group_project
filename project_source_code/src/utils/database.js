// database.js
const pgp = require('pg-promise')();

const dbConfig = {
    host: 'db', // database server hostname
    port: 5432,
    database: process.env.POSTGRES_DB,
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
};
const db = pgp(dbConfig);



// Make db accessible to routes via export, when this file is imported (using require), the database will be available in that file
module.exports = db;
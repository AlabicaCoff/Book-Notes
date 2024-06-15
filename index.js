import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import env from "dotenv";

const app = express();
const port = 3000;
env.config();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

const db = new pg.Client({
    user: process.env.PG_USER,
    host: process.env.PG_HOST,
    database: process.env.PG_DATABASE,
    password: process.env.PG_PASSWORD,
    port: process.env.PG_PORT,
});
db.connect();

async function checkExistBook(id) {
    try {
        const result = await db.query(
            "SELECT EXISTS(SELECT 1 FROM books WHERE id = $1);", 
            [id]
        );
        let isExist = result.rows[0].exists;
        return isExist;
    } catch (error) {
        console.error('Database query error:', error);
        return false;
    }
}

app.get("/", async (req, res) => {
    try {
        const result = await db.query(
            "SELECT * FROM books ORDER BY rating"
        );
        let allBooks = result.rows;

        res.render("index.ejs", {
            allBooks: allBooks
        });
    } catch (err) {
        console.log(err);
        res.render("error.ejs", {
            error: err,
            url: req.originalUrl
        });
    }
});

app.get("/book/:id", async (req, res) => {
    const id = req.params.id;
    try {
        const isExits = await checkExistBook(id);
        if (isExits) {
            try {
                const result = await db.query(
                    "SELECT * FROM books WHERE id = $1",
                    [id]
                );
                res.render("book.ejs", {
                    book: result.rows[0]
                });
            } catch (err) {
                console.log(err);
                res.render("error.ejs", {
                    error: err,
                    url: req.originalUrl
                });
            }
        } else {
            let error = "No book matched this id";
            console.log(error);
            res.render("error.ejs", {
                error: error,
                url: req.originalUrl
            });
        }
    } catch (err) {
        console.log(err);
        res.render("error.ejs", {
            error: err,
            url: req.originalUrl
        });
    }
});

app.get("/book/action/New", async (req, res) => {
    res.render("new_update.ejs", {
        action: "New",
        url: "/book/action/New"
    });
});

app.post("/book/action/New", async (req, res) => {
    const id = req.body.id;
    const name = req.body.name;
    const author = req.body.author;
    const date = req.body.date;
    const rating = req.body.rating;
    const summary = req.body.summary;
    const note = req.body.note;

    try {
        const result = db.query("INSERT INTO books VALUES ($1, $2, $3, $4, $5, $6, $7)", 
            [id, name, author, date, rating, summary, note]
        );

        res.redirect("/");
    } catch (err) {
        console.log(err);
        res.render("error.ejs", {
            error: err,
            url: req.originalUrl
        });
    }
});

app.get("/book/action/Edit/:id", async (req, res) => {
    const id = req.params.id;

    try {
        const isExits = await checkExistBook(id);
        if (isExits) {
            try {
                const result = await db.query(
                    "SELECT * FROM books WHERE id = $1",
                    [id]
                );
                res.render("new_update.ejs", {
                    action: "Edit",
                    book: result.rows[0],
                    url: `/book/action/Edit/${id}`
                });
            } catch (err) {
                console.log(err);
                res.render("error.ejs", {
                    error: err,
                    url: req.originalUrl
                });
            }
        } else {
            let err = "No book matched this id";
            console.log(err);
            res.render("error.ejs", {
                error: err,
                url: req.originalUrl
            });
        }
    } catch (err) {
        console.log(err);
        res.render("error.ejs", {
            error: err,
            url: req.originalUrl
        });
    }
});

app.post("/book/action/Edit/:id", async (req, res) => {
    const id = req.params.id;
    const name = req.body.name;
    const author = req.body.author;
    const date = req.body.date;
    const rating = req.body.rating;
    const summary = req.body.summary;
    const note = req.body.note;

    try {
        const result = await db.query(
            "UPDATE books SET name = $1, author = $2, date = $3, rating = $4, summary = $5, note = $6 WHERE id = $7",
            [name, author, date, rating, summary, note, id]
        );
        res.redirect("/book/" + id);
    } catch (err) {
        console.log(date)
        console.log(err);
        res.render("error.ejs", {
            error: err,
            url: req.originalUrl
        });
    }
});

app.post("/book/action/delete/:id", async (req, res) => {
    const id = req.params.id;

    try {
        const isExits = await checkExistBook(id);
        if (isExits) {
            try {
                const result = await db.query(
                    "DELETE FROM books WHERE id = $1;",
                    [id]
                );
                res.redirect("/");
            } catch (err) {
                console.log(err);
                res.render("error.ejs", {
                    error: err,
                    url: req.originalUrl
                });
            }
        } else {
            let err = "No book matched this id";
            console.log(err);
            res.render("error.ejs", {
                error: err,
                url: req.originalUrl
            });
        }
    } catch (err) {
        console.log(err);
        res.render("error.ejs", {
            error: err,
            url: req.originalUrl
        });
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
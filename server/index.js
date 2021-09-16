const express = require('express');
const cors = require('cors');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const variablesFile = require('./variables');

const { Client } = require("iexjs");
const iex = new Client({api_token: variablesFile.IEX.api_token, version: variablesFile.IEX.version});

const bcrypt = require('bcrypt');
const saltRounds = 10;

const PORT = process.env.PORT || 3001;

const app = express();
app.use(express.json());
app.use(cors({
    origin: ['http://localhost:${PORT}/'],
    methods: ['GET', 'POST'],
    credentials: true
}));
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
    key: variablesFile.session.key,
    secret: variablesFile.session.secret,
    resave: false,
    saveUninitialized: false,
    cookie: {
        expires: 1000*60*60*24*7
    }
}));

const db = mysql.createConnection({
    user: variablesFile.db.user,
    host: variablesFile.db.host,
    password: variablesFile.db.password,
    database: variablesFile.db.database
});

/**
 * Log in and register
 */
app.post("/api", (req, res) => {
    const username = req.body.username;
    const password = req.body.password;
    const action = req.body.action;

    if (action === "register") {
        console.log('register');
        console.log(username + ' : ' + password);
        bcrypt.hash(password, saltRounds, (err, hash) => {
            if (err) console.log(err);
            db.query("SELECT * FROM users WHERE username = ?", [username],
            (err, result) => {
                if (err) res.send({err: err});
                if (result.length > 0) {
                    res.json({message: 'Sorry, this username is already taken'});
                } else {
                    db.query(
                        "INSERT INTO users (username, passhash) VALUES (?, ?)", 
                        [username, hash], 
                        (err, result) => {console.log(err);}
                    );
                    console.log('registered???');
                    res.json({ message: 'Registered. Now you can login!' });
                }
            });
        });
    } else if (action === "login") {
        db.query(
            "SELECT * FROM users WHERE username = ?",
            [username],
            (err, result) => {
                if (err) res.send({err: err});
                if (result.length > 0) {
                    bcrypt.compare(password, result[0].passhash, (error, response) => {
                        if (response) {
                            req.session.user = result[0];
                            console.log(req.session.user);
                            res.json({auth: true, user: req.session.user});
                        } else {
                            res.json({ auth: false, message: 'Incorrect username/password' });
                        }
                    })
                } else {
                    res.json({ auth: false, message: 'User does not exist' });
                }
            }
        );
    };
});

app.get("/api", (req, res) => {
    if (req.session.user) {
        res.send({ loggedIn: true, user: req.session.user });
    } else {
        res.send({ loggedIn: false });
    }
});

app.get("/api/login", (req, res) => {
    if (req.session.user) {
        res.json({ loggedIn: true, user: req.session.user });
    } else {
        res.json({ loggedIn: false });
    }
});

app.get("/api/account", (req, res) => {
    const id = req.session.user.id;

    db.query(
        "SELECT * FROM portfolios WHERE user_id = ?",
        [id],
        (err, result) => {
            if (err) res.json({ err: err });
            else {
                let portfolioItems = result;
                db.query(
                    "SELECT * FROM users WHERE id = ?",
                    [id],
                    (err, userResult) => {
                        if (err) res.json({ err: err });
                        else {
                            res.json({ cash: userResult[0].cash, portfolioItems: portfolioItems });
                        }
                    }
                )
            }
        }
    );
});

app.post('/api/logout', (req, res) => {
    req.session.destroy(function() {
        res.clearCookie('connect.sid', { path: '/' }).status(200).send('Cookie deleted.');
    });
});

app.post('/api/sell', (req, res) => {
    const symbol = req.body.symbol.toUpperCase();
    const sellShares = Number(req.body.shares);
    const id = req.session.user.id;

    db.query(
        "SELECT * FROM portfolios WHERE user_id = ? AND symbol = ?",
        [id, symbol],
        (err, result) => {
            if (err) {
                res.json({ err: err });
            } else {
                if (result.length > 0) {
                    let availableShares = result[0].shares;
                    if (availableShares < sellShares) {
                        res.json({ message: `Sorry, you do not have that many shares. You only have ${availableShares} shares.` });
                    } else {
                        // There are available shares to sell
                        iex.quote(symbol).then((result) => {
                            let price = result.latestPrice;
                            price *= sellShares;
                            
                            // add to cash
                            db.query(
                                "UPDATE users SET cash = cash + ? WHERE id = ?",
                                [price, id],
                                (err, result) => {
                                    if (err) res.json({ err: err });
                                    else {
                                        if (availableShares-sellShares > 0) {
                                            // subtract from portfolio
                                            db.query(
                                                "UPDATE portfolios SET shares = ? WHERE user_id = ? AND symbol = ?",
                                                [availableShares-sellShares, id, symbol],
                                                (err, result) => {
                                                    if (err) res.json({ err: err });
                                                    else res.json({ message: `Sold ${sellShares} of ${symbol}. You now have ${availableShares-sellShares} shares left.` });
                                                }
                                            )
                                        } else {
                                            // no more shares. Remove from table
                                            db.query(
                                                "DELETE FROM portfolios WHERE user_id = ? AND symbol = ?",
                                                [id, symbol],
                                                (err, result) => {
                                                    if (err) res.json({ err: err });
                                                    else res.json({ message: `Sold ${sellShares} of ${symbol}. You now have ${availableShares-sellShares} shares left.` });
                                                }
                                            )
                                        }
                                    }
                                }
                            )
                        }).catch(err => {
                            res.json({ err: err });
                        });
                    }
                } else {
                    res.json({ message: 'Sorry you do not have any shares of this stock.' });
                }
            }
        }
    )
})

app.post("/api/buy", (req, res) => {
    const symbol = req.body.symbol.toUpperCase();
    const shares = Number(req.body.shares);
    const id = req.session.user.id;

    iex.quote(symbol).then((result) => {
        let cost = (shares*result.latestPrice);
        let cash = 0;

        // add to database if user has enough money
        db.query(
            "SELECT * FROM users WHERE id = ?",
            [id],
            (err, result) => {
                if (err) res.send({ err: err });
                if (result.length > 0) {
                    cash = (result[0].cash);

                    if (cash >= cost) {
                        // add shares to portfolio
                        db.query(
                            "SELECT * FROM portfolios WHERE user_id = ? AND symbol = ?",
                            [id, symbol],
                            (err, result) => {
                                if (err) res.json({ err: err });

                                if (result.length > 0) {
                                    let newShares = shares + result[0].shares;
                                    // Update database
                                    db.query(
                                        "UPDATE portfolios SET shares = ? WHERE user_id = ? AND symbol = ?", 
                                        [newShares, id, symbol],
                                        (err, result) => {
                                            if (err) {
                                                res.json({ err: err });
                                            } else {
                                                // subtract money from cash
                                                cash = (cash-cost).toFixed(2);
                                                db.query(
                                                    "UPDATE users SET cash = ? WHERE id = ?", 
                                                    [cash, id],
                                                    (err, result) => {
                                                        if (err) res.json({ err: err });
                                                        res.json({ message: `Bought ${shares} shares of ${symbol}. Now you have ${newShares} shares.` });
                                                    }
                                                );
                                            }
                                        }
                                    );
                                } else {
                                    // Insert into database
                                    db.query(
                                        "INSERT INTO portfolios (user_id, shares, symbol) VALUES (?, ?, ?)", 
                                        [id, shares, symbol],
                                        (err, result) => {
                                            if (err) {
                                                res.json({ err: err });
                                            } else {
                                                // subtract money from cash
                                                cash = (cash-cost).toFixed(2);
                                                db.query(
                                                    "UPDATE users SET cash = ? WHERE id = ?",
                                                    [cash, id],
                                                    (err, result) => {
                                                        if (err) res.json({ err: err });
                                                        else res.json({ message: `Bought ${shares} shares of ${symbol}` });
                                                    }
                                                );
                                            }
                                        }
                                    );
                                }
                            }
                        ); 
                    } else {
                        res.json({ message: `Sorry, you do not have enough money to buy ${shares} shares. You only have $${cash}.` });
                    }
                } else {
                    res.json({ err: 'User not found' });
                }
            }
        );
    }).catch((error) => {
        res.json({ message: 'Sorry, this ticker symbol does not exist' });
    });
});

app.post("/api/quote", (req, res) => {
    const symbol = req.body.symbol.toUpperCase();

    iex.quote(symbol).then((result) => {
        res.json({ found: true, message: 'successful', result: result });
    }).catch((error) => {
        res.json({ found: false, message: 'Sorry, this ticker symbol does not exist' });
    });
});

app.listen(PORT, () => {
    console.log(`Server listening on ${PORT}. URL open on http://localhost:${PORT}/`);
});

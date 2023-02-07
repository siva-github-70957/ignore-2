//jshint esversion:6
require('dotenv').config();
const express = require('express');
const bodyparser = require('body-parser');
const ejs = require('ejs');
// const bcrypt = require('bcrypt'); // level 4
// const saltRounds = 10; // level 4

const mongoose = require('mongoose');
// const encrypt = require('mongoose-encryption'); level-2 encryption
// const md5 = require('md5'); // level 3

// level - 5
const session = require('express-session');
const passport = require('passport');
const passportlocalmongoose = require('passport-local-mongoose');
///////
/// level - 6
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findorcreate = require('mongoose-findorcreate');
///
mongoose.set('strictQuery', true);

const app = express();

app.use(express.static('public'));
app.set('view engine', 'ejs');
app.use(bodyparser.urlencoded({ extended: true }));

////  level -5 
app.use(session({
    secret: 'ourlittlesecret!!!',
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());
///

mongoose.connect('mongodb://127.0.0.1:27017/userdb', { useNewUrlParser: true });
// mongoose.set("useCreateIndex", true);

const userSchema = new mongoose.Schema({
    username: String,
    email: String,
    password: String,
    googleId: String,
    secret: String
});

userSchema.plugin(passportlocalmongoose); // level 5
userSchema.plugin(findorcreate); // level 6
// level 2 of encryption
// userSchema.plugin(encrypt, { secret: process.env.SECRET, encryptedFields: ['password'] });

const User = mongoose.model('User', userSchema);

// level 5

passport.use(User.createStrategy());
passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser((id, done) => {
    User.findById(id, (err, user) => {
        done(err, user);
    });
})
//////

//// level -  6

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets"

},
    function (accessToken, refreshToken, profile, cb) {
        // console.log(profile);
        User.findOrCreate({ googleId: profile.id }, function (err, user) {
            return cb(err, user);
        });
    }
));

///////

app.get('/', (req, res) => {
    res.render('home');
})

/// level - 6
app.get('/auth/google',
    passport.authenticate('google', { scope: ["profile"] }));

app.get('/auth/google/secrets',
    passport.authenticate('google', { failureRedirect: '/login' }),
    function (req, res) {
        // Successful authentication, redirect to secrets page
        res.redirect('/secrets');
    });

/////////////



///  level 5 
app.get('/secrets', (req, res) => {
    User.find({ 'secret': { $ne: null } }, (err, founduser) => {
        if (err)
            console.log(err);
        else {
            console.log(founduser);
            res.render('secrets', { userswithsecrets: founduser });
        }
    })
});
/////

//// level - 5
app.get('/logout', (req, res) => {
    req.logout((err) => {
        if (err)
            console.log(err);
        else
            res.redirect('/');
    });

});
/////

app.get('/register', (req, res) => {
    res.render('register');
})

///// level - 5 
app.post('/register', (req, res) => {

    User.register({ username: req.body.username }, req.body.password, (err, user) => {
        if (err) { console.log(err); res.redirect('/register'); }
        else {
            passport.authenticate('local')(req, res, () => {
                res.redirect('/secrets');
            })
        }
    });
})
///////
// app.post('/register', (req, res) => {

//     bcrypt.hash(req.body.password, saltRounds, (err, hash) => { // level 4 salting

//         const newuser = new User({
//             email: req.body.username,
//             password: hash
//             // password: md5(req.body.password), // level 3 hashing
//         })
//         newuser.save((err) => {
//             if (err)
//                 console.log(err);
//             else
//                 res.render('secrets');
//         });

//     });


// })

app.get('/login', (req, res) => {
    res.render('login');
});

////// level - 5
app.post('/login', (req, res) => {
    const user = new User({
        username: req.body.username,
        password: req.body.password
    });
    req.login(user, (err) => {
        if (err)
            console.log(err);
        else
            passport.authenticate('local')(req, res, () => {
                res.redirect('/secrets');
            })
    })
})
//////


// app.post('/login', (req, res) => {
//     const username = req.body.username;
//     const password = req.body.password;
//     // const password = md5(req.body.password); level 3 hashing
//     User.findOne({ email: username }, (err, founduser) => {
//         if (err) {
//             console.log(err);
//         }
//         else {
//             if (founduser) {
//                 bcrypt.compare(password, founduser.password, (err, result) => { // 4 salting and hashing 10 saltrounds
//                     if (result === true)
//                         res.render('secrets');
//                     else
//                         console.log('wrong pass code');
//                 })
//             }
//             else
//                 console.log('username itsel is wrong');

//         }
//     })
// })

app.get('/submit', (req, res) => {
    if (req.isAuthenticated())
        res.render('submit');
    else
        res.redirect('/login');
});

app.post('/submit', (req, res) => {
    const submitsecret = req.body.secret;

    User.findById(req.user.id, (err, founduser) => {
        if (err)
            console.log(err);
        else {
            if (founduser) {
                founduser.secret = submitsecret;
                founduser.save(() => {
                    res.redirect('/secrets');
                });
            }
        }
    });
});

app.listen(3000, () => {
    console.log('server started in 3000');
})
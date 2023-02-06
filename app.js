//jshint esversion:6
require('dotenv').config();
const express = require('express');
const bodyparser = require('body-parser');
const ejs = require('ejs');

const mongoose = require('mongoose');
const encrypt = require('mongoose-encryption');
mongoose.set('strictQuery', true);

const app = express();

app.use(express.static('public'));
app.set('view engine', 'ejs');
app.use(bodyparser.urlencoded({ extended: true }));

mongoose.connect('mongodb://127.0.0.1:27017/userdb', { useNewUrlParser: true });

const userSchema = new mongoose.Schema({
    email: String,
    password: String
});


userSchema.plugin(encrypt, { secret: process.env.SECRET, encryptedFields: ['password'] });

const User = mongoose.model('user', userSchema);


app.get('/', (req, res) => {
    res.render('home');
})


app.get('/register', (req, res) => {
    res.render('register');
})
app.post('/register', (req, res) => {
    const newuser = new User({
        email: req.body.username,
        password: req.body.password,
    })
    newuser.save((err) => {
        if (err)
            console.log(err);
        else
            res.render('secrets');
    });

})

app.get('/login', (req, res) => {
    res.render('login');
});

app.post('/login', (req, res) => {
    const username = req.body.username;
    const password = req.body.password;
    User.findOne({ email: username }, (err, founduser) => {
        if (founduser) {
            if (founduser.password === password)
                res.render('secrets');
            else
                console.log('password is wrong');
        }
        else {
            console.log('username itself is wrond');
            res.redirect('/');
        }
    })
})

app.listen(3000, () => {
    console.log('server started in 3000');
})
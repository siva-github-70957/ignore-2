const express = require('express');
const bodyparser = require('body-parser');

const app = express();

app.set('view engine', 'ejs');

app.get('/', (req, res) => {
    let today = new Date();
    let currentday = today.getDay();
    let day = "";
    console.log(currentday);

    switch (currentday) {
        case 0: day = 'sunday'
            break;
        case 1: day = 'monday'
            break;
        case 2: day = 'Tuesday'
            break;
        case 3: day = 'wednesday'
            break;
        case 4: day = 'Thursday'
            break;
        case 5: day = 'friday'
            break;
        case 6:
            day = 'saturday';
            break;
    }
    res.render('list', { kindofday: day });
})

app.listen(3000, () => {
    console.log('server is up and running');
})
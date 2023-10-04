const app = require('express')();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const http = require('http').Server(app);
const validator = require('express-validator');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
dotenv.config({ path: './config.env' });
const DB = process.env.DATABASE;
const cors = require('cors');

app.use(
  cors({
    origin: 'http://localhost:3000',
    optionsSuccessStatus: 200,
  })
);

mongoose
  .connect(DB, {
    useNewUrlParser: true,
  })
  .then(() => {
    console.log('DB connections successfully');
  })
  .catch((err) => {
    console.error('Errore nella connessione a MongoDB:', err);
  });

process.on('unhandledRejection', (err) => {
  console.log(err.name, err.message);
  console.log('Unhandled rejection!');
  process.exit(1);
});

process.on('unchaughtException', (err) => {
  console.log(err.name, err.message);
  console.log('Unchaught Exception!');
  process.exit(1);
});

var session = require('express-session');
var bodyParser = require('body-parser');
var flash = require('connect-flash');
var i18n = require('i18n-express');

app.use(cookieParser());
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);
app.use(bodyParser.json());

app.use(
  session({
    key: 'user_sid',
    secret: 'somerandonstuffs',
    resave: false,
    saveUninitialized: false,
    cookie: {
      expires: 1200000,
    },
  })
);
app.use(session({ resave: false, saveUninitialized: true, secret: 'nodedemo' }));

app.use(flash());
app.use(
  i18n({
    translationsPath: path.join(__dirname, 'i18n'),
    siteLangs: ['es', 'en', 'de', 'ru', 'it', 'fr'],
    textsVarName: 'translation',
  })
);

const authRouter = require('./routers/authRoutes');
app.use('/api/', authRouter);

app.use(express.static(path.join(__dirname, 'public')));

app.get('/layouts/', function (req, res) {
  res.render('view');
});

const projectRouter = require('./routers/projectRoutes');
const userRouter = require('./routers/userRoutes');
const clientRouter = require('./routers/clientRoutes');
const taskRouter = require('./routers/taskRoutes');
const activityRouter = require('./routers/activityRoutes');
const commentRouter = require('./routers/commentRoutes');
const fileRouter = require('./routers/fileRoutes');

app.use('/api/', projectRouter);
app.use('/api/', userRouter);
app.use('/api/', clientRouter);
app.use('/api/', taskRouter);
app.use('/api/', activityRouter);
app.use('/api/', commentRouter);
app.use('/api/', fileRouter);

http.listen(8000, function () {
  console.log('listening on *:8000');
});

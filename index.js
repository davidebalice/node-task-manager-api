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

global.token = '';

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || /(^|\.)davidebalice\.dev$/.test(origin) || /^http:\/\/localhost(:\d{1,5})?$/.test(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
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
    secret: 'secretkey',
    resave: false,
    saveUninitialized: true,
  })
);
/*
app.use(
  session({
    name: 'user_sid',
    secret: 'secretkey',
    resave: false,
    saveUninitialized: false,
    cookie: {
      expires: 1200000,
    },
  })
);
*/
app.use(flash());
app.use(
  i18n({
    translationsPath: path.join(__dirname, 'i18n'),
    siteLangs: ['es', 'en', 'de', 'ru', 'it', 'fr'],
    textsVarName: 'translation',
  })
);

app.use(express.static(path.join(__dirname, 'public')));

const authRouter = require('./routers/authRoutes');
const dashboardRouter = require('./routers/dashboardRoutes');
const projectRouter = require('./routers/projectRoutes');
const userRouter = require('./routers/userRoutes');
const clientRouter = require('./routers/clientRoutes');
const taskRouter = require('./routers/taskRoutes');
const activityRouter = require('./routers/activityRoutes');
const commentRouter = require('./routers/commentRoutes');
const fileRouter = require('./routers/fileRoutes');
const screenshotRouter = require('./routers/screenshotRoutes');

app.use('/api/', authRouter);
app.use('/api/', dashboardRouter);
app.use('/api/', projectRouter);
app.use('/api/', userRouter);
app.use('/api/', clientRouter);
app.use('/api/', taskRouter);
app.use('/api/', activityRouter);
app.use('/api/', commentRouter);
app.use('/api/', fileRouter);
app.use('/api/', screenshotRouter);

http.listen(8000, function () {
  console.log('listening on *:8000');
});

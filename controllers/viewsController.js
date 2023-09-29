const Event = require('../models/eventModel');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/error');

exports.alerts = (req, res, next) => {
  const { alert } = req.query;
  if (alert === 'booking')
    res.locals.alert =
      "Your booking was successful! Please check your email for a confirmation. If your booking doesn't show up here immediatly, please come back later.";
  next();
};

exports.index = catchAsync(async (req, res, next) => {
  const events = await Event.find();
  res.status(200).render('index', {
    title: 'Events',
    events,
  });
});

exports.getOverview = catchAsync(async (req, res, next) => {
  const events = await Event.find();
  res.status(200).render('events', {
    title: 'Events',
    events,
  });
});

exports.getEvent = catchAsync(async (req, res, next) => {
  const event = await Event.findOne({ slug: req.params.slug }).populate({
    path: 'reviews',
    fields: 'review rating user',
  });

  if (!event) {
    return next(new AppError('There is no event with that name.', 404));
  }

  res
    .status(200)
    .set(
      'Content-Security-Policy',
      "default-src 'self' https://*.mapbox.com ;base-uri 'self';block-all-mixed-content;font-src 'self' https: data:;frame-ancestors 'self';img-src 'self' data:;object-src 'none';script-src https://cdnjs.cloudflare.com https://api.mapbox.com 'self' blob: ;script-src-attr 'none';style-src 'self' https: 'unsafe-inline';upgrade-insecure-requests;"
    )
    .render('event', {
      title: `${event.name} Event`,
      event,
    });
});

exports.getLoginForm = (req, res) => {
  res.status(200).render('login', {
    title: 'Log into your account',
  });
};

exports.getAccount = (req, res) => {
  res.status(200).render('account', {
    title: 'Your account',
  });
};

exports.getMyEvents = catchAsync(async (req, res, next) => {});

exports.updateUserData = catchAsync(async (req, res, next) => {
  const updatedUser = await User.findByIdAndUpdate(
    req.user.id,
    {
      name: req.body.name,
      surname: req.body.surname,
      email: req.body.email,
    },
    {
      new: true,
      runValidators: true,
    }
  );

  res.status(200).render('account', {
    title: 'Your account',
    user: updatedUser,
  });
});

function paginateData(totalResults, currentPage, limit) {
  const totalPages = Math.ceil(totalResults / limit);
  return {
    totalPages,
    currentPage,
    limit,
  };
}

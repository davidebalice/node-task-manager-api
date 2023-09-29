const demoMode = (req, res, next) => {
  if (process.env.DEMO_MODE === 'true') {
    res.status(403).send('Demo mode active, crud operations are not allowed.');
  } else {
    next();
  }
};

module.exports = demoMode;

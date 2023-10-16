const demoMode = (req, res, next) => {
  if (process.env.DEMO_MODE === 'true') {
    global.demo = true;
    next();
  } else {
    global.demo = false;
    next();
  }
};

module.exports = demoMode;

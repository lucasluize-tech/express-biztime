/** BizTime express application. */


const express = require("express");
const companiesRoute = require("./routes/companies")
const invoiceRoute = require("./routes/invoices")
const industryRoute = require("./routes/industry")
const app = express();
const ExpressError = require("./expressError")


app.use(express.json());

app.use('/companies', companiesRoute)
app.use('/invoices', invoiceRoute)
app.use('/industries', industryRoute)
/** 404 handler */

app.use(function(req, res, next) {
  const err = new ExpressError("Not Found", 404);
  return next(err);
});

/** general error handler */

app.use((err, req, res, next) => {
  res.status(err.status || 500);

  return res.json({
    error: err,
    message: err.message
  });
});


module.exports = app;

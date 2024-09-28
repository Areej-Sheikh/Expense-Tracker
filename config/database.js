const mongoose = require("mongoose");
mongoose
  .connect(process.env.MONGOURL)
  .then(() => {
    console.log("Database Is Connected");
  })
  .catch((error) => {
    console.log(error.message);
  });

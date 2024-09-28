const express = require("express");
const router = express.Router();
const ExpenseSchema = require("../models/expenseSchema");
const { isLoggedIn } = require("../middleware/auth.middleware");

router.get("/create",isLoggedIn, function (req, res) {
  res.render("CreateExpense", { title: "Expense Tracker | Create Expense" ,  user: req.user,});
});
router.post("/create", isLoggedIn,async function (req, res) {
  try {
    const newexpense = await ExpenseSchema(req.body);
    // newexpense.user = req.user._id;
    await newexpense.save();

    // req.user.expenses.push(newexpense._id);
    // await req.user.save();
    res.redirect("/expense/show");
  } catch (error) {
    console.log(error.message);
  }
});
router.get("/show", isLoggedIn,async function (req, res) {
  try {
    const allExpenses = await ExpenseSchema.find();
    res.render("ShowExpense", {
      title: "Expense Tracker | Watch Expenses",
      expenses: allExpenses,
      user: req.user,
    });
  } catch (error) {
    console.log(error.message);
  }
});
router.get("/details/:id",isLoggedIn, async function (req, res) {
  try {
    const expenses = await ExpenseSchema.findById(req.params.id);
    res.render("ExpenseDetails", {
      title: "Expense Tracker | Expense Details",
      expense: expenses,
      user: req.user,
    });
  } catch (error) {
    console.log(error.message);
  }
});
router.get("/delete/:id", isLoggedIn,async function (req, res) {
  try {
    await ExpenseSchema.findByIdAndDelete(req.params.id);
    // await req.user.expenses.pull(deletedExpense._id);
    // await req.user.save();
    res.redirect("/expense/show");
  } catch (error) {
    console.log(error.message);
  }
});
router.get("/update/:id",isLoggedIn, async function (req, res) {
  try {
    const updateExpense = await ExpenseSchema.findById(req.params.id);
    res.render("UpdateExpense", {
      title: "Expense Tracker | Update Expense",
      expense: updateExpense,
      user: req.user,
    });
  } catch (error) {
    console.log(error.message);
  }
});
router.post("/update/:id", isLoggedIn,async function (req, res) {
  try {
    const updateExpense = await ExpenseSchema.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.redirect("/expense/details/" + updateExpense._id);
  } catch (error) {
    console.log(error.message);
  }
});

module.exports = router;

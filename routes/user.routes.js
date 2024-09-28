const express = require("express");
const router = express.Router();

const UserSchema = require("../models/userSchema");
const { isLoggedIn } = require("../middleware/auth.middleware");
const sendMail = require('../config/email');

const upload = require("../middleware/multimedia.middleware");
const fs = require("fs");

const passport = require("passport");
const LocalStrategy = require("passport-local");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
passport.use(new LocalStrategy(UserSchema.authenticate()));

passport.use( new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/user/auth/google/callback",
    },
    function (accessToken, refreshToken, profile, done) {
      // Here you can save the user profile to your database
      return done(null, profile);
    }
  )
);
router.get( "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get("/auth/google/callback",function (req, res, next) {
    console.log("req==>", req.query);
    return next();
  },
  passport.authenticate("google", { failureRedirect: "/" }),
  async (req, res, next) => {
    const doesUserExist = await UserSchema.findOne({
      email: req.user.emails[0].value,
    });
    if (doesUserExist) {
      req.login(doesUserExist, (error) => {
        if (error) {
          return next(error);
        }
      });
      return res.redirect("/user/profile");
    }
    const newUser = UserSchema.create({
      username: req.user.displayName,
      email: req.user.emails[0].value,
    });
    req.login(newUser, (error) => {
      if (error) {
        return next(error);
      }
    });
    res.redirect("/user/profile");
  }
);

router.get("/signup", async (req, res) => {
  res.render("UserSignup", {
    title: "Expense Tracker | Signup",
    user: req.user,
  });
});
router.post("/signup", async (req, res, next) => {
  try {
    const { username, email, password } = req.body;
    UserSchema.register({ username, email }, password);
    if (!username || !password) {
      req.flash("error", "All fields are required");
      return res.redirect("/signup");
    }

    req.flash("success", "Account created successfully");
    res.redirect("/user/signin");
  } catch (error) {
    next(error);
  }
});
router.get("/signin", async (req, res) => {
    res.render("UserSignin", {
    title: "Expense Tracker | Signin",
    user: req.user,
  });
});

router.post("/signin", (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
      if (err) {
        // If there's an error during authentication, flash an error message and redirect
        req.flash('error', 'An error occurred during sign-in.');
        return res.redirect('/user/signin');
      }
      if (!user) {
        // If no user is returned, authentication failed
        req.flash('error', 'Invalid username or password.');
        return res.redirect('/user/signin');
      }
      // If authentication succeeds, log the user in
      req.logIn(user, (err) => {
        if (err) {
          req.flash('error', 'Login failed. Please try again.');
          return res.redirect('/user/signin');
        }
        // If login is successful, flash success message and redirect to the profile
        req.flash('success', 'Successfully signed in!');
        return res.redirect('/user/profile');
      });
    })(req, res, next);
  });
router.get("/profile", isLoggedIn, async (req, res, next) => {
  try {
    res.render("UserProfile", {
      title: "Expense Tracker | Profile",
      user: req.user,
    });
  } catch (error) {
    next(error);
  }
});
router.get("/signout", isLoggedIn, async (req, res) => {
  req.logout(() => {
    req.flash("success", "Logged out successfully");
    res.redirect("/user/signin");
  });
});
router.get("/reset-password", isLoggedIn, async (req, res) => {
  res.render("ResetPassword", {
    title: "Expense Tracker | Reset Password",
    user: req.user,
  });
});
router.post("/reset-password", isLoggedIn, async (req, res) => {
    const { 'old-password': oldPassword, 'new-password': newPassword, 'confirm-password': confirmPassword } = req.body;

    try {
        // Check if the new password and confirm password match
        if (newPassword !== confirmPassword) {
            req.flash('error', 'Passwords do not match'); // Set the flash message first
            return res.redirect('/user/reset-password'); // Then redirect
        }

        await req.user.changePassword(oldPassword, newPassword); 
        await req.user.save();
        req.flash('success', 'Password has been changed');
        res.redirect("/user/profile");
    } catch (error) {
        req.flash('error', 'An error occurred while changing the password'); // Handle any errors
        return res.redirect('/user/reset-password'); // Redirect to reset password on error
    }
});
router.get("/delete-account", isLoggedIn, async (req, res, next) => {
    try {
        await UserSchema.findByIdAndDelete(req.user._id);
      //   if (user.avatar != "default.jpg") {
      //     fs.unlinkSync(`public/images/${user.avatar}`);
      // }
        // code to delete all relaated expenses
        res.redirect("/user/signin");
    } catch (error) {
        next(error);
    }
});
router.get("/update-profile", isLoggedIn, async (req, res) => {
    res.render("UserUpdate", {
        title: "Expense Tracker | Update User",
        user: req.user,
    });
});
router.post("/update-profile", isLoggedIn, async (req, res, next) => {
    try { 
      await UserSchema.findByIdAndUpdate(req.user._id, req.body);
      res.redirect("/user/profile");
    } catch (error) {
        next(error);
    }
});
router.post("/avatar",isLoggedIn,upload.single("avatar"),async (req, res) => {
  try {
      if (req.user.avatar != "default.png") {
          fs.unlinkSync(`public/images/${req.user.avatar}`);
      }   
      req.user.avatar = req.file.filename;
      await UserSchema.findByIdAndUpdate(req.user._id, { avatar: req.file.filename });

      res.redirect("/user/update-profile");
  } catch (error) {
      next(error);
  }
}
);
router.get('/forget-password', async(req,res,next)=>{
  res.render('ForgetPassword',{
    title: 'Expense Tracker | Forget Password',
    user: req.user
  })
})

router.post("/forget-password", async (req, res, next) => {
  try {
    const user = await UserSchema.findOne({ email: req.body.email });
    if (!user) return next(new Error("User not found!"));

    if (user) {
      // Generate a random 5-digit OTP
      const otp = Math.floor(10000 + Math.random() * 90000); // 5 digit OTP

      // Send OTP via email
      sendMail(
        req.body.email,
        "OTP Verification",
        `<h1>Your OTP is: ${otp}</h1>
        <p>Please enter this OTP in the app. It is valid for 5 minutes.</p>`
      );

      // Save the OTP and its expiry time in the database
      await UserSchema.findByIdAndUpdate(user._id, {
        OTP: otp,
        otpExpiry: new Date(Date.now() + 300000),
      }); // 5 minutes expiry
    }

    // Redirect the user to the next step

    res.redirect(`/user/verify-otp/${user._id}`);
  } catch (error) {
    next(error);
  }
});

router.get("/verify-otp/:id", async (req, res, next) => {
  res.render("Verify_OTP", {
      title: "Expense Tracker | Verify OTP",
      user: req.user,
      id: req.params.id,
  });
});

router.post("/verify-otp/:id", async (req, res, next) => {
  try {
    const user = await UserSchema.findById(req.params.id);
    
    // Check if user exists
    if (!user) {
      req.flash("error", "User not found. Please try again.");
      return res.redirect('/user/signup');
    }

    // Check if OTP matches and is not expired
    if (Number(req.body.otp) === user.OTP && new Date() < user.otpExpiry) {
      // Redirect to the reset password page
      res.redirect(`/user/set-password/${user._id}`);
    } else {
      // Handle invalid or expired OTP
      req.flash("error", "Invalid OTP or OTP expired. Please try again.");
      res.redirect(`/user/forget-password/${user._id}`);
    }
  } catch (error) {
    next(error);
  }
});

router.get("/set-password/:id", async (req, res, next) => {
  res.render("Set_Password", {
      title: "Expense Tracker | Set Password",
      user: req.user,
      id: req.params.id,
  });
});

router.post("/set-password/:id", async (req, res, next) => {
  try {
    const user = await UserSchema.findById(req.params.id);
    
    // Destructure password and confirmPassword
    const { password, confirmPassword } = req.body;

    // Check if passwords match
    if (password !== confirmPassword) {
      req.flash("error", "Passwords do not match. Please try again.");
      return res.redirect(`/user/set-password/${user._id}`);
    }

    // Check if password is a string
    if (typeof password !== 'string') {
      throw new Error("Password must be a string.");
    }

    // Set the new password
    await user.setPassword(password);
    await user.save();

    // Redirect to sign-in page after password is successfully set
    req.flash("success", "Password has been set successfully. Please sign in.");
    res.redirect("/user/signin");
  } catch (error) {
    next(error);
  }
});



module.exports = router;
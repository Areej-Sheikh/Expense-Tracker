const mongoose = require('mongoose')
const plm = require ('passport-local-mongoose')
const userSchema = new mongoose.Schema({
   username: {
        type: String,
        required: [true, 'Username is required'],
        trim: true,
        minLength:[3,'Username must be atlease 3 characters'],
        maxLength:[20, 'Username cannot be more than 20 characters']
    },
    email: {
        type: String,
        required:[true, 'Email is required'],
        trim: true,
        lowercase: true,
        match: [/^([\w-\.]+@([\w-]+\.)+[\w-]{2,4})?$/, "Invalid Email Format"],

    },
    password: {
        type: String,
    },
    avatar: {
        type: Object,
        default: {
            fileId: "",
            url: "/images/default.png",
            thumbnailUrl: "/images/default.png",
        },
    },
    expenses: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Expense", // Ensure the ref matches the model name
        },
      ],
      
    
    OTP:{type:Number},
    otpExpiry: { type: Date },
},{ timestamps: true })

userSchema.plugin(plm)
const UserSchema = mongoose.model('User', userSchema)
module.exports = UserSchema
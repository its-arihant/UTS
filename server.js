import express from 'express';
import bodyParser from 'body-parser';
import bcrypt from "bcrypt";
import passport from "passport";
import { Strategy } from "passport-local";
import session from "express-session";
import env from "dotenv";
import GoogleStrategy from "passport-google-oauth2" //google auth
import connectDB from './public/js/db.js'
import User from './public/js/user.js';


const port = 3000;
const app = express();
const saltRounds = 10;
env.config();
connectDB();

app.use(express.json());
app.use(bodyParser.urlencoded({extended:true}))
app.use(express.static("public"))

//sessions
app.use(session({
  secret:process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
  cookie:{
    maxAge:1000 * 60  * 60    //one hour length cookie
  }
}))


app.use(passport.initialize());
app.use(passport.session())

//get routes
app.get("/", (req,res)=>{
    res.render("index.ejs");

})
app.get("/signup_user", (req,res)=>{
    res.render("user_signup.ejs")
})
app.get("/login_user", (req,res)=>{
    res.render("user_login.ejs")
})
app.get("/signup_driver", (req,res)=>{
    res.render("driver_signup.ejs")
})
app.get("/login_driver", (req,res)=>{
    res.render("driver_login.ejs")
})
app.get("/signup_volunteer", (req,res)=>{
    res.render("vol_signup.ejs")
})
app.get("/login_vol", (req,res)=>{
    res.render("vol_login.ejs")
})
//interface
app.get("/inter", (req,res)=>{
  res.render("inter.ejs")
})
app.get("/inter2", (req,res)=>{
  res.render("inter2.ejs")
})

app.get("/forms", (req,res)=>{
  res.render("forms.ejs")
})
app.get("/forms2", (req,res)=>{
  res.render("forms2.ejs")
})
app.get("/faceID", (req,res)=>{
  res.render("face_recog.ejs")
})

app.get("/book_cab", (req,res)=>{
    res.render("book_cab.ejs")
})
app.get("/account", (req,res)=>{
    console.log(req.user);
    if(req.isAuthenticated()){
      res.render("acc.ejs")
    }else{
      res.redirect("/login_user")
    }
})



app.get("/auth/google", passport.authenticate("google", {
  scope:["profile", "email"],

}))

app.get("/auth/google/secrets", passport.authenticate("google", {
  successRedirect:"/account",
  failureRedirect: "/login_user"
}))

app.get("/logout", (req,res)=>{
  req.logout((err)=>{
    if (err) console.log(err)
    res.redirect("/")
  })
})

function pause(milliseconds) {
  return new Promise(resolve => setTimeout(resolve, milliseconds));
}
//post routes   -- face
app.get("/acc_for_face", (req, res) => {
  // Access the userName from the query parameters for GET requests
  console.log("acc_for_face route handler called");
  const userName = req.query.userName;
  console.log(userName);
  if (userName) {
    // Render the template with the userName variable
    res.render("acc.ejs", { userName: userName });
  } else {
    // Send an error response or handle the situation accordingly
    res.render("acc.ejs", { userName: "Alan Saji" });
  }

});


app.post('/acc-for-face', (req, res) => {
  const name = req.body.userName;
  console.log(name);
  if (name === "Alan") {
    pause(3000).then(() => {
      console.log("Execution paused for 3 seconds");
      // Code to execute after the pause
      res.json({ redirectUrl: '/acc_for_face', userName: name }); // Include userName in the response
    });
    // Redirect to '/acc_for_face' route
     
  } else {
    res.json({ success: false, message: "unidentified" }); // Respond with JSON
  }
});
//--face



app.post("/signup_user", (req,res)=>{
  const phone = req.body.phoneNo;
  const pass = req.body.password;
  const fname = req.body.firstName;
  const lname = req.body.lastName;
  const email = "dummy@uts.com"

  const createUser = async () => {
    try {
        bcrypt.hash(pass,saltRounds, async (err, hash)=> {
          if(err){
            console.log("Error Hashing Password", err);
          }else{
            const newUser = new User({
              firstName:fname,
              lastName:lname,
              phone: phone,
              password: hash,
              email : email
          });
          await newUser.save();
          console.log('User created:', newUser);
          req.login(newUser, (err)=>{
            console.log(err);
            res.redirect("/account")
          })
          }
          
        })
        
    } catch (error) {
        console.error('Error creating user:', error);
    }
  };
  
  const checkUser = async (condition) => {
    try {
      // Find a document that matches the condition
      const user = await User.findOne(condition);
      
      // Check if the document exists
      if (user) {
          console.log('User exists:', user);
          res.send("Phone Number already Registerd")
      } else {
        createUser();
      }
  } catch (error) {
      console.error('Error checking row:', error);
  }
  }

  
checkUser({ phone: phone });

})

app.post("/login_user", passport.authenticate("local", {
  successRedirect:"/account",
  failureRedirect: "/login_user"
}))

passport.use("local", new Strategy(async function verify(username, password, cb) {
  try {
    const user = await User.findOne({ phone: username });
    if (user) {
      // User found, now check the password
      console.log("user found");
      bcrypt.compare(password, user.password, (err, result) => {
        console.log(result);
        if (err) {
          console.log("error 1");
          return cb(err);
        } else {
          if (result) {
            console.log("reached here");
            return cb(null, user);
          } else {
            console.log("reached here tooo");
            return cb(null, false);
          }
        }
      });
    } else {
      console.log("reached here tooo man");
      return cb(null, false, { message: "The Phone Number provided is not registered, please register" });
    }
  } catch (error) {
    console.log("reached here tooo man yo");
    return cb(error);
  }
}));

passport.use("google", new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: "http://localhost:3000/auth/google/secrets",
  userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo",
}, async(accessToken, refreshToken, profile, cb) => {
  try {
    
    // Check if the user exists in the database
    const user = await User.findOne({ email: profile.email });
    if (!user) {
      // User does not exist, create a new user
      const newUser = await User.create({
        email: profile.email,
        password: "google" // Assuming "google" as the default password for Google-authenticated users
      });
      return cb(null, newUser);
    } else {
      // User exists, return the user
      return cb(null, user);
    }
  } catch (err) {
    return cb(err);
  }
}));

passport.serializeUser((user, cb)=>{
  cb(null, user);
})

passport.deserializeUser((user, cb)=>{
  cb(null, user);
})


app.listen(port, ()=>{
    console.log(`Server running on port ${port}`);
})


// @aditya-s-nair


// @MansaaNarang


// @Mehak13A

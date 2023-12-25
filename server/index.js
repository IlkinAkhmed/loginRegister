const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const session = require("express-session");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const app = express();
app.use(cors());
app.use(express.json());
const port = 8000;
const PrivateKey = "wexvlj@!@#$!__++=";

app.use(
  session({
    secret: "sdogj@#!##__45",
    resave: false,
    saveUninitialized: true,
  })
);

const { Schema } = mongoose;

const userSchema = new Schema(
  {
    username: {
      type: String,
      minLength: [3, "username must be minimum 3 character"],
      maxLength: [20, "username must be maximum 20 character"],
      required: true,
    },
    password: { type: String, required: true },
    role: { type: String, required: true },
  },
  { timestamps: true }
);

const Users = mongoose.model("loginAndRegister", userSchema);

// ----------------------REGISTER-----------------------------

app.post("/register", async (req, res) => {
  try {
    const findedUser = await Users.findOne({ username: req.body.username });
    if (findedUser) {
      res.send("Username already exist!! Try other Username");
      return;
    } else {
      const { username } = req.body;
      const hashedPassword = await bcrypt.hash(req.body.password, 10);
      const user = new Users({
        username,
        password: hashedPassword,
        role: "user",
      });
      await user.save();
      const token = jwt.sign(
        { username: user.username, role: user.role },
        PrivateKey
      );
      res.status(200).send(token);
    }
  } catch (error) {
    res.status(500).send("Internal Server Error");
  }
});

// --------------------------LOGIN--------------------------------------------

app.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await Users.findOne({ username: username });
    if (user && bcrypt.compare(password, user.password)) {
      req.session.userId = user._id;
      const token = jwt.sign(
        { username: user.username, role: user.role },
        PrivateKey
      );
      res.status(200).send(token);
    } else {
      res.status(403).send("wrong details!!!");
    }
  } catch (error) {
    res.status(500).send("Internal Server Error");
  }
});

// --------------------------DELETE--------------------------------------------

app.delete("/users/:id", async (req, res) => {
  try {
    const token = req.headers.authorization;
    const decoded = jwt.verify(token, PrivateKey);
    console.log(decoded);
    if (decoded) {
      if (decoded.role === "admin") {
        const { id } = req.params;
        const user = await Users.findByIdAndDelete(id);
        if (user) {
          res.status(200).send("User Deleted");
        } else {
          res.status(404).send("User Not Found");
        }
      } else {
        res.status(403).send("You have not acces to delete user");
      }
    } else {
      res.status(403).send("You have not acces to delete user");
    }
  } catch (error) {
    res.status(500).send("Internal Server Error");
  }
});

// --------------------------GET ALL USERS--------------------------------------------

app.get("/users", async (req, res) => {
  try {
    const users = await Users.find({});
    res.send(users);
  } catch (error) {
    res.status(500).send("Internal Server Error");
  }
});

mongoose
  .connect(
    "mongodb+srv://loginAndRegister:ilkin123@cluster0.ghwwmer.mongodb.net/"
  )
  .catch((error) => console.log("db not connect" + error));

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

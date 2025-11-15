import express from "express";
import session from "express-session";
import passport from "passport";
const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({ secret: "supersecret", resave: false, saveUninitialized: false }));
app.use(passport.initialize());
export { app, passport };

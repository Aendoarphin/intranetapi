import express from "express";
import { auth, db } from "../index.js";

const userRouter = express.Router();

userRouter
  .post("/signup", (req, res) => {
    // Continue from here
  })
  .get("/", (req, res) => {
    res.send("GET");
  })
  .put("/", (req, res) => {
    res.send("PUT");
  })
  .delete("/", (req, res) => {
    res.send("DELETE");
  });

export default userRouter;

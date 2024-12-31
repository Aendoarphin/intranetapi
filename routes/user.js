import express from "express";
import { auth, db } from "../index.js";
import { setDoc, doc, getDoc, collection } from "firebase/firestore";

const userRouter = express.Router();

const targetCollection = "users";
const sampleData = {
  fullName: "John Doe",
  email: "jdoe@gmail.com",
  password: "superduperpassword",
};

const addUser = async (req, res) => {
  try {
    const userRef = doc(db, targetCollection, sampleData.email);
    await setDoc(userRef, sampleData);
    console.log("User was added");
    res.json({ message: "User was added" });
  } catch (e) {
    console.log("Something went wrong: " + e.message);
  }
};

userRouter
  // Add one new user
  .post("/new", (req, res) => {
    addUser(req, res);
  })
  // Get all users
  .get("/", (req, res) => {
    res.json({ message: "GET /users" });
  })
  // Get user by id
  .put("/:id", (req, res) => {
    res.json({ message: "PUT /users/:id" });
  })
  // Delet one user by id
  .delete("/:id", (req, res) => {
    res.json({ message: "DELETE /users" });
  });

export default userRouter;

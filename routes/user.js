import express, { query } from "express";
import { auth, db } from "../index.js";
import {
  setDoc,
  doc,
  getDoc,
  collection,
  getDocs,
  queryEqual,
  where,
} from "firebase/firestore";
import { getAuth, createUserWithEmailAndPassword, onAuthStateChanged } from "firebase/auth"; // continue from here

const userRouter = express.Router();

const targetCollection = "users";

userRouter
  // Add one new user
  .post("/new", async (req, res) => {
    try {
      const { email, password, first, last, role } = req.body;
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;
      const userRef = doc(db, targetCollection, email);
      const newUser = {
        first,
        last,
        role,
        ...JSON.parse(JSON.stringify(user)),
      };
      await setDoc(userRef, newUser);
      res.json({ message: "User was added", newUser });
    } catch (e) {
      res.json({ message: "Something went wrong: " + e.message });
    }
  })
  // Get all users
  .get("/", async (req, res) => {
    try {
      const allUsers = [];
      const querySnapshot = await getDocs(collection(db, targetCollection));
      querySnapshot.forEach((doc) => {
        allUsers.push(doc.data());
      });
      res.json({ message: "All users", count: allUsers.length, allUsers });
    } catch (e) {
      res.json({ message: "Something went wrong: " + e.message });
    }
  })
  // Get one user by email
  .get("/:email", async (req, res) => {
    try {
      const docSnapshot = await getDoc(
        doc(db, targetCollection, req.params.email)
      );
      if (!docSnapshot.exists()) {
        res.json({ message: "User not found" });
        return;
      }
      const targetUser = docSnapshot.data();
      res.json({ message: "User found", targetUser });
    } catch (e) {
      res.json({ message: "Something went wrong: " + e.message });
    }
  })
  // Delete one user by id
  .delete("/", (req, res) => {
    try {
      const userRef = doc(db, targetCollection, req.body.email);
      const userSnapshot = getDoc(userRef);
      if (!userSnapshot.exists()) {
        res.json({ message: "User not found, nothing to delete" });
        return;
      }
      auth.currentUser.delete
    } catch (e) {
      res.json({ message: "Something went wrong: " + error.message });
    }
  });

export default userRouter;

import express from "express";
import { auth, db } from "../index.js";
import {
  setDoc,
  doc,
  getDoc,
  collection,
  getDocs,
  where,
  query,
} from "firebase/firestore";
import { getAuth, createUserWithEmailAndPassword, onAuthStateChanged } from "firebase/auth";

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
  .delete("/", async (req, res) => {
    try {
      const { email } = req.body;
      const q = query(collection(db, targetCollection), where("email", "==", email));
      const querySnapshot = await getDocs(q);
      const targetUser = []
      querySnapshot.forEach((doc) => {
        targetUser.push(doc.data());
      });
      targetUser.length === 1 ? res.json ({ message: "User deleted", data: targetUser[0] }) : res.json({ message: "User not found" })
    } catch (e) {
      res.json({ message: "Something went wrong: " + e.message });
    }
  });

export default userRouter;

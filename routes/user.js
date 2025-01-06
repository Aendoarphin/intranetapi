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
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth";

const observeAuth = (req, res, next) => {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      console.log("User logged in: " + user.email);
      next();
      return;
    }
    next();
  })
};

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
      const parsedUser = JSON.parse(JSON.stringify(user))
      const newUser = {
        uid: parsedUser.uid,
        first,
        last,
        role,
        email: parsedUser.email,
        lastLoginAt: parsedUser.lastLoginAt,
        createdAt: parsedUser.createdAt,
        emailVerified: parsedUser.emailVerified,
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
  })

// CONTINUE FROM HERE

  // Sign user in
  .post("/login", observeAuth, async (req, res) => {
    try {
      await signInWithEmailAndPassword(auth, req.body.email, req.body.password)
      res.json({ message: "User logged in", data: auth.currentUser })
    } catch (e) {
      res.json({ message: "Something went wrong: " + e.message });
    }
  })
  // Sign user out
  .delete("/logout", async (req, res) => {
    try {
      signOut(auth)
      res.json({ message: "User logged out", data: auth.currentUser.email })
    } catch (e) {
      res.json({ message: "Something went wrong: " + e.message });
    }
  })

export default userRouter;

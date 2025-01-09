import express from "express";
import { auth, db } from "../index.js";
import {
  deleteDoc,
  setDoc,
  doc,
  getDoc,
  collection,
  getDocs,
  where,
  query,
} from "firebase/firestore";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  AuthErrorCodes,
  getIdToken,
} from "firebase/auth";

const observeAuth = (req, res, next) => {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      console.log("User logged in: " + user.email);
      next();
      return;
    }
    next();
  });
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
      const parsedUser = JSON.parse(JSON.stringify(user));
      const newUser = {
        uid: parsedUser.uid,
        first,
        last,
        role,
        email: parsedUser.email,
        lastLoginAt: parsedUser.lastLoginAt,
        createdAt: parsedUser.createdAt,
        emailVerified: parsedUser.emailVerified,
        idToken: await getIdToken(user),
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
  .delete("/delete", async (req, res) => {
    try {
      const { email } = req.body;
      const q = query(
        collection(db, targetCollection),
        where("email", "==", email)
      );
      const querySnapshot = await getDocs(q);
      const targetUser = [];
      querySnapshot.forEach((doc) => {
        targetUser.push(doc.data());
      });
      if (targetUser.length === 1) {
        await deleteDoc(doc(db, targetCollection, email));
        res.json({ message: "User deleted", data: targetUser[0] });
        return;
      }
      res.json({ message: "User not found" });
    } catch (e) {
      res.json({ message: "Something went wrong: " + e.code });
    }
  }) // CONTINUE FROM HERE

  // Sign user in
  .post("/login", observeAuth, async (req, res) => {
    try {
      // Check user cookies if they still
      await signInWithEmailAndPassword(auth, req.body.email, req.body.password);
      res.json({ message: "User logged in", data: auth.currentUser });
    } catch (e) {
      res.json({ message: "Something went wrong: " + e.code });
    }
  })
  // Sign user out
  .delete("/logout", async (req, res) => {
    try {
      signOut(auth);
      res.json({
        message: "User logged out",
        whoLoggedOut: auth.currentUser ? auth.currentUser.email : null,
      });
    } catch (e) {
      res.json({ message: "Something went wrong: " + e.code });
    }
  });

export default userRouter;

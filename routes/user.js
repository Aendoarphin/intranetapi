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
  getIdToken,
  deleteUser,
} from "firebase/auth";

const handleError = (res, error) => {
  res.json({ message: "Something went wrong: " + error.message });
};

const getUserRef = (db, email) => {
  return doc(db, targetCollection, email);
};

const extractUserData = (req) => {
  const { email, password, first, last, role } = req.body;
  return { email, password, first, last, role };
};

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
      const userRef = getUserRef(db, email);
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
      handleError(res, e);
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
      handleError(res, e);
    }
  })
  // Get one user by email
  .get("/:email", async (req, res) => {
    try {
      const docSnapshot = await getDoc(getUserRef(db, req.params.email));
      if (!docSnapshot.exists()) {
        res.json({ message: "User not found" });
        return;
      }
      const targetUser = docSnapshot.data();
      res.json({ message: "User found", targetUser });
    } catch (e) {
      handleError(res, e);
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
        await deleteDoc(querySnapshot.docs[0].ref);
        deleteUser(auth.currentUser);
        res.json({ message: "User deleted", data: targetUser[0] });
        return;
      }
      res.json({ message: "User not found" });
    } catch (e) {
      handleError(res, e);
    }
  })
  // Sign user in
  .post("/login", observeAuth, async (req, res) => {
    try {
      await signInWithEmailAndPassword(auth, req.body.email, req.body.password);
      res.json({ message: "User logged in", data: auth.currentUser });
    } catch (e) {
      handleError(res, e);
    }
  })
  // Sign user out
  .delete("/logout", observeAuth, async (req, res) => {
    try {
      signOut(auth);
      res.json({
        message: "User logged out",
        whoLoggedOut: auth.currentUser ? auth.currentUser.email : null,
      });
    } catch (e) {
      handleError(res, e);
    }
  });

export default userRouter;

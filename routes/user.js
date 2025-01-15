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
	updateDoc,
} from "firebase/firestore";
import {
	createUserWithEmailAndPassword,
	signInWithEmailAndPassword,
	signOut,
	onAuthStateChanged,
	getIdToken,
	deleteUser,
	getIdTokenResult,
  getUserById
} from "firebase/auth";

const handleError = (res, error) => {
	res.json({ message: "Something went wrong: " + error.message });
};

const getUserRef = (db, email) => {
	return doc(db, userCollection, email);
};

const observeAuth = (req, res, next) => {
	onAuthStateChanged(auth, async (user) => {
		if (user) {
			const idTokenInfo = await getIdTokenResult(user, req);
			await setDoc(doc(db, sessionsCollection, user.email), {
				email: user.email,
				idTokenInfo,
			});
			await updateDoc(doc(db, userCollection, user.email), {
				idToken: idTokenInfo.token,
			});
			console.log("User logged in: " + user.email);
			next();
			return;
		}
		next();
	});
};

const userRouter = express.Router();

const userCollection = "users";
const sessionsCollection = "sessions";

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
			const idTokenInfo = await getIdTokenResult(user, req);
			await setDoc(doc(db, sessionsCollection, user.email), {
				email: user.email,
				idTokenInfo,
			});
			await setDoc(userRef, newUser);
			res.json({ message: "User was added", newUser });
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
	// Get all users
	.get("/", async (req, res) => {
		try {
			const allUsers = [];
			const querySnapshot = await getDocs(collection(db, userCollection));
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
	// Update user
	.put("/update", observeAuth, async (req, res) => {
		try {
			const uid = auth.currentUser.uid;
			res.json({ uid: uid });
		} catch (e) {
			handleError(res, e);
		}
	})
	// Delete one user by id
	.delete("/delete", async (req, res) => {
		try {
			const { email } = req.body;
			const q = query(
				collection(db, userCollection),
				where("email", "==", email)
			);
			const querySnapshot = await getDocs(q);
			const targetUser = [];
			querySnapshot.forEach((doc) => {
				targetUser.push(doc.data());
			});
			if (targetUser.length === 1) {
        const uid = targetUser[0].uid;

				await deleteDoc(querySnapshot.docs[0].ref);
				await deleteUser(auth.currentUser); // CONTINUE HERE
				await deleteDoc(doc(db, sessionsCollection, email));
				res.json({ message: "User deleted", data: targetUser[0] });
				return;
			}
			res.json({ message: "User not found" });
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

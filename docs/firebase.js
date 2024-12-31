// A newly made user reference with an auto generated ID
const newUserRef = doc(collection(db, targetCollectionPath))

// An existing user reference which has a predefined ID
const existingUserRef = doc(db, targetCollectionPath, predefId)


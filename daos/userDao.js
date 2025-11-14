const { db } = require('../config/firebase');

class UserDao {
  async getNextUserId() {
    const counterRef = db.ref('counters/users');
    const counterSnapshot = await counterRef.once('value');
    let nextId = 1;

    if (counterSnapshot.exists()) {
      nextId = counterSnapshot.val() + 1;
    }

    await counterRef.set(nextId);
    return nextId;
  }

  async createUser(userId, userData) {
    const userRef = db.ref('users/' + userId);
    await userRef.set(userData);
    return userData;
  }

  async getUserById(userId) {
    const userRef = db.ref('users/' + userId);
    const snapshot = await userRef.once('value');
    return snapshot.val();
  }

  async getUserByEmail(email) {
    const usersRef = db.ref('users');
    const snapshot = await usersRef
      .orderByChild('email')
      .equalTo(email)
      .once('value');

    let userData = null;
    let userId = null;

    snapshot.forEach((childSnapshot) => {
      userId = childSnapshot.key;
      userData = childSnapshot.val();
    });

    return { userId, userData };
  }

  async getUserByUsername(username) {
    const usersRef = db.ref('users');
    const snapshot = await usersRef
      .orderByChild('username')
      .equalTo(username)
      .once('value');

    let userData = null;
    let userId = null;

    snapshot.forEach((childSnapshot) => {
      userId = childSnapshot.key;
      userData = childSnapshot.val();
    });

    return { userId, userData };
  }

  async getUserByUid(uid) {
    const usersRef = db.ref('users');
    const snapshot = await usersRef
      .orderByChild('uid')
      .equalTo(uid)
      .once('value');

    let userData = null;
    let userId = null;

    snapshot.forEach((childSnapshot) => {
      userId = childSnapshot.key;
      userData = childSnapshot.val();
    });

    return { userId, userData };
  }

  async getAllUsers() {
    const usersRef = db.ref('users');
    const snapshot = await usersRef.once('value');
    return snapshot.val() || {};
  }

  async updateLastLogin(userId) {
    const userRef = db.ref('users/' + userId);
    await userRef.update({
      lastLogin: new Date().toISOString(),
    });
  }

  async updateUser(userId, updateData) {
    const userRef = db.ref('users/' + userId);
    await userRef.update(updateData);
    return updateData;
  }
}

module.exports = new UserDao();
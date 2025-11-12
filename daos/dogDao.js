const { db } = require('../config/firebase');

class DogDao {
  async getNextDogId() {
    const counterRef = db.ref('counters/dogs');
    const counterSnapshot = await counterRef.once('value');
    let nextId = 1;

    if (counterSnapshot.exists()) {
      nextId = counterSnapshot.val() + 1;
    }

    await counterRef.set(nextId);
    return nextId;
  }

  async createDog(dogId, dogData) {
    const dogRef = db.ref('dogs/' + dogId);
    await dogRef.set(dogData);
    return dogData;
  }

  async getDogById(dogId) {
    const dogRef = db.ref('dogs/' + dogId);
    const snapshot = await dogRef.once('value');
    return snapshot.val();
  }

  async getDogsByOwnerId(ownerId) {
    const dogsRef = db.ref('dogs');
    const snapshot = await dogsRef
      .orderByChild('ownerId')
      .equalTo(ownerId)
      .once('value');
    return snapshot.val() || {};
  }

  async updateDog(dogId, dogData) {
    const dogRef = db.ref('dogs/' + dogId);
    await dogRef.update(dogData);
    return dogData;
  }

  async deleteDog(dogId) {
    const dogRef = db.ref('dogs/' + dogId);
    await dogRef.remove();
  }
}

module.exports = new DogDao();

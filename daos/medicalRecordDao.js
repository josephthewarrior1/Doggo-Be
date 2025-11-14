const { db } = require('../config/firebase');

class MedicalRecordDao {
  async getNextMedicalRecordId() {
    const counterRef = db.ref('counters/medical_records');
    const counterSnapshot = await counterRef.once('value');
    let nextId = 1;

    if (counterSnapshot.exists()) {
      nextId = counterSnapshot.val() + 1;
    }

    await counterRef.set(nextId);
    return nextId;
  }

  async createMedicalRecord(medicalId, medicalData) {
    const medicalRef = db.ref('medical_records/' + medicalId);
    await medicalRef.set(medicalData);
    return medicalData;
  }

  async getMedicalRecordById(medicalId) {
    const medicalRef = db.ref('medical_records/' + medicalId);
    const snapshot = await medicalRef.once('value');
    return snapshot.val();
  }

  async getMedicalRecordsByDogId(dogId) {
    const medicalRef = db.ref('medical_records');
    const snapshot = await medicalRef
      .orderByChild('dogId')
      .equalTo(dogId)
      .once('value');
    return snapshot.val() || {};
  }

  async getMedicalRecordsByOwnerId(ownerId) {
    const medicalRef = db.ref('medical_records');
    const snapshot = await medicalRef
      .orderByChild('ownerId')
      .equalTo(ownerId)
      .once('value');
    return snapshot.val() || {};
  }

  async updateMedicalRecord(medicalId, medicalData) {
    const medicalRef = db.ref('medical_records/' + medicalId);
    await medicalRef.update(medicalData);
    return medicalData;
  }

  async deleteMedicalRecord(medicalId) {
    const medicalRef = db.ref('medical_records/' + medicalId);
    await medicalRef.remove();
  }

  // Get upcoming medical records (for reminders)
  async getUpcomingMedicalRecords(ownerId) {
    const medicalRef = db.ref('medical_records');
    const snapshot = await medicalRef
      .orderByChild('ownerId')
      .equalTo(ownerId)
      .once('value');
    const allRecords = snapshot.val() || {};

    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);

    const upcomingRecords = {};
    Object.keys(allRecords).forEach((key) => {
      const record = allRecords[key];
      if (record.nextDueDate) {
        const dueDate = new Date(record.nextDueDate);
        if (dueDate >= today && dueDate <= thirtyDaysFromNow) {
          upcomingRecords[key] = record;
        }
      }
    });

    return upcomingRecords;
  }

  // Get overdue medical records
  async getOverdueMedicalRecords(ownerId) {
    const medicalRef = db.ref('medical_records');
    const snapshot = await medicalRef
      .orderByChild('ownerId')
      .equalTo(ownerId)
      .once('value');
    const allRecords = snapshot.val() || {};

    const today = new Date();

    const overdueRecords = {};
    Object.keys(allRecords).forEach((key) => {
      const record = allRecords[key];
      if (record.nextDueDate && record.status !== 'completed') {
        const dueDate = new Date(record.nextDueDate);
        if (dueDate < today) {
          overdueRecords[key] = record;
        }
      }
    });

    return overdueRecords;
  }
}

module.exports = new MedicalRecordDao();

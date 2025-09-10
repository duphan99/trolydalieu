import type { PatientRecord, ScarPatientRecord, AcnePatientRecord, RejuvenationPatientRecord } from '../types';

const DB_NAME = 'DermatologyAI_DB';
const DB_VERSION = 4;
const STORE_NAME = 'patientRecords';
const SCAR_STORE_NAME = 'scarRecords';
const ACNE_STORE_NAME = 'acneRecords';
const REJUVENATION_STORE_NAME = 'rejuvenationRecords';

let db: IDBDatabase | null = null;

const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (db) {
      return resolve(db);
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error("Database error:", request.error);
      reject("Error opening database");
    };

    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const dbInstance = (event.target as IDBOpenDBRequest).result;
      if (!dbInstance.objectStoreNames.contains(STORE_NAME)) {
        const objectStore = dbInstance.createObjectStore(STORE_NAME, { keyPath: 'id' });
        objectStore.createIndex('createdAt', 'createdAt', { unique: false });
      }
      if (!dbInstance.objectStoreNames.contains(SCAR_STORE_NAME)) {
        const scarObjectStore = dbInstance.createObjectStore(SCAR_STORE_NAME, { keyPath: 'id' });
        scarObjectStore.createIndex('createdAt', 'createdAt', { unique: false });
      }
      if (!dbInstance.objectStoreNames.contains(ACNE_STORE_NAME)) {
        const acneObjectStore = dbInstance.createObjectStore(ACNE_STORE_NAME, { keyPath: 'id' });
        acneObjectStore.createIndex('createdAt', 'createdAt', { unique: false });
      }
      if (!dbInstance.objectStoreNames.contains(REJUVENATION_STORE_NAME)) {
        const rejuvenationObjectStore = dbInstance.createObjectStore(REJUVENATION_STORE_NAME, { keyPath: 'id' });
        rejuvenationObjectStore.createIndex('createdAt', 'createdAt', { unique: false });
      }
    };
  });
};

export const addPatientRecord = async (record: Omit<PatientRecord, 'id' | 'createdAt'>): Promise<PatientRecord> => {
  const dbInstance = await initDB();
  const transaction = dbInstance.transaction(STORE_NAME, 'readwrite');
  const store = transaction.objectStore(STORE_NAME);

  const newRecord: PatientRecord = {
    ...record,
    id: `REC-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    createdAt: new Date().toISOString(),
  };

  return new Promise((resolve, reject) => {
    const request = store.add(newRecord);
    request.onsuccess = () => {
      resolve(newRecord);
    };
    request.onerror = () => {
      console.error("Error adding record:", request.error);
      reject("Could not add record to the database.");
    };
  });
};

export const getPatientHistory = async (): Promise<PatientRecord[]> => {
  const dbInstance = await initDB();
  const transaction = dbInstance.transaction(STORE_NAME, 'readonly');
  const store = transaction.objectStore(STORE_NAME);

  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => {
      const sortedRecords = request.result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      resolve(sortedRecords);
    };
    request.onerror = () => {
      console.error("Error fetching records:", request.error);
      reject("Could not fetch records from the database.");
    };
  });
};

export const addScarRecord = async (record: Omit<ScarPatientRecord, 'id' | 'createdAt'>): Promise<ScarPatientRecord> => {
  const dbInstance = await initDB();
  const transaction = dbInstance.transaction(SCAR_STORE_NAME, 'readwrite');
  const store = transaction.objectStore(SCAR_STORE_NAME);

  const newRecord: ScarPatientRecord = {
    ...record,
    id: `SCAR-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    createdAt: new Date().toISOString(),
  };

  return new Promise((resolve, reject) => {
    const request = store.add(newRecord);
    request.onsuccess = () => {
      resolve(newRecord);
    };
    request.onerror = () => {
      console.error("Error adding scar record:", request.error);
      reject("Could not add scar record to the database.");
    };
  });
};

export const addAcneRecord = async (record: Omit<AcnePatientRecord, 'id' | 'createdAt'>): Promise<AcnePatientRecord> => {
  const dbInstance = await initDB();
  const transaction = dbInstance.transaction(ACNE_STORE_NAME, 'readwrite');
  const store = transaction.objectStore(ACNE_STORE_NAME);

  const newRecord: AcnePatientRecord = {
    ...record,
    id: `ACNE-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    createdAt: new Date().toISOString(),
  };

  return new Promise((resolve, reject) => {
    const request = store.add(newRecord);
    request.onsuccess = () => {
      resolve(newRecord);
    };
    request.onerror = () => {
      console.error("Error adding acne record:", request.error);
      reject("Could not add acne record to the database.");
    };
  });
};

export const addRejuvenationRecord = async (record: Omit<RejuvenationPatientRecord, 'id' | 'createdAt'>): Promise<RejuvenationPatientRecord> => {
  const dbInstance = await initDB();
  const transaction = dbInstance.transaction(REJUVENATION_STORE_NAME, 'readwrite');
  const store = transaction.objectStore(REJUVENATION_STORE_NAME);

  const newRecord: RejuvenationPatientRecord = {
    ...record,
    id: `REJUV-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    createdAt: new Date().toISOString(),
  };

  return new Promise((resolve, reject) => {
    const request = store.add(newRecord);
    request.onsuccess = () => {
      resolve(newRecord);
    };
    request.onerror = () => {
      console.error("Error adding rejuvenation record:", request.error);
      reject("Could not add rejuvenation record to the database.");
    };
  });
};

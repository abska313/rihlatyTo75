/**
 * ABSKA 214 - إدارة قاعدة البيانات المحلية IndexedDB
 * توفر عمليات دائمة، محمية من التلف، وتدعم النسخ الاحتياطي والاستعادة بالكامل.
 */

const DB_NAME = 'ABSKA_214_LOCAL_DB';
const DB_VERSION = 1;

let dbInstance = null;

const ABSKA_DB = {
  // فتح قاعدة البيانات وتهيئة الجداول
  async init() {
    if (dbInstance) return dbInstance;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // 1. الإعدادات والملف الشخصي
        if (!db.objectStoreNames.contains('profile')) {
          db.createObjectStore('profile', { keyPath: 'key' });
        }
        // 2. المهام اليومية
        if (!db.objectStoreNames.contains('tasks')) {
          const taskStore = db.createObjectStore('tasks', { keyPath: 'id' });
          taskStore.createIndex('date', 'date', { unique: false });
          taskStore.createIndex('domain', 'domain', { unique: false });
        }
        // 3. دفتر اكتشاف الذات والمذكرات
        if (!db.objectStoreNames.contains('journal')) {
          const jStore = db.createObjectStore('journal', { keyPath: 'id' });
          jStore.createIndex('date', 'date', { unique: false });
        }
        // 4. مكتبة القراءة
        if (!db.objectStoreNames.contains('books')) {
          db.createObjectStore('books', { keyPath: 'id' });
        }
        // 5. مشاريع المهارات
        if (!db.objectStoreNames.contains('skills')) {
          db.createObjectStore('skills', { keyPath: 'id' });
        }
        // 6. سجل الجسم والنشاط
        if (!db.objectStoreNames.contains('body_logs')) {
          const bStore = db.createObjectStore('body_logs', { keyPath: 'id' });
          bStore.createIndex('date', 'date', { unique: false });
        }
        // 7. الصور المرحلية (مخزنة محلياً)
        if (!db.objectStoreNames.contains('phase_photos')) {
          db.createObjectStore('phase_photos', { keyPath: 'id' });
        }
        // 8. سجلات الطاقة والتعافي
        if (!db.objectStoreNames.contains('system_logs')) {
          db.createObjectStore('system_logs', { keyPath: 'id' });
        }
      };

      request.onsuccess = (event) => {
        dbInstance = event.target.result;
        resolve(dbInstance);
      };

      request.onerror = (event) => {
        console.error('IndexedDB error:', event.target.error);
        reject(event.target.error);
      };
    });
  },

  // حفظ أو تحديث عنصر
  async set(storeName, data) {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.put(data);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  },

  // جلب عنصر بالمفتاح
  async get(storeName, key) {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  },

  // جلب كافة عناصر جدول
  async getAll(storeName) {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  },

  // حذف عنصر بالمفتاح
  async delete(storeName, key) {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.delete(key);
      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  },

  // تصدير كامل قاعدة البيانات كـ JSON
  async exportAll() {
    const stores = ['profile', 'tasks', 'journal', 'books', 'skills', 'body_logs', 'system_logs', 'phase_photos'];
    const exportData = {
      app: 'ABSKA_214',
      version: 1,
      exportedAt: new Date().toISOString(),
      data: {}
    };

    for (const store of stores) {
      exportData.data[store] = await this.getAll(store);
    }
    return exportData;
  },

  // استيراد نسخة احتياطية مع التحقق الصارم من الهيكل
  async importAll(importedObject) {
    if (!importedObject || importedObject.app !== 'ABSKA_214' || !importedObject.data) {
      throw new Error('الملف غير صالح أو لا يتطابق مع هيكل بيانات ABSKA.');
    }

    const db = await this.init();
    const stores = Object.keys(importedObject.data);

    for (const storeName of stores) {
      if (db.objectStoreNames.contains(storeName)) {
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        store.clear();
        for (const item of importedObject.data[storeName]) {
          store.put(item);
        }
      }
    }
    return true;
  },

  // إعادة ضبط كاملة لقاعدة البيانات
  async resetAll() {
    const db = await this.init();
    const stores = Array.from(db.objectStoreNames);
    for (const store of stores) {
      const tx = db.transaction(store, 'readwrite');
      tx.objectStore(store).clear();
    }
    return true;
  }
};

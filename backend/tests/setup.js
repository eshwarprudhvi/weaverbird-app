const mockFirestoreInstance = {
  collection: jest.fn().mockReturnThis(),
  doc: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  settings: jest.fn(),
  get: jest.fn().mockResolvedValue({
    empty: true,
    docs: [],
    exists: false
  }),
  add: jest.fn().mockResolvedValue({ id: 'mock-doc-id' }),
  set: jest.fn().mockResolvedValue(),
  update: jest.fn().mockResolvedValue(),
  delete: jest.fn().mockResolvedValue()
};

// Mock Firebase Admin SDK for all tests
jest.mock('firebase-admin', () => {
  return {
    initializeApp: jest.fn(),
    credential: {
      cert: jest.fn(),
    },
    auth: jest.fn(() => ({
      verifyIdToken: jest.fn(async (token) => {
        if (token === 'valid-token') return { uid: 'test-user', email: 'test@example.com' };
        throw new Error('Invalid token');
      }),
    })),
    firestore: jest.fn(() => mockFirestoreInstance),
  };
});

jest.mock('firebase-admin/auth', () => ({
  getAuth: jest.fn(() => ({
    verifyIdToken: jest.fn(async (token) => {
      if (token === 'valid-token') return { uid: 'test-user', email: 'test@example.com' };
      throw new Error('Invalid token');
    }),
  })),
}));

jest.mock('firebase-admin/firestore', () => ({
  getFirestore: jest.fn(() => mockFirestoreInstance),
}));

jest.mock('puppeteer', () => ({
  launch: jest.fn().mockResolvedValue({
    newPage: jest.fn().mockResolvedValue({
      setContent: jest.fn(),
      pdf: jest.fn().mockResolvedValue(Buffer.from('pdf')),
      close: jest.fn(),
    }),
    close: jest.fn(),
  }),
}));

jest.mock('jose', () => ({
  compactDecrypt: jest.fn(),
}));

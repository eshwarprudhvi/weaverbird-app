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
    firestore: jest.fn(() => ({
      collection: jest.fn(),
      doc: jest.fn(),
    })),
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
  getFirestore: jest.fn(() => ({
    collection: jest.fn(),
    doc: jest.fn(),
  })),
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

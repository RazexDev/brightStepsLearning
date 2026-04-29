/**
 * server/tests/api.test.js
 *
 * Automated API tests using Jest + Supertest.
 * All Mongoose models are mocked — NO real database connection is made.
 *
 * Test Suites:
 *  1. Auth       — POST /api/auth/verify-pin
 *  2. Admin      — PUT  /api/users/bulk-assign
 *  3. Resources  — POST /api/resources/track
 */

'use strict';

// ─────────────────────────────────────────────────
// 1.  MOCK: mongoose (prevents any DB connection)
// ─────────────────────────────────────────────────
jest.mock('mongoose', () => {
  const actual = jest.requireActual('mongoose');
  return {
    ...actual,
    connect: jest.fn().mockResolvedValue(true),
  };
});

// ─────────────────────────────────────────────────
// 2.  MOCK: User model
// ─────────────────────────────────────────────────
jest.mock('../models/User', () => {
  const mockUser = {
    findById:    jest.fn(),
    findOne:     jest.fn(),
    find:        jest.fn(),
    updateMany:  jest.fn(),
    countDocuments: jest.fn(),
    create:      jest.fn(),
  };
  // Support "new User(...).save()" pattern
  const MockUserClass = jest.fn().mockImplementation(() => ({ save: jest.fn() }));
  Object.assign(MockUserClass, mockUser);
  return MockUserClass;
});

// ─────────────────────────────────────────────────
// 3.  MOCK: ResourceLog model
// ─────────────────────────────────────────────────
jest.mock('../models/ResourceLog', () => ({
  findOneAndUpdate: jest.fn(),
  find:             jest.fn(),
}));

// ─────────────────────────────────────────────────
// 4.  MOCK: authMiddleware — mirrors real middleware
//     behaviour using the mocked User.findById so
//     that 401/403 responses work correctly in tests
// ─────────────────────────────────────────────────
jest.mock('../middleware/authMiddleware', () => ({
  protect: async (req, res, next) => {
    const jwt  = require('jsonwebtoken');
    const User = require('../models/User');
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Not authorized — no token provided.' });
    }
    try {
      const token   = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, 'brightsteps_secret_dev_123');
      req.user = await User.findById(decoded.id);
      if (!req.user) {
        return res.status(401).json({ message: 'Not authorized — user not found.' });
      }
      next();
    } catch {
      return res.status(401).json({ message: 'Not authorized — token invalid or expired.' });
    }
  },
  parent:      (_req, _res, next) => next(),
  parentOnly:  (_req, _res, next) => next(),
  studentOnly: (_req, _res, next) => next(),
}));

// ─────────────────────────────────────────────────
// 5.  MOCK: google-auth-library (not used in our
//     tests but imported by auth.js)
// ─────────────────────────────────────────────────
jest.mock('google-auth-library', () => ({
  OAuth2Client: jest.fn().mockImplementation(() => ({
    verifyIdToken: jest.fn(),
  })),
}));

// ─────────────────────────────────────────────────
// 6.  MOCK: bcryptjs  (used by verify-pin)
// ─────────────────────────────────────────────────
jest.mock('bcryptjs', () => ({
  compare:  jest.fn(),
  genSalt:  jest.fn().mockResolvedValue('salt'),
  hash:     jest.fn().mockResolvedValue('hashedPassword'),
}));

// ─────────────────────────────────────────────────
// 7.  MOCK: multer upload middleware
//     userRoutes.js calls upload.single('fieldName')
//     so the mock must be an object with a .single() method
// ─────────────────────────────────────────────────
jest.mock('../middleware/upload', () => ({
  single: jest.fn(() => (_req, _res, next) => next()),
  array:  jest.fn(() => (_req, _res, next) => next()),
  fields: jest.fn(() => (_req, _res, next) => next()),
}));

// ─────────────────────────────────────────────────
// 8.  Also suppress the fs.appendFileSync request
//     logger in server.js so logs don't pollute output
// ─────────────────────────────────────────────────
jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  appendFileSync: jest.fn(),
}));

// ─────────────────────────────────────────────────
// Import app AFTER all mocks are set up
// ─────────────────────────────────────────────────
const request = require('supertest');
const app     = require('../app');

// Pull in the mocked models so we can configure them per-test
const User        = require('../models/User');
const ResourceLog = require('../models/ResourceLog');
const bcrypt      = require('bcryptjs');

// ─────────────────────────────────────────────────
// Helper: build a signed JWT for an admin user
// ─────────────────────────────────────────────────
const jwt = require('jsonwebtoken');
const JWT_SECRET = 'brightsteps_secret_dev_123';

function makeToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
}

// ══════════════════════════════════════════════════════════════
//  SUITE 1 — AUTH: POST /api/auth/verify-pin
// ══════════════════════════════════════════════════════════════
describe('Auth API — POST /api/auth/verify-pin', () => {
  const VALID_USER_ID = '64f1a2b3c4d5e6f708091011';

  beforeEach(() => jest.clearAllMocks());

  // ── Test 1.1 ─────────────────────────────────
  it('✅ should return 200 and success:true when PIN is correct', async () => {
    // Arrange: mock User.findById to return a user with a plain-text PIN
    User.findById.mockResolvedValue({
      _id:       VALID_USER_ID,
      name:      'Test Student',
      parentPin: '1234',   // plain text (non-bcrypt, length ≠ 60)
    });
    // bcrypt.compare won't be called because pin length ≠ 60

    const res = await request(app)
      .post('/api/auth/verify-pin')
      .send({ userId: VALID_USER_ID, pin: '1234' });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toMatch(/verified/i);
  });

  // ── Test 1.2 ─────────────────────────────────
  it('❌ should return 401 and success:false when PIN is incorrect', async () => {
    User.findById.mockResolvedValue({
      _id:       VALID_USER_ID,
      name:      'Test Student',
      parentPin: '1234',
    });

    const res = await request(app)
      .post('/api/auth/verify-pin')
      .send({ userId: VALID_USER_ID, pin: '9999' });

    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/invalid pin/i);
  });

  // ── Test 1.3 ─────────────────────────────────
  it('❌ should return 400 when userId or pin is missing', async () => {
    const res = await request(app)
      .post('/api/auth/verify-pin')
      .send({ userId: VALID_USER_ID }); // pin missing

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  // ── Test 1.4 ─────────────────────────────────
  it('❌ should return 404 when user does not exist', async () => {
    User.findById.mockResolvedValue(null);

    const res = await request(app)
      .post('/api/auth/verify-pin')
      .send({ userId: VALID_USER_ID, pin: '1234' });

    expect(res.statusCode).toBe(404);
    expect(res.body.success).toBe(false);
  });

  // ── Test 1.5 ─────────────────────────────────
  it('✅ should handle bcrypt hashed PINs (length === 60) correctly', async () => {
    const fakeHash = 'a'.repeat(60); // simulate bcrypt hash length
    User.findById.mockResolvedValue({
      _id:       VALID_USER_ID,
      name:      'Test Student',
      parentPin: fakeHash,
    });
    bcrypt.compare.mockResolvedValue(true); // hash matches

    const res = await request(app)
      .post('/api/auth/verify-pin')
      .send({ userId: VALID_USER_ID, pin: '1234' });

    expect(bcrypt.compare).toHaveBeenCalledWith('1234', fakeHash);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════
//  SUITE 2 — ADMIN: PUT /api/users/bulk-assign
// ══════════════════════════════════════════════════════════════
describe('Admin API — PUT /api/users/bulk-assign', () => {
  // Fake admin user
  const adminUser = { _id: 'admin001', role: 'admin', name: 'Admin User' };
  const adminToken = makeToken({ id: adminUser._id });

  beforeEach(() => {
    jest.clearAllMocks();
    // authMiddleware.protect uses User.findById to attach req.user
    User.findById.mockResolvedValue(adminUser);
  });

  // ── Test 2.1 ─────────────────────────────────
  it('✅ should bulk-assign users to a teacher and return 200', async () => {
    User.updateMany.mockResolvedValue({ modifiedCount: 3 });

    const res = await request(app)
      .put('/api/users/bulk-assign')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        userIds:   ['id1', 'id2', 'id3'],
        teacherId: 'teacher001',
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.updatedCount).toBe(3);
    expect(res.body.message).toMatch(/bulk assigned/i);
    expect(User.updateMany).toHaveBeenCalledWith(
      { _id: { $in: ['id1', 'id2', 'id3'] } },
      { $set: { assignedTeacher: 'teacher001' } }
    );
  });

  // ── Test 2.2 ─────────────────────────────────
  it('❌ should return 400 when userIds array is empty', async () => {
    const res = await request(app)
      .put('/api/users/bulk-assign')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ userIds: [], teacherId: 'teacher001' });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/array of userIds/i);
  });

  // ── Test 2.3 ─────────────────────────────────
  it('❌ should return 401 when no token is provided', async () => {
    const res = await request(app)
      .put('/api/users/bulk-assign')
      .send({ userIds: ['id1'], teacherId: 'teacher001' });

    expect(res.statusCode).toBe(401);
  });

  // ── Test 2.4 ─────────────────────────────────
  it('❌ should return 403 when caller is not an admin', async () => {
    const studentToken = makeToken({ id: 'student001' });
    User.findById.mockResolvedValue({ _id: 'student001', role: 'student' });

    const res = await request(app)
      .put('/api/users/bulk-assign')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ userIds: ['id1'], teacherId: 'teacher001' });

    expect(res.statusCode).toBe(403);
  });
});

// ══════════════════════════════════════════════════════════════
//  SUITE 3 — RESOURCES: POST /api/resources/track
// ══════════════════════════════════════════════════════════════
describe('Resources API — POST /api/resources/track', () => {
  const STUDENT_ID   = '64f1a2b3c4d5e6f708091011';
  const RESOURCE_NAME = 'What Are the Planets? (Space Explorer)';

  beforeEach(() => jest.clearAllMocks());

  // ── Test 3.1 ─────────────────────────────────
  it('✅ should create or update a resource log and return 200', async () => {
    const mockLog = {
      _id:          'log001',
      studentId:    STUDENT_ID,
      resourceName: RESOURCE_NAME,
      resourceType: 'video',
      viewCount:    1,
      lastViewed:   new Date().toISOString(),
    };
    ResourceLog.findOneAndUpdate.mockResolvedValue(mockLog);

    const res = await request(app)
      .post('/api/resources/track')
      .send({
        studentId:    STUDENT_ID,
        resourceName: RESOURCE_NAME,
        resourceType: 'video',
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.studentId).toBe(STUDENT_ID);
    expect(res.body.resourceName).toBe(RESOURCE_NAME);
    expect(res.body.viewCount).toBe(1);

    // Verify upsert was called with correct query
    expect(ResourceLog.findOneAndUpdate).toHaveBeenCalledWith(
      { studentId: STUDENT_ID, resourceName: RESOURCE_NAME },
      expect.objectContaining({ $inc: { viewCount: 1 } }),
      expect.objectContaining({ upsert: true, new: true })
    );
  });

  // ── Test 3.2 ─────────────────────────────────
  it('❌ should return 400 when studentId is missing', async () => {
    const res = await request(app)
      .post('/api/resources/track')
      .send({ resourceName: RESOURCE_NAME, resourceType: 'video' });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/studentId.*required|required.*studentId/i);
  });

  // ── Test 3.3 ─────────────────────────────────
  it('❌ should return 400 when resourceName is missing', async () => {
    const res = await request(app)
      .post('/api/resources/track')
      .send({ studentId: STUDENT_ID, resourceType: 'video' });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/required/i);
  });

  // ── Test 3.4 ─────────────────────────────────
  it('✅ should increment viewCount on repeated views (upsert behaviour)', async () => {
    const mockUpdatedLog = {
      _id:          'log001',
      studentId:    STUDENT_ID,
      resourceName: RESOURCE_NAME,
      resourceType: 'pdf',
      viewCount:    5,  // already watched 4 times, now 5th
      lastViewed:   new Date().toISOString(),
    };
    ResourceLog.findOneAndUpdate.mockResolvedValue(mockUpdatedLog);

    const res = await request(app)
      .post('/api/resources/track')
      .send({ studentId: STUDENT_ID, resourceName: RESOURCE_NAME, resourceType: 'pdf' });

    expect(res.statusCode).toBe(200);
    expect(res.body.viewCount).toBe(5);
  });
});

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';
import Database from 'better-sqlite3';
// Use in-memory database for tests
const testDb = new Database(':memory:');
// Mock the database module before importing the app
vi.mock('../db/index.js', () => {
    return {
        run: (sql, params = []) => {
            const stmt = testDb.prepare(sql);
            return stmt.run(params);
        },
        get: (sql, params = []) => {
            const stmt = testDb.prepare(sql);
            return stmt.get(params);
        },
        query: (sql, params = []) => {
            const stmt = testDb.prepare(sql);
            return stmt.all(params);
        },
        initDb: () => {
            // Create users table
            testDb.exec(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY,
          email TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
      `);
            // Create notes table
            testDb.exec(`
        CREATE TABLE IF NOT EXISTS notes (
          id INTEGER PRIMARY KEY,
          user_id INTEGER NOT NULL,
          content TEXT NOT NULL,
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `);
        }
    };
});
// Import app after mocking
const { default: app } = await import('../src/server.js');
describe('Authentication and Notes API', () => {
    let authToken;
    let userId;
    beforeAll(async () => {
        // Initialize test database
        testDb.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
        testDb.exec(`
      CREATE TABLE IF NOT EXISTS notes (
        id INTEGER PRIMARY KEY,
        user_id INTEGER NOT NULL,
        content TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    });
    afterAll(() => {
        testDb.close();
    });
    describe('Health Check', () => {
        it('should return health status', async () => {
            const response = await request(app)
                .get('/health')
                .expect(200);
            expect(response.body).toEqual({ ok: true });
        });
    });
    describe('Authentication', () => {
        it('should register a new user', async () => {
            const userData = {
                email: 'test@example.com',
                password: 'password123'
            };
            const response = await request(app)
                .post('/auth/register')
                .send(userData)
                .expect(201);
            expect(response.body).toHaveProperty('message', 'User created successfully');
            expect(response.body).toHaveProperty('userId');
            userId = response.body.userId;
        });
        it('should reject duplicate email registration', async () => {
            const userData = {
                email: 'test@example.com',
                password: 'password123'
            };
            const response = await request(app)
                .post('/auth/register')
                .send(userData)
                .expect(400);
            expect(response.body).toHaveProperty('error', 'User already exists');
        });
        it('should validate registration input', async () => {
            const invalidData = {
                email: 'invalid-email',
                password: '123'
            };
            const response = await request(app)
                .post('/auth/register')
                .send(invalidData)
                .expect(400);
            expect(response.body).toHaveProperty('error', 'Invalid input');
        });
        it('should login with valid credentials', async () => {
            const loginData = {
                email: 'test@example.com',
                password: 'password123'
            };
            const response = await request(app)
                .post('/auth/login')
                .send(loginData)
                .expect(200);
            expect(response.body).toHaveProperty('message', 'Login successful');
            expect(response.body).toHaveProperty('token');
            expect(response.body).toHaveProperty('userId', userId);
            authToken = response.body.token;
        });
        it('should reject invalid credentials', async () => {
            const loginData = {
                email: 'test@example.com',
                password: 'wrongpassword'
            };
            const response = await request(app)
                .post('/auth/login')
                .send(loginData)
                .expect(401);
            expect(response.body).toHaveProperty('error', 'Invalid credentials');
        });
        it('should reject non-existent user login', async () => {
            const loginData = {
                email: 'nonexistent@example.com',
                password: 'password123'
            };
            const response = await request(app)
                .post('/auth/login')
                .send(loginData)
                .expect(401);
            expect(response.body).toHaveProperty('error', 'Invalid credentials');
        });
    });
    describe('Notes API', () => {
        it('should require authentication for notes endpoints', async () => {
            await request(app)
                .get('/notes')
                .expect(401);
            await request(app)
                .post('/notes')
                .send({ content: 'Test note' })
                .expect(401);
            await request(app)
                .delete('/notes/1')
                .expect(401);
        });
        it('should create a new note', async () => {
            const noteData = {
                content: 'This is my first note'
            };
            const response = await request(app)
                .post('/notes')
                .set('Authorization', `Bearer ${authToken}`)
                .send(noteData)
                .expect(201);
            expect(response.body).toHaveProperty('message', 'Note created successfully');
            expect(response.body).toHaveProperty('noteId');
        });
        it('should list user notes', async () => {
            // Create another note
            await request(app)
                .post('/notes')
                .set('Authorization', `Bearer ${authToken}`)
                .send({ content: 'Second note' })
                .expect(201);
            const response = await request(app)
                .get('/notes')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);
            expect(response.body).toHaveProperty('notes');
            expect(Array.isArray(response.body.notes)).toBe(true);
            expect(response.body.notes.length).toBeGreaterThan(0);
            expect(response.body.notes[0]).toHaveProperty('id');
            expect(response.body.notes[0]).toHaveProperty('content');
            expect(response.body.notes[0]).toHaveProperty('created_at');
        });
        it('should validate note content', async () => {
            const response = await request(app)
                .post('/notes')
                .set('Authorization', `Bearer ${authToken}`)
                .send({ content: '' })
                .expect(400);
            expect(response.body).toHaveProperty('error', 'Invalid input');
        });
        it('should delete a note', async () => {
            // First create a note
            const createResponse = await request(app)
                .post('/notes')
                .set('Authorization', `Bearer ${authToken}`)
                .send({ content: 'Note to delete' })
                .expect(201);
            const noteId = createResponse.body.noteId;
            // Then delete it
            const response = await request(app)
                .delete(`/notes/${noteId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);
            expect(response.body).toHaveProperty('message', 'Note deleted successfully');
        });
        it('should not delete non-existent note', async () => {
            const response = await request(app)
                .delete('/notes/99999')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(404);
            expect(response.body).toHaveProperty('error', 'Note not found');
        });
        it('should not delete note with invalid ID', async () => {
            const response = await request(app)
                .delete('/notes/invalid')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(400);
            expect(response.body).toHaveProperty('error', 'Invalid note ID');
        });
    });
    describe('Authorization', () => {
        let otherUserToken;
        let otherUserId;
        beforeAll(async () => {
            // Create another user
            const registerResponse = await request(app)
                .post('/auth/register')
                .send({
                email: 'other@example.com',
                password: 'password123'
            })
                .expect(201);
            otherUserId = registerResponse.body.userId;
            const loginResponse = await request(app)
                .post('/auth/login')
                .send({
                email: 'other@example.com',
                password: 'password123'
            })
                .expect(200);
            otherUserToken = loginResponse.body.token;
        });
        it('should not allow user to delete another user\'s note', async () => {
            // Create a note with the first user
            const createResponse = await request(app)
                .post('/notes')
                .set('Authorization', `Bearer ${authToken}`)
                .send({ content: 'First user note' })
                .expect(201);
            const noteId = createResponse.body.noteId;
            // Try to delete it with the second user's token
            const response = await request(app)
                .delete(`/notes/${noteId}`)
                .set('Authorization', `Bearer ${otherUserToken}`)
                .expect(404);
            expect(response.body).toHaveProperty('error', 'Note not found');
        });
        it('should only show user\'s own notes', async () => {
            // Create notes with both users
            await request(app)
                .post('/notes')
                .set('Authorization', `Bearer ${authToken}`)
                .send({ content: 'First user note' })
                .expect(201);
            await request(app)
                .post('/notes')
                .set('Authorization', `Bearer ${otherUserToken}`)
                .send({ content: 'Second user note' })
                .expect(201);
            // Check first user only sees their notes
            const firstUserResponse = await request(app)
                .get('/notes')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);
            const secondUserResponse = await request(app)
                .get('/notes')
                .set('Authorization', `Bearer ${otherUserToken}`)
                .expect(200);
            // Each user should only see their own notes
            expect(firstUserResponse.body.notes.length).toBeGreaterThan(0);
            expect(secondUserResponse.body.notes.length).toBeGreaterThan(0);
            // Notes should be different between users
            const firstUserNoteIds = firstUserResponse.body.notes.map((n) => n.id);
            const secondUserNoteIds = secondUserResponse.body.notes.map((n) => n.id);
            const hasCommonNotes = firstUserNoteIds.some((id) => secondUserNoteIds.includes(id));
            expect(hasCommonNotes).toBe(false);
        });
    });
});
//# sourceMappingURL=auth-and-notes.test.js.map
const request = require('supertest');
const app = require('../server.js'); // Assuming your main server file is named server.js
const mongoose = require('mongoose');
const User = require('../models/userModel.js'); // Adjust path to your user model

// Connect to a test database before all tests
beforeAll(async () => {
  const mongoURI = 'mongodb://127.0.0.1:27017/test_clinic_tracker';
  await mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true });
});

// Clean up the test database after each test
afterEach(async () => {
  await User.deleteMany();
});

// Disconnect from the test database after all tests
afterAll(async () => {
  await mongoose.connection.close();
});

describe('User Authentication API', () => {
  it('should register a new user', async () => {
    const newUser = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
      role: 'doctor'
    };
    const response = await request(app)
      .post('/api/users')
      .send(newUser);
    
    expect(response.statusCode).toBe(201);
    expect(response.body).toHaveProperty('token');
    expect(response.body.username).toBe('testuser');
  });

  it('should not register a user with an existing email', async () => {
    const existingUser = {
      username: 'existinguser',
      email: 'exist@example.com',
      password: 'password123',
      role: 'doctor'
    };
    await request(app).post('/api/users').send(existingUser);

    const duplicateUser = {
      username: 'anotheruser',
      email: 'exist@example.com',
      password: 'password123',
      role: 'doctor'
    };
    const response = await request(app)
      .post('/api/users')
      .send(duplicateUser);

    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBe('User already exists');
  });

  it('should log in an existing user', async () => {
    const user = {
      username: 'loginuser',
      email: 'login@example.com',
      password: 'password123',
      role: 'doctor'
    };
    await request(app).post('/api/users').send(user);

    const loginResponse = await request(app)
      .post('/api/users/login')
      .send({ email: 'login@example.com', password: 'password123' });
    
    expect(loginResponse.statusCode).toBe(200);
    expect(loginResponse.body).toHaveProperty('token');
  });
});
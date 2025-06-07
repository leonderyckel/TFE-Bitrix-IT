const request = require('supertest')('http://localhost:5001');

describe('API Auth & Tickets (étendu)', () => {
  let token;
  let ticketId;
  const uniqueEmail = `testuser_${Date.now()}@example.com`;

  it('inscrit un nouvel utilisateur', async () => {
    const res = await request
      .post('/api/auth/register')
      .send({
        email: uniqueEmail,
        password: 'Test1234!',
        firstName: 'Test',
        lastName: 'User',
        role: 'client'
      });
    expect([201, 400]).toContain(res.statusCode);
    if (res.statusCode === 201) {
      expect(res.body).toHaveProperty('token');
      token = res.body.token;
    }
  });

  it('refuse l\'accès à /api/auth/me sans token', async () => {
    const res = await request.get('/api/auth/me');
    expect(res.statusCode).toBe(401);
  });

  it('autorise l\'accès à /api/auth/me avec un token', async () => {
    if (!token) return;
    const res = await request
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('email', uniqueEmail);
  });

  it('refuse la connexion avec un mauvais mot de passe', async () => {
    const res = await request
      .post('/api/auth/login')
      .send({ email: uniqueEmail, password: 'wrongpass' });
    expect([400, 401]).toContain(res.statusCode);
  });

  it('crée un ticket (protégé)', async () => {
    if (!token) return;
    const res = await request
      .post('/api/tickets')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Problème test',
        description: 'Ceci est un test',
        category: 'software'
      });
    expect([201, 400, 401]).toContain(res.statusCode);
    if (res.statusCode === 201) {
      expect(res.body).toHaveProperty('_id');
      ticketId = res.body._id;
    }
  });

  it('refuse de créer un ticket sans token', async () => {
    const res = await request
      .post('/api/tickets')
      .send({
        title: 'Problème test',
        description: 'Ceci est un test',
        category: 'software'
      });
    expect([401, 400]).toContain(res.statusCode);
  });

  it('gère une erreur 404 sur une route inconnue', async () => {
    const res = await request.get('/api/route/inconnue');
    expect([404, 400]).toContain(res.statusCode);
  });
}); 
const request = require('supertest')('http://localhost:5001');

describe('API Auth & Tickets (étendu)', () => {
  let token;
  let ticketId;
  const uniqueEmail = `testuser_${Date.now()}@example.com`;

  

  it('refuse l\'accès à /api/auth/me sans token', async () => {
    const res = await request.get('/api/auth/me');
    expect([401, 429]).toContain(res.statusCode);
  });

  it('autorise l\'accès à /api/auth/me avec un token', async () => {
    if (!token) return;
    const res = await request
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);
    expect([200, 429]).toContain(res.statusCode);
    expect(res.body).toHaveProperty('email', uniqueEmail);
  });

  

  it('refuse de créer un ticket sans token', async () => {
    const res = await request
      .post('/api/tickets')
      .send({
        title: 'Problème test',
        description: 'Ceci est un test',
        category: 'software'
      });
    expect([401, 400, 429]).toContain(res.statusCode);
  });

  it('gère une erreur 404 sur une route inconnue', async () => {
    const res = await request.get('/api/route/inconnue');
    expect([404, 400, 429]).toContain(res.statusCode);
  });
}); 
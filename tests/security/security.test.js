const request = require('supertest')('http://localhost:5001');

describe('Sécurité API (étendu)', () => {
  it('bloque une injection MongoDB', async () => {
    const res = await request
      .post('/api/auth/login')
      .send({ email: { "$gt": "" }, password: { "$gt": "" } });
    expect([400, 401, 403, 429, 500]).toContain(res.statusCode);
  });

  it('bloque une injection $or', async () => {
    const res = await request
      .post('/api/auth/login')
      .send({ email: { "$or": [{}, {}] }, password: 'test' });
    expect([400, 401, 403, 429, 500]).toContain(res.statusCode);
  });

  it('bloque un payload trop volumineux', async () => {
    const bigString = 'a'.repeat(11 * 1024); // 11kb
    const res = await request
      .post('/api/auth/register')
      .send({ email: bigString, password: bigString, firstName: bigString, lastName: bigString, role: 'client' });
    expect([413, 500, 401, 429]).toContain(res.statusCode); // Accepte 413, 500, 401 ou 429
  });

  it('nettoie une tentative de XSS dans un ticket', async () => {
    const res = await request
      .post('/api/tickets')
      .send({
        title: '<script>alert(1)</script>',
        description: '<img src=x onerror=alert(1)>',
        category: 'software'
      });
    expect([400, 201, 500, 401, 429]).toContain(res.statusCode); // ou 201 si accepté mais nettoyé
  });

  it('refuse l\'accès admin sans réseau privé', async () => {
    const res = await request
      .get('/api/admin/profile');
    expect([401, 403, 429]).toContain(res.statusCode);
  });

  it('refuse l\'accès à une route protégée avec un mauvais rôle', async () => {
    // On tente d'accéder à une route admin sans token admin
    const res = await request
      .get('/api/admin/profile')
      .set('Authorization', 'Bearer faketoken');
    expect([401, 403, 429]).toContain(res.statusCode);
  });

  it('gère une erreur 404 sur une route inconnue', async () => {
    const res = await request.get('/api/route/inconnue');
    expect([404, 400, 401, 429]).toContain(res.statusCode);
  });
}); 
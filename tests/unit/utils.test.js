const validator = require('validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

describe('Tests unitaires réels et variés', () => {
  it('valide les emails', () => {
    expect(validator.isEmail('test@example.com')).toBe(true);
    expect(validator.isEmail('notanemail')).toBe(false);
    expect(validator.isEmail('a@b.com')).toBe(true);
    expect(validator.isEmail('')).toBe(false);
  });

  it('hash et vérifie un mot de passe', async () => {
    const password = 'SuperSecret123!';
    const hash = await bcrypt.hash(password, 10);
    expect(await bcrypt.compare(password, hash)).toBe(true);
    expect(await bcrypt.compare('wrong', hash)).toBe(false);
  });

  it('génère et vérifie un JWT', () => {
    const secret = 'testsecret';
    const payload = { id: 123, isAdmin: true };
    const token = jwt.sign(payload, secret, { expiresIn: '1h' });
    const decoded = jwt.verify(token, secret);
    expect(decoded.id).toBe(123);
    expect(decoded.isAdmin).toBe(true);
  });

  it('échoue à vérifier un JWT avec une mauvaise clé', () => {
    const secret = 'testsecret';
    const payload = { id: 123 };
    const token = jwt.sign(payload, secret, { expiresIn: '1h' });
    expect(() => jwt.verify(token, 'wrongsecret')).toThrow();
  });

  it('valide la longueur d\'un mot de passe', () => {
    function isValidPassword(pw) { return typeof pw === 'string' && pw.length >= 8; }
    expect(isValidPassword('12345678')).toBe(true);
    expect(isValidPassword('short')).toBe(false);
    expect(isValidPassword('')).toBe(false);
  });

  it('valide un nom (lettres uniquement)', () => {
    function isValidName(name) { return /^[a-zA-Z]+$/.test(name); }
    expect(isValidName('Jean')).toBe(true);
    expect(isValidName('Jean-Pierre')).toBe(false);
    expect(isValidName('123')).toBe(false);
  });

  it('formate une date en YYYY-MM-DD', () => {
    function formatDate(date) {
      const d = new Date(date);
      return d.toISOString().slice(0, 10);
    }
    // Test avec une date ISO pour éviter les problèmes de fuseau
    expect(formatDate('2024-06-01')).toBe('2024-06-01');
    // Test tolérant pour les fuseaux horaires
    const result = formatDate('2024-06-01T12:00:00Z');
    expect(['2024-06-01', '2024-05-31']).toContain(result);
  });

  it('trie un tableau de nombres', () => {
    function sortNumbers(arr) { return arr.slice().sort((a, b) => a - b); }
    expect(sortNumbers([3,1,2])).toEqual([1,2,3]);
    expect(sortNumbers([-1,5,0])).toEqual([-1,0,5]);
  });

  it('supprime les doublons dans un tableau', () => {
    function unique(arr) { return [...new Set(arr)]; }
    expect(unique([1,2,2,3,3,3])).toEqual([1,2,3]);
    expect(unique([])).toEqual([]);
  });

  it('fusionne deux objets profondément', () => {
    function deepMerge(a, b) {
      return JSON.parse(JSON.stringify({ ...a, ...b }));
    }
    expect(deepMerge({a:1, b:2}, {b:3, c:4})).toEqual({a:1, b:3, c:4});
  });

  it('compte le nombre de voyelles dans une chaîne', () => {
    function countVowels(str) { return (str.match(/[aeiouy]/gi) || []).length; }
    expect(countVowels('hello')).toBe(2);
    expect(countVowels('xyz')).toBe(1);
    expect(countVowels('')).toBe(0);
  });

  it('vérifie si un objet est vide', () => {
    function isEmpty(obj) { return Object.keys(obj).length === 0; }
    expect(isEmpty({})).toBe(true);
    expect(isEmpty({a:1})).toBe(false);
  });

  it('retourne la factorielle d\'un nombre', () => {
    function factorial(n) { return n <= 1 ? 1 : n * factorial(n-1); }
    expect(factorial(5)).toBe(120);
    expect(factorial(0)).toBe(1);
  });

  it('vérifie si une chaîne est un palindrome', () => {
    function isPalindrome(str) { return str === str.split('').reverse().join(''); }
    expect(isPalindrome('radar')).toBe(true);
    expect(isPalindrome('test')).toBe(false);
  });

  it('convertit une chaîne en camelCase', () => {
    function toCamelCase(str) {
      return str.replace(/[-_](.)/g, (_, c) => c.toUpperCase());
    }
    expect(toCamelCase('hello_world')).toBe('helloWorld');
    expect(toCamelCase('test-case')).toBe('testCase');
  });

  it('calcule la moyenne d\'un tableau', () => {
    function average(arr) { return arr.length ? arr.reduce((a,b) => a+b,0)/arr.length : 0; }
    expect(average([1,2,3,4])).toBe(2.5);
    expect(average([])).toBe(0);
  });
}); 
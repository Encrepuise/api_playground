const chai = require('chai');
const chaiHttp = require('chai-http');

chai.use(chaiHttp);
const expect = chai.expect;


describe('Login rate limiter', () => {
    it('should limit the number of login attempts per IP address', async () => {
      // Make 5 consecutive POST requests to /login endpoint with incorrect credentials
      for (let i = 0; i < 5; i++) {
        const res = await chai.request('http://localhost:3000')
          .post('/login')
          .send({ email: 'test@example.com', password: 'wrongpassword' });
        expect(res).to.have.status(401);
        expect(res.text).to.equal('Invalid email or password');
      }
  
      // 6th request should be rate-limited
      const res = await chai.request('http://localhost:3000')
        .post('/login')
        .send({ email: 'test@example.com', password: 'wrongpassword' });
      expect(res).to.have.status(429);
      expect(res.text).to.equal('Too many login attempts from this IP, please try again later.');
    });
  });
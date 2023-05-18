const chai = require('chai');
const chaiHttp = require('chai-http');

chai.use(chaiHttp);
const expect = chai.expect;

describe('/getcompanies', () => {
  let token;

  before((done) => {
    const email = 'alperkopuz@outlook.com';
    const password = '123456Alper';

    // Log in the user to obtain the token
    chai.request('http://localhost:3000')
      .post('/login')
      .send({ email, password })
      .end((err, res) => {
        if (err) throw err;

        expect(res).to.have.status(200);
        expect(res.text).to.equal('Login successful!');

        // Get the JWT token from the cookie
        const cookie = res.headers['set-cookie'][0];
        token = cookie.split(';')[0].split('=')[1];

        done();
      });
  });

  it('should return the list of companies for the authenticated user', (done) => {
    chai.request('http://localhost:3000')
      .get('/getcompanies')
      .set('Cookie', `token=${token}`)
      .end((err, res) => {
        if (err) throw err;

        expect(res).to.have.status(200);

        done();
      });
  });

  it('should return "No token found" if no token is provided', (done) => {
    chai.request('http://localhost:3000')
      .get('/getcompanies')
      .end((err, res) => {
        if (err) throw err;

        expect(res).to.have.status(401);
        expect(res.body).to.deep.equal({ message: 'No token found' });

        done();
      });
  });

  it('should return "Invalid token" if an invalid token is provided', (done) => {
    const invalidToken = 'invalid-token';

    chai.request('http://localhost:3000')
      .get('/getcompanies')
      .set('Cookie', `token=${invalidToken}`)
      .end((err, res) => {
        if (err) throw err;

        expect(res).to.have.status(401);
        expect(res.body).to.deep.equal({ message: 'Invalid token' });

        done();
      });
  });

});

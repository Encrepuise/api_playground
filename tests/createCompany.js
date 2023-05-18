const chai = require('chai');
const chaiHttp = require('chai-http');

chai.use(chaiHttp);
const expect = chai.expect;

describe('Login', () => {
  let token;
  let token2;

  it('should log in user1 and return a token', (done) => {
    const email = 'alperkopuz@outlook.com';
    const password = '123456Alper';

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

  it('should log in user2 and return a token', (done) => {
    const email = 'Coby.Kohler7@gmail.com';
    const password = 'JfLtjCJAR3V93DK';

    chai.request('http://localhost:3000')
      .post('/login')
      .send({ email, password })
      .end((err, res) => {
        if (err) throw err;

        expect(res).to.have.status(200);
        expect(res.text).to.equal('Login successful!');

        // Get the JWT token from the cookie
        const cookie = res.headers['set-cookie'][0];
        token2 = cookie.split(';')[0].split('=')[1];

        done();
      });
  });

  describe('Create Company', () => {
    it('should create a new company and return its ID', (done) => {
      const name = 'Test Company';
      const description = 'A test company description';

      chai.request('http://localhost:3000')
        .post('/createcompany')
        .set('Cookie', `token=${token}`)
        .send({ name, description })
        .end((err, res) => {
          if (err) throw err;

          expect(res).to.have.status(200);
          expect(res.body).to.have.property('message').equal('Company created successfully');
          expect(res.body).to.have.property('companyId').to.be.a('number');

          done();
        });
    });

    it('should return "No info found" if name or description is missing', (done) => {
      const name = ''; // Missing name
      const description = 'A test company description';

      chai.request('http://localhost:3000')
        .post('/createcompany')
        .set('Cookie', `token=${token}`)
        .send({ name, description })
        .end((err, res) => {
          if (err) throw err;

          expect(res).to.have.status(401);
          expect(res.text).to.equal('No info found');

          done();
        });
    });

    it('should return "No token found" if no token is provided', (done) => {
      const name = 'Test Company';
      const description = 'A test company description';

      chai.request('http://localhost:3000')
        .post('/createcompany')
        .send({ name, description })
        .end((err, res) => {
          if (err) throw err;

          expect(res).to.have.status(401);
          expect(res.text).to.equal('No token found');

          done();
        });
    });

    it('should return 403 Forbidden when user2 does not have permission', (done) => {
      chai.request('http://localhost:3000')
        .post('/createcompany')
        .set('Content-Type', 'application/json')
        .set('Cookie', `token=${token2}`)
        .send({
          name: 'Company Name',
          description: 'Company Description'
        })
        .end((err, res) => {
          expect(res).to.have.status(403);
          expect(res.body).to.deep.equal({ message: 'User does not have permission to create a company' });
          done();
        });
    });
  });
});

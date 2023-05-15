const chai = require('chai');
const chaiHttp = require('chai-http');

const { expect } = chai;

chai.use(chaiHttp);

describe('POST /register', () => {

  it('should not register if the email or username already in use', (done) => {
    chai.request('http://localhost:3000')
      .post('/register')
      .send({
        name: 'John Doe',
        email: 'johndoe@example.com',
        password: 'mypassword'
      })
      .end((err, res) => {
        expect(res).to.have.status(400);
        expect(res.text).to.equal('User already exists!');
        done();
      });
  });

/*   it('should register', (done) => {
    chai.request('http://localhost:3000')
      .post('/register')
      .send({
        name: 'John Doeee',
        email: 'johndoeee@example.com',
        password: 'mypassword'
      })
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.text).to.equal('New user registered!');
        done();
      });
  }); */

  it('should log in a user with valid credentials', done => {
    chai.request('http://localhost:3000')
      .post('/login')
      .send({
        email: 'johndoe@example.com',
        password: 'mypassword'
      })
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.text).to.equal('Login successful!');
        done();
      });
  });

  it('should not log in a user with invalid credentials', done => {
    chai.request('http://localhost:3000')
      .post('/login')
      .send({
        email: 'johndoe@example.com',
        password: 'wrongpassword'
      })
      .end((err, res) => {
        expect(res).to.have.status(401);
        expect(res.text).to.equal('Invalid email or password');
        done();
      });
  });

});
const chai = require('chai');
const chaiHttp = require('chai-http');
const faker = require('faker');

const { expect } = chai;

chai.use(chaiHttp);

describe('Register', function () {
  this.timeout(20000);

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

   it('should register', (done) => {
    const name = faker.name.findName();
    const email = faker.internet.email();
    const password = faker.internet.password();
    chai.request('http://localhost:3000')
      .post('/register')
      .send({
        name,
        email,
        password,
      })
      .end((err, res) => {
        console.log(`${name}, ${email}, ${password}`);
        expect(res).to.have.status(200);
        expect(res.body).to.have.property('message').that.equals('New user registered!');
        expect(res.body).to.have.property('verificationToken').that.is.a('string');
        done();
      });
  }); 
});

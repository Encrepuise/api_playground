const chai = require('chai');
const chaiHttp = require('chai-http');
const { promisify } = require('util');
const faker = require('faker');

chai.use(chaiHttp);
const { expect } = chai;

describe('Verified Registration', () => {
  it('should register a new user and send a verification email', async () => {
    const name = faker.name.findName();
    const email = faker.internet.email();
    const password = faker.internet.password();

    const res = await chai.request('http://localhost:3000')
      .post('/register')
      .send({ name, email, password });

    console.log(`${name}, ${email}, ${password}`);  
    expect(res).to.have.status(200);
    expect(res.body).to.have.property('message').that.equals('New user registered!');
    expect(res.body).to.have.property('verificationToken').that.is.a('string');

    const verificationLink = `http://localhost:3000/verify/${res.body.verificationToken}`;
    const verifyRes = await chai.request('http://localhost:3000')
        .get(`/verify/${res.body.verificationToken}`);

    expect(verifyRes).to.have.status(200);
    expect(verifyRes.text).to.equal('Your email address has been verified. You can now log in to your account.');
  });
});
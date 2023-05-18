const chai = require('chai');
const chaiHttp = require('chai-http');
const jwt = require('jsonwebtoken');
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


describe('Login', function () {  
  it('should log in a user with valid credentials', done => {
    chai.request('http://localhost:3000')
      .post('/login')
      .send({
        email: 'alperkopuz@outlook.com',
        password: '123456Alper'
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

describe('Protected Route', () => {
    it('should return 200 if a valid token is provided', done => {
      chai.request('http://localhost:3000')
        .post('/login')
        .send({
          email: 'alperkopuz@outlook.com',
          password: '123456Alper'
        })
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.text).to.equal('Login successful!');
  
          // Get the JWT token from the cookie
          const cookie = res.headers['set-cookie'][0];
          const token = cookie.split(';')[0].split('=')[1];
  
          // Test the protected route with the token
          chai.request('http://localhost:3000')
            .get('/protected')
            .set('Cookie', `token=${token}`)
            .end((err, res) => {
              expect(res).to.have.status(200);
              expect(res.text).to.equal('Welcome, Alper Kopuz!');
              done();
            });
        });
    });
  
  
    it('should return 401 if no token is provided', done => {
      chai.request('http://localhost:3000')
        .get('/protected')
        .end((err, res) => {
          chai.expect(res).to.have.status(401);
          chai.expect(res.text).to.equal('No token found');
          done();
        });
    });
  
    it('should return 401 if an invalid token is provided', done => {
      const invalidToken = jwt.sign({ email: 'test@example.com' }, 'invalid_secret');
      chai.request('http://localhost:3000')
        .get('/protected')
        .set('Cookie', `token=${invalidToken}`)
        .end((err, res) => {
          chai.expect(res).to.have.status(401);
          chai.expect(res.text).to.equal('Invalid token');
          done();
        });
    });
  });

describe('Update Profile', () => {
    it('should update user profile', done => {
        chai.request('http://localhost:3000')
        .post('/login')
        .send({
          email: 'alperkopuz@outlook.com',
          password: '123456Alper'
        })
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.text).to.equal('Login successful!');
  
          // Get the JWT token from the cookie
          const cookie = res.headers['set-cookie'][0];
          const token = cookie.split(';')[0].split('=')[1];
  
          chai.request('http://localhost:3000')
            .post('/updateprofile')
            .set('Cookie', `token=${token}`)
            .field('birth_date', '1990-01-01')
            .field('gender', 'Male')
            .field('mobile_number', '1234567890')
            .attach('profile_picture', 'profile.jpg')
            .end((err, res) => {
              expect(res).to.have.status(200);
              expect(res.text).to.equal('User profile updated!');
              done();
            });
        });
    });


  it('should return 401 if no token is provided', done => {
    chai.request('http://localhost:3000')
      .post('/updateprofile')
      .end((err, res) => {
        expect(res).to.have.status(401);
        expect(res.text).to.equal('No token found');
        done();
      });
  });
});

/* describe('Login rate limiter', () => {
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
}); */
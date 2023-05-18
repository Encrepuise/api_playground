const chai = require('chai');
const chaiHttp = require('chai-http');

chai.use(chaiHttp);
const expect = chai.expect;

describe('Off-time Request API', () => {
  let token; // Token obtained by logging in

  before((done) => {
    // Log in and obtain the token
    chai
      .request('http://localhost:3000')
      .post('/login') // Assuming you have a login endpoint
      .send({ email: 'alperkopuz@outlook.com', password: '123456Alper' })
      .end((err, res) => {
        token = res.headers['set-cookie'][0].split(';')[0].split('=')[1];
        done();
      });
  });

  describe('POST /request', () => {
    it('should create an off-time request', (done) => {
      const request = {
        start_date: '2023-06-20',
        end_date: '2023-06-25',
        reason: 'Taking a vacationn'
      };

      chai
        .request('http://localhost:3000')
        .post('/request')
        .set('Cookie', `token=${token}`)
        .send(request)
        .end((err, res) => {
          if (err) {
            console.error(err); // Log the error
            done(err); // Signal the test case as failed
          } else {
            expect(res).to.have.status(200);
            expect(res.body).to.have.property('message').to.equal('Off-time request created successfully');
            done();
          }
        });
    });

    it('should return 401 if no token found', (done) => {
      const request = {
        start_date: '2023-05-20',
        end_date: '2023-05-25',
        reason: 'Taking a vacation'
      };

      chai
        .request('http://localhost:3000')
        .post('/request')
        .send(request)
        .end((err, res) => {
          expect(res).to.have.status(401);
          expect(res.body).to.have.property('message').to.equal('No token found');
          done();
        });
    });

    it('should return 400 if missing required fields', (done) => {
      const request = {
        end_date: '2023-05-25',
        reason: 'Taking a vacation'
      };

      chai
        .request('http://localhost:3000')
        .post('/request')
        .set('Cookie', `token=${token}`)
        .send(request)
        .end((err, res) => {
          if (err) {
            console.error(err); // Log the error
            done(err); // Signal the test case as failed
          } else {
            expect(res).to.have.status(400);
            expect(res.body).to.have.property('message').to.equal('Missing required fields');
            done();
          }
        });
    });

    it('should return 409 if user already has a request within the provided dates', (done) => {
        const request = {
          start_date: '2023-05-20',
          end_date: '2023-05-25',
          reason: 'Taking a vacation'
        };
  
        chai
          .request('http://localhost:3000')
          .post('/request')
          .set('Cookie', `token=${token}`)
          .send(request)
          .end((err, res) => {
            expect(res).to.have.status(409);
            expect(res.body).to.have.property('message').to.equal('User already has a request within the provided dates');
            done();
          });
      });
    });
  });

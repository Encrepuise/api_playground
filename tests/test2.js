const chai = require('chai');
const chaiHttp = require('chai-http');
const jwt = require('jsonwebtoken');

const { expect } = chai;

chai.use(chaiHttp);


describe('Update Profile', () => {
    it('should update user profile', done => {
      chai.request('http://localhost:3000')
        .post('/login')
        .send({
          email: 'alperkopuz@outlook.com',
          password: '123456Alper'
        })
        .end((err, res) => {
          const token = res.body.token;
  
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
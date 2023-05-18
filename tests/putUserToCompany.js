const chai = require('chai');
const chaiHttp = require('chai-http');

chai.use(chaiHttp);
const expect = chai.expect;

describe('Login', () => {
    let token;
    let token2;
  
    it('should log in user1 and return a token', async () => {
      const email = 'alperkopuz@outlook.com';
      const password = '123456Alper';
  
      const res = await chai
        .request('http://localhost:3000')
        .post('/login')
        .send({ email, password });
  
      expect(res).to.have.status(200);
      expect(res.text).to.equal('Login successful!');
  
      // Get the JWT token from the cookie
      const cookie = res.headers['set-cookie'][0];
      token = cookie.split(';')[0].split('=')[1];
    });
  
    it('should log in user2 and return a token', async () => {
      const email = 'Coby.Kohler7@gmail.com';
      const password = 'JfLtjCJAR3V93DK';
  
      const res = await chai
        .request('http://localhost:3000')
        .post('/login')
        .send({ email, password });
  
      expect(res).to.have.status(200);
      expect(res.text).to.equal('Login successful!');
  
      // Get the JWT token from the cookie
      const cookie = res.headers['set-cookie'][0];
      token2 = cookie.split(';')[0].split('=')[1];
    });

describe('Put User To A Company', () => {
    it('should add a user to the company when the sender is an admin', (done) => {
      const company_id = 1;
      const useremail = 'Coby.Kohler7@gmail.com';

  
      chai.request('http://localhost:3000')
        .post('/putusertocompany')
        .set('Cookie', `token=${token}`)
        .send({ company_id, useremail })
        .end((err, res) => {
          if (err) throw err;
  
          expect(res).to.have.status(200);
          expect(res.body).to.have.property('message').equal('User added to company successfully');
  
          done();
        });
    });
  
    it('should return "No token found" if no token is provided', (done) => {
      const company_id = 1; 
      const useremail = 'Coby.Kohler7@gmail.com'; 
  
      chai.request('http://localhost:3000')
        .post('/putusertocompany')
        .send({ company_id, useremail })
        .end((err, res) => {
          if (err) throw err;
  
          expect(res).to.have.status(401);
          expect(res.text).to.equal('No token found');
  
          done();
        });
    });
  
    it('should return "User is not an admin of the company" when sender is not an admin', (done) => {
      const company_id = 1; 
      const useremail = 'user@example.com'; 
  
      chai.request('http://localhost:3000')
        .post('/putusertocompany')
        .set('Cookie', `token=${token2}`)
        .send({ company_id, useremail })
        .end((err, res) => {
          expect(res).to.have.status(403);
          expect(res.body).to.deep.equal({ message: 'User is not an admin of the company' });
  
          done();
        });
    });

    it('should return "User is already a member of the company" when user is already in the company', (done) => {
        const company_id = 1;
        const useremail = 'Coby.Kohler7@gmail.com';
    
        chai.request('http://localhost:3000')
          .post('/putusertocompany')
          .set('Cookie', `token=${token}`) // Replace with a valid token of an admin user
          .send({ company_id, useremail })
          .end((err, res) => {
            expect(res).to.have.status(400);
            expect(res.body).to.deep.equal({ message: 'User is already a member of the company' });
    
            done();
          });
      });

      it('should return "User not found" if user does not exist', (done) => {
        const company_id = 1;
        const useremail = 'nonexistent.user@example.com';
    
        chai.request('http://localhost:3000')
          .post('/putusertocompany')
          .set('Cookie', `token=${token}`)
          .send({ company_id, useremail })
          .end((err, res) => {
            if (err) throw err;
    
            expect(res).to.have.status(404);
            expect(res.body).to.deep.equal({ message: 'User not found' });
    
            done();
          });
      });
  });
});
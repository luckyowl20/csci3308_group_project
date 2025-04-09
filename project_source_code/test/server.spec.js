// ********************** Initialize server **********************************

const server = require('../src/index'); //TODO: Make sure the path to your index.js is correctly added

// ********************** Import Libraries ***********************************

const chai = require('chai'); // Chai HTTP provides an interface for live integration testing of the API's.
const chaiHttp = require('chai-http');
chai.should();
chai.use(chaiHttp);
const {assert, expect} = chai;

// ********************** DEFAULT WELCOME TESTCASE ****************************

describe('Server!', () => {
  // Sample test case given to test / endpoint.
  it('Returns the default welcome message', done => {
    chai
      .request(server)
      .get('/welcome')
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.body.status).to.equals('success');
        assert.strictEqual(res.body.message, 'Welcome!');
        done();
      });
  });
});

// *********************** TESING REGISTER API **************************
describe('Testing Add User API', () => {
  it('positive : /register', done => {
    chai
      .request(server)
      .post('/auth/register')
      .send({username: 'john', password: 'password'})
      .end((err, res) => {
        expect(res).to.have.status(200);
        // expect(res.session.message).to.equals('Registration successful! You can now log in.');
        done();
      });
  });
});

// *********************** TESTING LIVE CHAT API **************************

describe('POST chat/messages/send', () => {

  // Positive test case
  it('should send a message successfully when all fields are valid', done => {
    // First simulate a logged-in session using an agent (optional for future auth testing)
    const testMessage = {
      receiver_id: 2,
      message_text: 'Hello Bob!'
    };

    // Simulate logged-in user by mocking session via middleware or setting user manually in app.locals (your app already handles req.session.user)
    chai
      .request(server)
      .post('/messages/send')
      .set('Cookie', 'connect.sid=some-session-id') // You can also mock req.session manually
      .send(testMessage)
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.body).to.be.an('object');
        expect(res.body.success).to.be.true;
        expect(res.body.message).to.have.property('content').eql('Hello Bob!');
        expect(res.body.message).to.have.property('sender_id');
        expect(res.body.message).to.have.property('receiver_id').eql(2);
        done();
      });
  });

  // Negative test case: missing message_text
  it('should return 400 if message_text is missing', done => {
    const invalidMessage = {
      receiver_id: 2
    };

    chai
      .request(server)
      .post('/messages/send')
      .send(invalidMessage)
      .end((err, res) => {
        expect(res).to.have.status(400);
        expect(res.body).to.have.property('error');
        done();
      });
  });
});
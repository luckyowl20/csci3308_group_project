// ********************** Initialize server **********************************

const server = require('../src/index'); //TODO: Make sure the path to your index.js is correctly added
const db = require('../src/utils/database'); // include the database setup information here so we can access the db

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
  it('positive : /auth/register', done => {
    chai
      .request(server)
      .post('/auth/register') // requires full path to register route
      .send({username: 'testuser123', password: 'password'})
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.text).to.include('Registration successful! You can now log in.');
        res.should.be.html;
        done();
      });
  });
});

describe('Testing Add User API', () => {
  // Re register with same username, should fail
  it('negative : /auth/register', done => {
    chai
      .request(server)
      .post('/auth/register') // requires full path to register route
      .send({username: 'testuser123', password: 'password_2'})
      .end((err, res) => {
        expect(res).to.have.status(400);
        expect(res.text).to.include('Username already exists. Please choose another.');
        done();
      });
  });

  after(async () => {
    // Clean up: delete test users and their related data
    // friends relation is also removed due to the ON DELETE CASCASE line in the database create.sql file
    // this means that if the user is deleted, the rest of their info is also deleted.
    await db.none('DELETE FROM users WHERE username = $1', ['testuser123']);
  });
});


// *********************** TESTING LIVE CHAT API **************************
describe('Live Chat Endpoint', () => {
  let agent = chai.request.agent(server);
  let senderId, receiverId;

  // test setup
  before(async () => {
    // 1. Register testuser1
    await agent.post('/auth/register').send({
      username: 'testuser1',
      password: 'testpassword1',
    });

    // 2. Register testuser2
    await chai.request(server).post('/auth/register').send({
      username: 'testuser2',
      password: 'testpassword2',
    });

    // 3. Log in as testuser1
    await agent.post('/auth/login').send({
      username: 'testuser1',
      password: 'testpassword1',
    });

    // 4. Get their user IDs from the database
    const sender = await db.one('SELECT id FROM users WHERE username = $1', ['testuser1']);
    const receiver = await db.one('SELECT id FROM users WHERE username = $1', ['testuser2']);
    senderId = sender.id;
    receiverId = receiver.id;

    // 5. Make them friends (if not already)
    await db.none(
      'INSERT INTO friends (user_id, friend_id) VALUES ($1, $2), ($2, $1) ON CONFLICT DO NOTHING',
      [senderId, receiverId]
    );
  });

  after(async () => {
    // Clean up: delete test users and their related data
    // friends relation is also removed due to the ON DELETE CASCASE line in the database create.sql file
    // this means that if the user is deleted, the rest of their info is also deleted.
    await db.none('DELETE FROM users WHERE username IN ($1, $2)', ['testuser1', 'testuser2']);
    agent.close();
  });

  // positive test case
  it('should send a message successfully when all fields are valid', done => {
    const testMessage = {
      receiver_id: receiverId,
      message_text: 'Hello testuser2!'
    };
    
    // the main unit test section
    agent
      .post('/chat/messages/send')                                                      // use chai http agent to simulate post request to /chat/messages/send
      .send(testMessage)                                                                // attaches the request body to the request sent using post
      .end((err, res) => {                                                              // callback that runs once request complete, res is response object returned from api
        expect(res).to.have.status(200);                                                // assertion 1, checking that server responded with status 200
        expect(res.body).to.be.an('object');                                            // asserts that response body is a json object, not html or string object
        expect(res.body.success).to.be.true;                                            // server returns: { success: true, message: { ... } }, this verifies success = true
        expect(res.body.message).to.have.property('content').eql('Hello testuser2!');   // verifies that sent content matches content received
        expect(res.body.message).to.have.property('sender_id').eql(senderId);           // confirms the message is being stored and returned correctly with the sender's identity
        expect(res.body.message).to.have.property('receiver_id').eql(receiverId);       // confirms that your route correctly saved and returned the correct recipient
        done();                                                                         // tells mocha the async test is complete
      });
  });

  // negative test case
  it('should return 400 if receiver_id is missing', done => {
    const invalidPayload = {
      message_text: 'Hey friend!'
      // receiver_id is intentionally missing
    };

    agent
      .post('/chat/messages/send')                                                      // use chai http agent to simulate post request to /chat/messages/send
      .send(invalidPayload)                                                             // sends test payload with the invalid request body
      .end((err, res) => {                                                              // defines callback for the request
        expect(res).to.have.status(400);                                                // expect the request to fail since the receiver_id is missing
        expect(res.body).to.have.property('error');                                     // make sure that the response body has the error key since the request failed
        expect(res.body.error).to.include('receiver_id and message_text');              // assert that the err messog string includes some type of feedback
        done();                                                                         // finish the test
      });
  });
});
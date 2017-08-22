var Splitter = artifacts.require("./Splitter.sol");

var splitter;
var owner_account;
var sender_account;
var recipient_accounts;
var invalid_account;
var recipient_starting_balances = [];
var amount_to_send = 50;

function before(Splitter,accounts,done)
{

  owner_account = accounts[0];
  sender_account = accounts[4];
  recipient_accounts = [accounts[1],accounts[2]];
  invalid_account = accounts[3];

  Splitter.deployed().then(function (instance) { //deploy it
    splitter = instance;

    return Promise.all(recipient_accounts.map((account) => splitter.balances.call(account)))
    .then((_recipient_starting_balances) => {
      recipient_starting_balances = _recipient_starting_balances;
      splitter.split(recipient_accounts[0], recipient_accounts[1], { from: sender_account, value: amount_to_send })//register a split
      .then(() => done());
    });
  });
}

contract('Splitter', function(accounts) {

  beforeEach(function (done) {
    before(Splitter,accounts,done);
  });

  it("Should split wei correctly between recipients", done => {
       Promise.all(recipient_accounts.map((account) => splitter.balances.call(account)))
      .then((updated_balances) => {
        assert.equal(updated_balances[0].toString(10),recipient_starting_balances[0].add(amount_to_send/2).toString(10), "Did not split to first recipient");
        assert.equal(updated_balances[1].toString(10),recipient_starting_balances[1].add(amount_to_send/2).toString(10), "Did not split to second recipient");
        done();
      });
  });

});

contract('Splitter', function(accounts) {

  beforeEach(function (done) {
    before(Splitter,accounts,done);
  });

  it("Should allow recipients to withdraw funds", done => {
    var starting_balances;
    Promise.all(recipient_accounts.map((account) => splitter.balances.call(account)))
    .then((balances_to_withdraw) => {
      assert.equal(balances_to_withdraw[0].toString(10),(amount_to_send/2).toString(10), "Did not split to first recipient");
      assert.equal(balances_to_withdraw[1].toString(10),(amount_to_send/2).toString(10), "Did not split to second recipient");
      Promise.all(recipient_accounts.map((account) => splitter.withdraw({from: account})))
      .then(() => {
        Promise.all(recipient_accounts.map((account) => splitter.balances.call(account)))
        .then((ending_balances) => {
          assert.equal(ending_balances[0].toString(10),"0", "Did not withdraw to first recipient");
          assert.equal(ending_balances[1].toString(10),"0", "Did not withdraw to second recipient");
          done();
        })
      });
    });
  });

});

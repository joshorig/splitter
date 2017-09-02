require('babel-polyfill');
const BigNumber = require('bignumber.js');
const utils = require('./helpers/Utils');
const Splitter = artifacts.require("./Splitter.sol");

contract('Splitter', function(accounts) {

  const amountToSend = 50;
  const oddAmountToSend = 5;
  const ownerAccount = accounts[0];
  const senderAccount = accounts[0];
  const enderAccount = accounts[4];
  const invalidAccount = accounts[3];
  const recipientAccounts = [accounts[1],accounts[2]];
  let splitter;
  let recipientStartingBalances = [];
  let updatedBalances = [];


  beforeEach(async () => {
    splitter = await Splitter.deployed();
  });

  it("Should split wei correctly between recipients", async () => {

    recipientStartingBalances[0] = await splitter.balances.call(recipientAccounts[0]);
    recipientStartingBalances[1] = await splitter.balances.call(recipientAccounts[1]);
    let txObject = await splitter.split(recipientAccounts[0], recipientAccounts[1], { from: senderAccount, value: amountToSend });

    assert.equal(txObject.logs.length,1,"Did not log LogSplit event");
    let logEvent = txObject.logs[0];
    assert.equal(logEvent.event,"LogSplit","Did not LogSplit");
    assert.equal(logEvent.args.sender,accounts[0],"Did not log sender correctly");
    assert.equal(logEvent.args.firstRecipient,recipientAccounts[0],"Did not log firstRecipient correctly");
    assert.equal(logEvent.args.secondRecipient,recipientAccounts[1],"Did not log secondRecipient correctly");
    assert.equal(logEvent.args.amount.valueOf(),amountToSend/2,"Did not log amount correctly");


    updatedBalances[0] = await splitter.balances.call(recipientAccounts[0]);
    updatedBalances[1] = await splitter.balances.call(recipientAccounts[1]);

    assert.equal(updatedBalances[0].valueOf(),recipientStartingBalances[0].add(~~(amountToSend/2)).valueOf(), "Did not split to first recipient");
    assert.equal(updatedBalances[1].valueOf(),recipientStartingBalances[1].add(~~(amountToSend/2)).valueOf(), "Did not split to second recipient");

  });

  it("Should split odd wei remainder to sender", async () => {

    let senderStartBalance = await splitter.balances.call(senderAccount);
    let txObject = await splitter.split(recipientAccounts[0], recipientAccounts[1], { from: senderAccount, value: oddAmountToSend });

    assert.equal(txObject.logs.length,1,"Did not log LogSplit event");
    let logEvent = txObject.logs[0];
    assert.equal(logEvent.event,"LogSplit","Did not LogSplit");
    assert.equal(logEvent.args.sender,accounts[0],"Did not log sender correctly");
    assert.equal(logEvent.args.firstRecipient,recipientAccounts[0],"Did not log firstRecipient correctly");
    assert.equal(logEvent.args.secondRecipient,recipientAccounts[1],"Did not log secondRecipient correctly");
    assert.equal(logEvent.args.amount.valueOf(),~~(oddAmountToSend/2),"Did not log amount correctly");


    let senderUpdatedBalance = await splitter.balances.call(senderAccount);

    assert.equal(senderUpdatedBalance.valueOf(),senderStartBalance.add(1).valueOf(), "Did not split odd wei remainder to sender");

  });

  it("Should allow recipient to withdraw funds", async () => {

    recipientStartingBalances[0] = await splitter.balances.call(recipientAccounts[0]);
    recipientStartingBalances[1] = await splitter.balances.call(recipientAccounts[1]);
    let txObject = await splitter.withdraw({from: recipientAccounts[0]});

    assert.equal(txObject.logs.length,1,"Did not log LogWithdrawal event");
    let logEvent = txObject.logs[0];
    assert.equal(logEvent.event,"LogWithdrawal","Did not LogWithdrawal");
    assert.equal(logEvent.args.recipient,recipientAccounts[0],"Did not log recipient correctly");
    assert.equal(logEvent.args.amount.valueOf(),recipientStartingBalances[0].valueOf(),"Did not log amount correctly");

    updatedBalances[0] = await splitter.balances.call(recipientAccounts[0]);

    assert.equal(updatedBalances[0].valueOf(),0, "Did not split to first recipient");

  });

  it("Should not allow invalid recipient to withdraw funds", async () => {
    try {
     let txObject = await splitter.withdraw({from: invalidAccount});
     assert.equal(txObject.receipt.gasUsed, utils.exceptionGasToUse, "should have used all the gas");
    }
    catch (error){
      return utils.ensureException(error);
    }
  });

});

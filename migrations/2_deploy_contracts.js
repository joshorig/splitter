var Owned = artifacts.require("./Owned.sol");
var Terminable = artifacts.require("./Terminable.sol");
var Splitter = artifacts.require("./Splitter.sol");

module.exports = function(deployer) {
  deployer.deploy(Owned);
  deployer.link(Owned, Terminable);
  deployer.deploy(Terminable);
  deployer.link(Terminable, Splitter);
  deployer.deploy(Splitter);
};

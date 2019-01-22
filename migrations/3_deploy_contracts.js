var BatchTransfer = artifacts.require("./BatchTransfer.sol");

module.exports = function(deployer) {
  deployer.deploy(BatchTransfer);
};

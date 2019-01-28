const LongTermContract = artifacts.require("NewLRCLongTermHoldingContract");
const LrcToken = artifacts.require("NewLRCToken");

contract("NewLRCLongTermHoldingContract", async (accounts) => {
  let lrcToken;
  let longTermContract;
  const owner = accounts[0];

  before(async () => {
    lrcToken = await LrcToken.deployed();
    longTermContract = await LongTermContract.deployed();
  });

  const numberToBN = (num) => {
    const numHex = "0x" + num.toString(16);
    return web3.utils.toBN(numHex);
  };

  it("no one should be able to deposit lrc again", async () => {
    const user = accounts[1];
    await lrcToken.transfer(user, numberToBN(1e25), {from: owner});
    await lrcToken.approve(longTermContract.address, numberToBN(1e23), {from: user});
    try {
      const tx = await longTermContract.depositLRC({from: user});
    } catch (err) {
      // console.log("err:", err.message);
      assert(err.message.includes("beyond deposit time period"), "not failed as expected.");
    }
  });

});

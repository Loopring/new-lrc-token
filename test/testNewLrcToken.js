const LrcToken = artifacts.require("NewLRCToken");

contract("NewLRCToken", async (accounts) => {
  let lrcToken;

  before(async () => {
    lrcToken = await LrcToken.deployed();
  });

  it("should be able to get name, decimals and totalSupply", async () => {
    const name = await lrcToken.name();
    const symbol = await lrcToken.symbol();
    const decimals = await lrcToken.decimals();
    const totalSupply = await lrcToken.totalSupply();

    // console.log("web3 version:", web3.version);
    // console.log("totalSupply:", totalSupply);
    // console.log("bn:", web3.utils.toBN("1395076054523857892274603100"));

    assert.equal("LoopringCoin V2", name, "name not match");
    assert.equal("LRC", symbol, "symbol not match");
    assert.equal(18, decimals.toNumber(), "decimals not match");
    assert(web3.utils.toBN("1395076054523857892274603100").eq(totalSupply), "totalSupply not match");
  });

  it("an address should be able to query its balance", async () => {
    assert(false, "TODO");
  });

  it("an address should be able to transfer token to another address", async () => {
    assert(false, "TODO");
  });

  it("any address should be able to approve another address", async () => {
    assert(false, "TODO");
  });



});

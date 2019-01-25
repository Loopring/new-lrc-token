const _ = require("lodash");
const async = require("async");
const fs = require("fs");

const Web3 = require("web3");
const web3 = new Web3(new Web3.providers.HttpProvider("https://mainnet.infura.io/hM4sFGiBdqbnGTxk5YT2"));

const lrcAbi = '[{"constant":false,"inputs":[{"name":"_spender","type":"address"},{"name":"_value","type":"uint256"}],"name":"approve","outputs":[],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"totalSupply","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"","type":"uint256"}],"name":"bonusPercentages","outputs":[{"name":"","type":"uint8"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"_from","type":"address"},{"name":"_to","type":"address"},{"name":"_value","type":"uint256"}],"name":"transferFrom","outputs":[],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"DECIMALS","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"BLOCKS_PER_PHASE","outputs":[{"name":"","type":"uint16"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"MAX_UNSOLD_RATIO","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"HARD_CAP","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"BASE_RATE","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":false,"inputs":[],"name":"close","outputs":[],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"saleStarted","outputs":[{"name":"","type":"bool"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"issueIndex","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"_owner","type":"address"}],"name":"balanceOf","outputs":[{"name":"balance","type":"uint256"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"recipient","type":"address"}],"name":"issueToken","outputs":[],"payable":true,"type":"function"},{"constant":false,"inputs":[{"name":"_firstblock","type":"uint256"}],"name":"start","outputs":[],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"hardCapReached","outputs":[{"name":"","type":"bool"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"saleEnded","outputs":[{"name":"","type":"bool"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"unsoldTokenIssued","outputs":[{"name":"","type":"bool"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"price","outputs":[{"name":"tokens","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"GOAL","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"NAME","outputs":[{"name":"","type":"string"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"_to","type":"address"},{"name":"_value","type":"uint256"}],"name":"transfer","outputs":[],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"totalEthReceived","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"saleDue","outputs":[{"name":"","type":"bool"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"target","outputs":[{"name":"","type":"address"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"NUM_OF_PHASE","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"_owner","type":"address"},{"name":"_spender","type":"address"}],"name":"allowance","outputs":[{"name":"remaining","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"firstblock","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"SYMBOL","outputs":[{"name":"","type":"string"}],"payable":false,"type":"function"},{"inputs":[{"name":"_target","type":"address"}],"payable":false,"type":"constructor"},{"payable":true,"type":"fallback"},{"anonymous":false,"inputs":[],"name":"SaleStarted","type":"event"},{"anonymous":false,"inputs":[],"name":"SaleEnded","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"caller","type":"address"}],"name":"InvalidCaller","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"msg","type":"bytes"}],"name":"InvalidState","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"issueIndex","type":"uint256"},{"indexed":false,"name":"addr","type":"address"},{"indexed":false,"name":"ethAmount","type":"uint256"},{"indexed":false,"name":"tokenAmount","type":"uint256"}],"name":"Issue","type":"event"},{"anonymous":false,"inputs":[],"name":"SaleSucceeded","type":"event"},{"anonymous":false,"inputs":[],"name":"SaleFailed","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"owner","type":"address"},{"indexed":true,"name":"spender","type":"address"},{"indexed":false,"name":"value","type":"uint256"}],"name":"Approval","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"from","type":"address"},{"indexed":true,"name":"to","type":"address"},{"indexed":false,"name":"value","type":"uint256"}],"name":"Transfer","type":"event"}]'; // tslint:disable-line

const lrcAddr = "0xef68e7c694f40c8202821edf525de3782458639f";
const lrcToken = new web3.eth.Contract(JSON.parse(lrcAbi), lrcAddr);

let startBlock = 4104040;
let destBlock = 7000000;

async function classifyHolders(allHolders) {
  const plainHolders = [];
  const contractHolders = [];

  const isContract = async (addr) => {
    const code = await web3.eth.getCode(addr);
    if (code && code.length > 2) {
      return true;
    } else {
      return false;
    }
  };

  for (const [i, holder] of allHolders.entries()) {
    if (i % 1000 === 0) {
      console.log(i, "addresses had been classified.");
    }

    if (isContract(holder)) {
      contractHolders.push(holder);
    } else {
      plainHolders.push(holder);
    }
  }

  return { plainHolders, contractHolders };
}

async function parseAllHoldersFromEvents() {
  const allHolders = new Set();

  const getHoldersInBlocks = async (fromBlock, toBlock) => {
    console.log("get events between block:", fromBlock, toBlock);

    const holders = new Set();
    const events = await lrcToken.getPastEvents(
      "Transfer",
      {
        fromBlock: fromBlock,
        toBlock: toBlock
      }
    );

    console.log("events size:", events.length);

    events.forEach( e => {
      holders.add(e.returnValues.from);
      holders.add(e.returnValues.to);
    });

    return holders;
  };

  const step = 1000;
  for (let i = startBlock; i <= destBlock; i += step) {
    const holdersInBlocks = await getHoldersInBlocks(i, i + step);
    holdersInBlocks.forEach(h => allHolders.add(h));
  }

  return allHolders;
}

// parse lrc holders from transaction data.
async function parseAllHolders() {
  let allHolders = new Set();

  const parseTokenRecipient = (input) => {
    if (input && input.length >= 74) {
      return "0x" + input.slice(34, 34 + 40);
    } else {
      return "";
    }
  };

  const processBlock = async (blockNumber) => {
    console.log("process block:", blockNumber);

    const holders = new Set();
    const blockData = await web3.eth.getBlock(blockNumber, true);
    blockData.transactions.forEach(tx => {
      if (tx.to && tx.to.toLowerCase() === lrcAddr) {
        if (web3.utils.isAddress(tx.from)) {
          holders.add(tx.from);
        }
        const recipient = parseTokenRecipient(tx.input);
        if (web3.utils.isAddress(recipient)) {
          holders.add(recipient);
        }
      }
    });
    return holders;
  };

  const processBlocks = async (blockFrom, blockTo) => {
    let holders = new Set();
    for (let i = blockFrom; i <= blockTo; i ++) {
      const holdersOfBlock = await processBlock(i);
      holders = new Set([...holders, ...holdersOfBlock]);
    }
    return holders;
  };

  allHolders = await processBlocks(startBlock, destBlock);

  // const batchSize = 1000;
  // const tasks = [];
  // for (let i = startBlock; i <= endBlock; i += batchSize) {
  //   const batchStart = i;
  //   let batchEnd = batchStart + batchSize;
  //   if (batchEnd > endBlock) {
  //     batchEnd = endBlock;
  //   }

  //   console.log("batchStart:", batchStart, "; batchEnd:", batchEnd);

  //   tasks.push(await processBlocks(batchStart, batchEnd));
  // }

  // console.log("tasks: ", tasks);

  // async.parallel(tasks, function(err, results) {
  //   for (const res of results) {
  //     allHolders = new Set([...allHolders, ...res]);
  //   }
  // });

  return allHolders;
}

async function getBalanceOfHolders(allHolders) {
  const balanceInfos = [];
  // console.log("allHolders size:", allHolders.size);

  let i = 0;
  for (const addr of allHolders) {
    console.log("query balance of address:", addr);
    const balance = await lrcToken.methods.balanceOf(addr).call(destBlock);
    const balanceStr = balance.toString();
    balanceInfos.push([addr, balanceStr]);

    i ++;
    if (i % 10 === 0) {
      console.log(i, "addresses processed!");
    }
  }

  return balanceInfos;
}

function saveToFile(balanceInfos, fileName) {
  for (const balanceInfo of balanceInfos) {
    const account = balanceInfo[0];
    const balance = balanceInfo[1].toString();
    const line = account + "," + balance;
    fs.appendFileSync(fileName, line + "\n");
  }
}

async function main() {
  console.log("start block:", startBlock, "; destBlock:", destBlock);
  console.log("balance destBlock:", destBlock);

  const allHolders = await parseAllHoldersFromEvents();
  console.log("allHolders size:", allHolders.size);

  const classifiedHolders = classifyHolders(allHolders);
  console.log("contractHolders:", classifiedHolders.contractHolders);

  const plainHoldersAndBalances = await getBalanceOfHolders(classifiedHolders.plainHolders);
  const contractHoldersAndBalances = await getBalanceOfHolders(classifiedHolders.contractHolders);

  const fileNamePlain = "./balances_plain_" + destBlock + ".csv";
  const fileNameContract = "./balances_contract_" + destBlock + ".csv";

  saveToFile(plainHoldersAndBalances, fileNamePlain);
  saveToFile(contractHoldersAndBalances, fileNameContract);
}

main();

// async function test() {
//   const blockNumber = await web3.eth.getBlockNumber();
//   const blockData = await web3.eth.getBlock(blockNumber, true);

//   const tx = blockData.transactions[0];
//   console.log("tx:", tx);
// }

// async function test2() {
//   const txHash = "0xf0bdf9abd7ea1faae9a4aa3d01d63bb04c50e05c55d749f55d870472870d6e68";
//   const tx = await web3.eth.getTransaction(txHash);
//   console.log("tx", tx);

//   const input = tx.input;
//   const tokenRecipient = "0x" + tx.input.slice(34, 34 + 40);
//   console.log("tokenRecipient:", tokenRecipient);
// }

// test2();

// async function test3() {
//   const code = await web3.eth.getCode("0x6d4ee35D70AD6331000E370F079aD7df52E75005");
//   console.log("code:", code);
// }

// test3();

import fs from "fs";
import axios from "axios";
import { tokens } from "./result.js";

var finalTokens = [];

const fetchTokenBalance = async (token, lastBlockNum) => {
  try {
    return await axios.get(`https://deep-index.moralis.io/api/v2/${token.walletAddress}/erc20?chain=eth&to_block=${lastBlockNum}`,
      { headers: { 'X-API-Key': `iOWumgDJl0YeKNzZNBiW7wZQR3CXkK2aCeSu4iWtJdeAIb8piSXoYecaL67Cc21P`, "content-type": "application/json" } })
  } catch (error) {
    console.error(error)
  }
}

const countToken = async (token) => {
  const lastBlockNum = token.blockNums[token.blockNums.length-1];
  const nextBlockNum = Number(lastBlockNum)+1;
  let firstBLock = 0;
  let isFirstBlock = true;
  let subTokens = [];
  for (let blockNum = lastBlockNum; blockNum <= nextBlockNum; blockNum++) {
    const resultTokensRes = await fetchTokenBalance(token, blockNum);
    const resultTokens = resultTokensRes.data;

    const currentToken = resultTokens.filter(resultToken => {
      return resultToken.token_address == token.tokenAddress;
    });

    if (isFirstBlock) {
      isFirstBlock = false;
      firstBLock = currentToken;
    } else {
      if (firstBLock.balance < currentToken.balance) {
        const compound = {
          "tokenAddress": token.tokenAddress,
          "testResult": {
            "walletAddress": token.walletAddress,
            "blockNumOne": lastBlockNum,
            "balanceOne": firstBLock.balance,
            "blockNumTwo": nextBlockNum,
            "balanceTwo": currentToken.balance,
          }
        }
        subTokens.push(compound);
      }
    }
  }

  return subTokens;
}

const operate = async () => {
  for (const token of tokens) {
    const tokenMerge = await countToken(token);
    finalTokens = finalTokens.concat(tokenMerge);
  }
  return finalTokens;
}

operate().then(response => {
  const tokenData = JSON.stringify(response);
  var dir = './assets';

  if(!fs.existsSync(dir)){
    fs.mkdirSync(dir);
  }
  
  fs.writeFile("assets/final_tokens.json", tokenData, function (err) {
    if (err) {
      return console.log(err);
    }
    console.log("compouding coin list fetched");
  });
})
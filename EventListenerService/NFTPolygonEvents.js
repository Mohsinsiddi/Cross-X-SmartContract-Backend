import dotenv from "dotenv";
import NFTBridge from "../artifacts/contracts/BaseBridge/NFTCollectionBridgeWrapper.sol/NFTCollectionBridgeWrapper.json";
import {
  web3BSCProviderHTTP,
  web3EThProviderHTTP,
  web3PolygonProvider,
} from "./config/config";
import {
  NFT_BRDIGE_RINKBEY,
  NFT_BRDIGE_POLYGON,
  NFT_BRDIGE_BSC,
} from "./constants/constants";
dotenv.config();

// ADMIN CREDENTIALS
const adminPrivKey = process.env.PRIVATE_KEY;

// BINANCE PROVIDER && BSC_BRIDGE CONTRACT INIT
const web3BNB = web3BSCProviderHTTP();

const { address: adminBSC } = web3BNB.eth.accounts.wallet.add(adminPrivKey);

const BSCBridgeInstance = new web3BNB.eth.Contract(
  NFTBridge.abi,
  NFT_BRDIGE_BSC
);

//ETHEREUM PROVIDER && ETH_BRIDGE CONTRACT INIT FOR EVENTS

const web3Ethereum = web3EThProviderHTTP();

const { address: adminETH } =
  web3Ethereum.eth.accounts.wallet.add(adminPrivKey);

const ETHBridgeInstance = new web3Ethereum.eth.Contract(
  NFTBridge.abi,
  NFT_BRDIGE_RINKBEY
);

// POYLYGON PROVIDER && POLY_BRIDGE CONTRACT INIT
const web3POLY = web3PolygonProvider();

const POLYNFTBridgeInstance = new web3POLY.eth.Contract(
  NFTBridge.abi,
  NFT_BRDIGE_POLYGON
);

POLYNFTBridgeInstance.events
  .DEPOSIT({ fromBlock: "latest" })
  .on("data", async (event) => {
    try {
      console.log("Polygon Deposit event catched");
      console.log(event.returnValues);
      let {
        tamount,
        tokenID,
        sender,
        collectionAddress,
        uri,
        collectionName,
        destinationChainId,
      } = event.returnValues;
      tamount = tamount.replace(/\s+/g, "");
      sender = sender.replace(/\s+/g, "");
      collectionAddress = collectionAddress.replace(/\s+/g, "");
      if (destinationChainId == "97") {
        console.log(
          collectionName +
            " token transfer started from contract owner to user on Polygon to Binance."
        );
        let BNBTokenAddress = await BSCBridgeInstance.methods
          .whitelistedCollectionAddress(collectionName)
          .call();
        console.log(BNBTokenAddress);

        const tx = BSCBridgeInstance.methods.withdraw(
          tamount,
          tokenID,
          BNBTokenAddress,
          sender,
          uri
        );

        const [gasPrice, gasCost] = await Promise.all([
          web3BNB.eth.getGasPrice(),
          tx.estimateGas({ from: adminBSC }),
        ]);

        const data = tx.encodeABI();

        const txData = {
          from: adminBSC,
          to: BSCBridgeInstance.options.address,
          data,
          gas: gasCost,
          gasPrice,
        };

        const receipt = await web3BNB.eth.sendTransaction(txData);

        console.log(`Transaction hash: ${receipt.transactionHash}`);
        console.log(`
        Processed Cross chain NFT transfer:
        - from ${sender} 
        - to ${sender} 
        - tokenID ${tokenID} tokens
      `);
        console.log(
          collectionName +
            " token transfer done from contract owner to user on Polygon to Binance."
        );
      } else if (destinationChainId == "4") {
        console.log(
          collectionName +
            " token transfer started from contract owner to user on Polygon to Ethereum."
        );
        let ETHTokenAddress = await ETHBridgeInstance.methods
          .whitelistedCollectionAddress(collectionName)
          .call();
        console.log(ETHTokenAddress);

        const tx = ETHBridgeInstance.methods.withdraw(
          tamount,
          tokenID,
          ETHTokenAddress,
          sender,
          uri
        );

        const [gasPrice, gasCost] = await Promise.all([
          web3Ethereum.eth.getGasPrice(),
          tx.estimateGas({ from: adminETH }),
        ]);

        const data = tx.encodeABI();

        const txData = {
          from: adminETH,
          to: ETHBridgeInstance.options.address,
          data,
          gas: gasCost,
          gasPrice,
        };

        const receipt = await web3Ethereum.eth.sendTransaction(txData);

        console.log(`Transaction hash: ${receipt.transactionHash}`);
        console.log(`
            Processed Cross chain NFT transfer:
            - from ${sender} 
            - to ${sender} 
            - tokenID ${tokenID} tokens
          `);
        console.log(
          collectionName +
            " token transfer done from contract owner to user on Polygon to Ethereum."
        );
      } else throw new Error("Ether gas transfer confirmation failed");
    } catch (err) {
      let { tamount, sender, collectionAddress, collectionName } =
        event.returnValues;
      console.log(err.name);
      console.log(err.message);
      console.log(err);
    }
  });

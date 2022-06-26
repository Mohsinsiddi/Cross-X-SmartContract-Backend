import dotenv from "dotenv";
import NFTBridge from "../artifacts/contracts/BaseBridge/NFTCollectionBridgeWrapper.sol/NFTCollectionBridgeWrapper.json";
import {
  web3EThProviderHTTP,
  web3BinanceProvider,
  web3POLYProviderHTTP,
} from "./config/config";
import {
  NFT_BRDIGE_RINKBEY,
  NFT_BRDIGE_POLYGON,
  NFT_BRDIGE_BSC,
} from "./constants/constants";

dotenv.config();

// ADMIN CREDENTIALS
const adminPrivKey = process.env.PRIVATE_KEY;

// ETHEREUM PROVIDER && ETH_BRIDGE CONTRACT INIT
const web3ETH = web3EThProviderHTTP();

const { address: adminETH } = web3ETH.eth.accounts.wallet.add(adminPrivKey);

const ETHBridgeInstance = new web3ETH.eth.Contract(
  NFTBridge.abi,
  NFT_BRDIGE_RINKBEY
);

// BINANCE PROVIDER && BSC_BRIDGE CONTRACT INIT FOR EVENTS

const web3Binance = web3BinanceProvider();

const BNBNFTBridgeInstance = new web3Binance.eth.Contract(
  NFTBridge.abi,
  NFT_BRDIGE_BSC
);

// POYLYGON PROVIDER && POLY_BRIDGE CONTRACT INIT
const web3POLY = web3POLYProviderHTTP();

const { address: adminPOLY } = web3POLY.eth.accounts.wallet.add(adminPrivKey);

const POLYBridgeInstance = new web3POLY.eth.Contract(
  NFTBridge.abi,
  NFT_BRDIGE_POLYGON
);

BNBNFTBridgeInstance.events
  .DEPOSIT({ fromBlock: "latest" })
  .on("data", async (event) => {
    try {
      console.log("BSC Deposit event catched");
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

      if (destinationChainId == "4") {
        console.log(
          collectionName +
            " token transfer started from contract owner to user on Binance to Ethereum."
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
          web3ETH.eth.getGasPrice(),
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

        const receipt = await web3ETH.eth.sendTransaction(txData);

        console.log(`Transaction hash: ${receipt.transactionHash}`);
        console.log(`
            Processed Cross chain NFT transfer:
            - from ${sender} 
            - to ${sender} 
            - tokenID ${tokenID} tokens
          `);
        console.log(
          collectionName +
            " token transfer done from contract owner to user on Binance to Ethereum."
        );
      } else if (destinationChainId == "80001") {
        console.log(
          collectionName +
            " token transfer started from contract owner to user on Binance to Polygon."
        );
        let PolyTokenAddress = await POLYBridgeInstance.methods
          .whitelistedCollectionAddress(collectionName)
          .call();
        console.log(PolyTokenAddress);

        const tx = POLYBridgeInstance.methods.withdraw(
          tamount,
          tokenID,
          PolyTokenAddress,
          sender,
          uri
        );

        const [gasPrice, gasCost] = await Promise.all([
          web3POLY.eth.getGasPrice(),
          tx.estimateGas({ from: adminPOLY }),
        ]);

        const data = tx.encodeABI();

        const txData = {
          from: adminPOLY,
          to: POLYBridgeInstance.options.address,
          data,
          gas: gasCost,
          gasPrice,
        };

        const receipt = await web3POLY.eth.sendTransaction(txData);

        console.log(`Transaction hash: ${receipt.transactionHash}`);
        console.log(`
            Processed Cross chain NFT transfer:
            - from ${sender} 
            - to ${sender} 
            - tokenID ${tokenID} tokens
          `);
        console.log(
          collectionName +
            " token transfer done from contract owner to user on Binance to Polygon."
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

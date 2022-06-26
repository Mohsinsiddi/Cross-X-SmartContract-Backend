import dotenv from "dotenv";
import NFTBridge from "../artifacts/contracts/BaseBridge/NFTCollectionBridgeWrapper.sol/NFTCollectionBridgeWrapper.json";
import {
  web3BSCProviderHTTP,
  web3EthereumProvider,
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

// BINANCE PROVIDER && BSC_BRIDGE CONTRACT INIT
const web3BNB = web3BSCProviderHTTP();

const { address: adminBSC } = web3BNB.eth.accounts.wallet.add(adminPrivKey);

const BSCBridgeInstance = new web3BNB.eth.Contract(
  NFTBridge.abi,
  NFT_BRDIGE_BSC
);

//ETHEREUM PROVIDER && ETH_BRIDGE CONTRACT INIT FOR EVENTS

const web3Ethereum = web3EthereumProvider();

const ETHNFTBridgeInstance = new web3Ethereum.eth.Contract(
  NFTBridge.abi,
  NFT_BRDIGE_RINKBEY
);

// POYLYGON PROVIDER && POLY_BRIDGE CONTRACT INIT
const web3POLY = web3POLYProviderHTTP();

const { address: adminPOLY } = web3POLY.eth.accounts.wallet.add(adminPrivKey);

const POLYBridgeInstance = new web3POLY.eth.Contract(
  NFTBridge.abi,
  NFT_BRDIGE_POLYGON
);

ETHNFTBridgeInstance.events
  .DEPOSIT({ fromBlock: "latest" })
  .on("data", async (event) => {
    try {
      console.log("Ethereum Deposit event catched");
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
            " token transfer started from contract owner to user on Ethereum to Binance."
        );
        let BNBNFTTokenAddress = await BSCBridgeInstance.methods
          .whitelistedCollectionAddress(collectionName)
          .call();
        console.log(BNBNFTTokenAddress);

        const tx = BSCBridgeInstance.methods.withdraw(
          tamount,
          tokenID,
          BNBNFTTokenAddress,
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
            " token transfer done from contract owner to user on Ethereum to Binance."
        );
      } else if (destinationChainId == "80001") {
        console.log(
          collectionName +
            " token transfer started from contract owner to user on Ethereum to Polygon."
        );
        let PolyNFTTokenAddress = await POLYBridgeInstance.methods
          .whitelistedCollectionAddress(collectionName)
          .call();
        console.log(PolyNFTTokenAddress);

        const tx = POLYBridgeInstance.methods.withdraw(
          tamount,
          tokenID,
          PolyNFTTokenAddress,
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
            " token transfer done from contract owner to user on Ethereum to Polygon."
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

import dotenv from 'dotenv';
import logger from '../winstonconfig';
import bridge from '../artifacts/contracts/BridgeWrapperETH.sol/BridgeWrapperETH.json'
import { web3BSCProviderHTTP, web3EThProviderHTTP, web3PolygonProvider } from './config/config';
import { BRIDGE_BSC_TESTNET, BRIDGE_POLY_TESTNET, BRIDGE_RINKBEY} from './constants/constants';

dotenv.config();

  // ADMIN CREDENTIALS
  const adminPrivKey = process.env.PRIVATE_KEY;

  // BINANCE PROVIDER && BSC_BRIDGE CONTRACT INIT
  const web3BNB = web3BSCProviderHTTP()

  const { address: adminBSC } = web3BNB.eth.accounts.wallet.add(adminPrivKey);

  const BSCBridgeInstance = new web3BNB.eth.Contract(
    bridge.abi,
    BRIDGE_BSC_TESTNET
  );
  
  //ETHEREUM PROVIDER && ETH_BRIDGE CONTRACT INIT FOR EVENTS

  const web3Ethereum = web3EThProviderHTTP();

  const { address: adminETH } = web3Ethereum.eth.accounts.wallet.add(adminPrivKey);
  
  const ETHBridgeInstance = new web3Ethereum.eth.Contract(
    bridge.abi,
    BRIDGE_RINKBEY
  );

  // POYLYGON PROVIDER && POLY_BRIDGE CONTRACT INIT
  const web3POLY = web3PolygonProvider();


  const POLYBridgeInstance = new web3POLY.eth.Contract(
    bridge.abi,
    BRIDGE_POLY_TESTNET
  );


  POLYBridgeInstance.events.DEPOSIT({ fromBlock: 'latest'}).on('data',async  event => {
    try{
    console.log('Polygon Deposit event catched');
    console.log(event.returnValues)
    logger.POLYInfoLogger.info('Polygon Deposit event catched');
    let { tamount, sender,tokenAddress,tokenName,destinationChainId} = event.returnValues;
  
    tamount = tamount.replace(/\s+/g, '');
    sender = sender.replace(/\s+/g, '');
    tokenAddress = tokenAddress.replace(/\s+/g, '');

    logger.POLYInfoLogger.info(
      ' amount = ' + tamount +
      ' depositer = ' + sender +
      ' tokenAddress = ' + tokenAddress +
      ' tokenName = '+ tokenName,
      {
       tamount,sender,tokenAddress,tokenName
      }
    );

    if (destinationChainId == "97"){
      
        console.log(
            tokenName + ' token transfer started from contract owner to user on Polygon to Binance.'
          );
          let BNBTokenAddress = await BSCBridgeInstance.methods.whitelistedTokenAddress(tokenName).call();
          console.log(BNBTokenAddress);

          const tx = BSCBridgeInstance.methods.withdraw(tamount,BNBTokenAddress,sender);

          const [gasPrice, gasCost] = await Promise.all([
            web3BNB.eth.getGasPrice(),
            tx.estimateGas({from:adminBSC}),
          ]);

          const data = tx.encodeABI();

          const txData = {
            from: adminBSC,
            to: BSCBridgeInstance.options.address,
            data,
            gas: gasCost,
            gasPrice
          };

          const receipt = await web3BNB.eth.sendTransaction(txData);

          console.log(`Transaction hash: ${receipt.transactionHash}`);
          console.log(`
            Processed transfer:
            - from ${sender} 
            - to ${sender} 
            - amount ${tamount} tokens
          `);
          console.log(
            tokenName + ' token transfer done from contract owner to user on Polygon to Binance.'
          );    
      }
      else if(destinationChainId == "4"){

        console.log(
          tokenName + ' token transfer started from contract owner to user on Polygon to Ethereum.'
        );
        let ETHTokenAddress = await ETHBridgeInstance.methods.whitelistedTokenAddress(tokenName).call();
        console.log(ETHTokenAddress);

        const tx = ETHBridgeInstance.methods.withdraw(tamount,ETHTokenAddress,sender);

        const [gasPrice, gasCost] = await Promise.all([
            web3Ethereum.eth.getGasPrice(),
          tx.estimateGas({from:adminETH}),
        ]);

        const data = tx.encodeABI();

        const txData = {
          from: adminETH,
          to: ETHBridgeInstance.options.address,
          data,
          gas: gasCost,
          gasPrice
        };

        const receipt = await web3Ethereum.eth.sendTransaction(txData);

        console.log(`Transaction hash: ${receipt.transactionHash}`);
        console.log(`
          Processed transfer:
          - from ${sender} 
          - to ${sender} 
          - amount ${tamount} tokens
        `);
        console.log(
          tokenName + ' token transfer done from contract owner to user on Polygon to Ethereum.'
        ); 

      }
    else throw new Error('Ether gas transfer confirmation failed');
      }
      catch(err){
      let { tamount, sender,tokenAddress,tokenName } = event.returnValues;
      logger.POLYErrorLogger.error
      (
        ' An error encountered while transferring ' + tamount +
        ' ERC20 token from contract to user : ' + sender +
        ' tokenAddress = ' + tokenAddress +
        ' tokenName = '+ tokenName +
        ' with errorName ' + err.name +
        ' with errorMessage ' + err.message,
        {
          tamount,sender,tokenAddress,tokenName,
          errorName: err.name,errorMessage: err.message,
        }
      );
      console.log(err.name);
      console.log(err.message);
      console.log(err);
    }
})
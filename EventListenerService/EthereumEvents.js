import dotenv from 'dotenv';
import logger from '../winstonconfig';
import bridge from '../artifacts/contracts/BridgeWrapperETH.sol/BridgeWrapperETH.json'
import { web3BSCProviderHTTP, web3EthereumProvider } from './config/config';
import { BRIDGE_BSC_TESTNET, BRIDGE_RINKBEY} from './constants/constants';

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

  const web3Ethereum = web3EthereumProvider();
  
  const ETHBridgeInstance = new web3Ethereum.eth.Contract(
    bridge.abi,
    BRIDGE_RINKBEY
  );

  ETHBridgeInstance.events.DEPOSIT({ fromBlock: 'latest'}).on('data',async  event => {
    try{
    console.log('Ethereum Deposit event catched');
    console.log(event.returnValues)
    logger.ETHInfoLogger.info('Ethereum Deposit event catched');
    let { tamount, sender,tokenAddress,tokenName,destinationChainId} = event.returnValues;
  
    tamount = tamount.replace(/\s+/g, '');
    sender = sender.replace(/\s+/g, '');
    tokenAddress = tokenAddress.replace(/\s+/g, '');

    logger.ETHInfoLogger.info(
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
            tokenName + ' token transfer started from contract owner to user on Ethereum to Binance.'
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
            tokenName + ' token transfer done from contract owner to user on Ethereum to Binance.'
          );    
      }
    else throw new Error('Ether gas transfer confirmation failed');
      }
      catch(err){
      let { tamount, sender,tokenAddress,tokenName } = event.returnValues;
      logger.ETHErrorLogger.error
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
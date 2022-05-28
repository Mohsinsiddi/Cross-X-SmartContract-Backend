import dotenv from 'dotenv';
import logger from '../winstonconfig';
import bridge from '../artifacts/contracts/BridgeWrapperETH.sol/BridgeWrapperETH.json'
import { web3EThProviderHTTP, web3BinanceProvider } from './config/config';
import { BRIDGE_BSC_TESTNET, BRIDGE_RINKBEY} from './constants/constants';

dotenv.config();

  // ADMIN CREDENTIALS
  const adminPrivKey = process.env.PRIVATE_KEY;

  // ETHEREUM PROVIDER && ETH_BRIDGE CONTRACT INIT
  const web3ETH = web3EThProviderHTTP()

  const { address: adminETH } = web3ETH.eth.accounts.wallet.add(adminPrivKey);

  const ETHBridgeInstance = new web3ETH.eth.Contract(
    bridge.abi,
    BRIDGE_RINKBEY
  );

  // BINANCE PROVIDER && BSC_BRIDGE CONTRACT INIT FOR EVENTS
  
  const web3Binance = web3BinanceProvider();
  
  const BNBBridgeInstance = new web3Binance.eth.Contract(
    bridge.abi,
    BRIDGE_BSC_TESTNET
  );

  BNBBridgeInstance.events.DEPOSIT({ fromBlock: 'latest'}).on('data',async  event => {
    try{
    console.log('BSC Deposit event catched');
    console.log(event.returnValues)
    logger.BNBInfoLogger.info('BSC Deposit event catched');
    let { tamount, sender,tokenAddress,tokenName,destinationChainId} = event.returnValues;
  
    tamount = tamount.replace(/\s+/g, '');
    sender = sender.replace(/\s+/g, '');
    tokenAddress = tokenAddress.replace(/\s+/g, '');

    logger.BNBInfoLogger.info(
      ' amount = ' + tamount +
      ' depositer = ' + sender +
      ' tokenAddress = ' + tokenAddress +
      ' tokenName = '+ tokenName,
      {
       tamount,sender,tokenAddress,tokenName
      }
    );

    if (destinationChainId == "4"){
      
        console.log(
            tokenName + ' token transfer started from contract owner to user on Binance to Ethereum.'
          );
          let ETHTokenAddress = await ETHBridgeInstance.methods.whitelistedTokenAddress(tokenName).call();
          console.log(ETHTokenAddress);

          const tx = ETHBridgeInstance.methods.withdraw(tamount,ETHTokenAddress,sender);

          const [gasPrice, gasCost] = await Promise.all([
            web3ETH.eth.getGasPrice(),
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

          const receipt = await web3ETH.eth.sendTransaction(txData);

          console.log(`Transaction hash: ${receipt.transactionHash}`);
          console.log(`
            Processed transfer:
            - from ${sender} 
            - to ${sender} 
            - amount ${tamount} tokens
          `);
          console.log(
            tokenName + ' token transfer done from contract owner to user on Binance to Ethereum.'
          );    
      }
    else throw new Error('Ether gas transfer confirmation failed');
      }
      catch(err){
      let { tamount, sender,tokenAddress,tokenName } = event.returnValues;
      logger.BNBErrorLogger.error
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
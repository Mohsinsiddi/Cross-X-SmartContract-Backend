import dotenv from 'dotenv';
import Web3 from 'web3';
import HDWalletProvider from '@truffle/hdwallet-provider';
import Web3WsProvider from 'web3-providers-ws';
dotenv.config();

// WEB3 providers for catching events on BINANCE

 function web3BSCProviderHTTP (){
  const provider = new HDWalletProvider({
      mnemonic: process.env.MNEMONICS,
      providerOrUrl: process.env.BINANCE_HTTP_INFURA
    });
    return new Web3(provider);
}

 
 function web3BSCProvider(){
    const provider = new HDWalletProvider({
        mnemonic: process.env.MNEMONICS,
        providerOrUrl: process.env.BINANCE_HTTP_INFURA,
        pollingInterval: 8000,
      })
     return new Web3(provider);
 };

 function web3BinanceProvider(){
    const options = {
        timeout: 30000, // ms
    
        // clientConfig: {
        //   // Useful to keep a connection alive
        //   keepalive: true,
        //   keepaliveInterval: 60000 // ms
        // },
        // Enable auto reconnection
        reconnect: {
          auto: true,
          delay: 5000, // ms
          maxAttempts: 5,
          onTimeout: false,
        },
      };
     return new Web3(new Web3WsProvider(process.env.BINANCE_INFURA, options));
 };

 // WEB3 providers for catching events on ETHEREUM

 function web3EThProviderHTTP(){
  const provider = new HDWalletProvider({
      mnemonic: process.env.MNEMONICS,
      providerOrUrl: process.env.RINKBEY_HTTP_INFURA,
      pollingInterval: 8000,
    })
   return new Web3(provider);
};
 
 function web3ETHprovider(){
    const provider = new HDWalletProvider({
        mnemonic: process.env.MNEMONICS,
        providerOrUrl: process.env.RINKBEY_INFURA,
        pollingInterval: 8000,
      });
      return new Web3(provider);
 }

 function web3EthereumProvider(){
    const options = {
        timeout: 30000, // ms
        // clientConfig: {
        //   // Useful to keep a connection alive
        //   keepalive: true,
        //   keepaliveInterval: 60000 // ms
        // },
        // Enable auto reconnection
        reconnect: {
          auto: true,
          delay: 5000, // ms
          maxAttempts: 5,
          onTimeout: false,
        },
      };
      return new Web3( new Web3WsProvider(process.env.RINKBEY_INFURA, options));
 }


 // COINGECKO Prices API configs

 function coinGeckoPrice(){
    let coinGeckoOptions = {
        method: 'GET',
        url: 'https://api.coingecko.com/api/v3/simple/price',
        params: {ids: 'ethereum,binancecoin', vs_currencies: 'usd,usd'},
        
      };
     return coinGeckoOptions 
 }




export {web3EThProviderHTTP,web3BSCProvider,web3BinanceProvider,
       web3BSCProviderHTTP,web3ETHprovider,web3EthereumProvider,
       coinGeckoPrice};
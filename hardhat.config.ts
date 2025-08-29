import {config} from "dotenv"
config()

import "@nomicfoundation/hardhat-verify"
import "@nomicfoundation/hardhat-toolbox"
import '@typechain/hardhat'
import '@nomicfoundation/hardhat-ethers'
import '@nomicfoundation/hardhat-chai-matchers'


/** @type import('hardhat/config').HardhatUserConfig */

module.exports = {
  solidity: "0.8.20",
  networks: {
    sonic: {
      url: "https://rpc.blaze.soniclabs.com",
      accounts: [process.env.SONIC_PRIVATE_KEY]
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
    }
  },
  etherscan: {
      apiKey: process.env.ETHERSCAN_API_KEY,
      customChains: [
        {
          network: "sonicTestnet",
          chainId: 57054,
          urls: {
            apiURL: "https://api-testnet.sonicscan.org/api",
            browserURL: "https://testnet.sonicscan.org",
          },
        },
      ],
    },
  typechain: {
    outDir: "typechain-types",
    target: "ethers-v6",
  },
}
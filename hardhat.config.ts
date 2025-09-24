import {config} from "dotenv"
config()

import "@nomicfoundation/hardhat-verify"
import "@nomicfoundation/hardhat-toolbox"
import '@typechain/hardhat'
import '@nomicfoundation/hardhat-ethers'
import '@nomicfoundation/hardhat-chai-matchers'

/** @type import('hardhat/config').HardhatUserConfig */

export default {
  solidity: "0.8.20",
  networks: {
    sonic: {
      url: "https://rpc.testnet.soniclabs.com",
      accounts: [process.env.SONIC_PRIVATE_KEY, '0x48effaaa4c487766911c853f986fd101edb09ddabaae38a3be45533a13859b52', '0x48effaaa4c487766911c853f986fd101edb09ddabaae38a3be45533a13859b52']
    },
   localhost: {
      chainId: 31337,
      url: "http://localhost:8545"
    }
  },
  etherscan: {
      apiKey: process.env.ETHERSCAN_API_KEY,
      customChains: [
        {
          network: "sonicTestnet",
          chainId: 14601,
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
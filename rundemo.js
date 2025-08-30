import { exec, execSync } from 'child_process'
import { readFileSync } from 'fs'
import {config} from "dotenv"
config({ path: './frontend/.env' })

console.log('Starting IPFS node...')
execSync('rm -rf ~/.ipfs')
execSync('ipfs init --profile server')
execSync('ipfs config --json API.HTTPHeaders.Access-Control-Allow-Origin \'["*"]\'')
execSync('ipfs config --json API.HTTPHeaders.Access-Control-Allow-Methods \'["GET", "POST", "PUT"]\'')
execSync('ipfs config --json API.HTTPHeaders.Access-Control-Allow-Headers \'["Authorization", "Content-Type"]\'')
exec('npx ipfs daemon')

export default async (req, res) => {
  return readFileSync('./frontend/index.html').toString()
  .replace(/CLOTHESQA_CONTRACT_ADDRESS/g, process.env.CLOTHESQA_CONTRACT_ADDRESS)
  .replace(/CLOTHING_NFT_CONTRACT_ADDRESS/g, process.env.CLOTHING_NFT_CONTRACT_ADDRESS)
  ;
};
# DevicesQA

This code allows QA Factories to upload QA test data to decentralized immutable networks.

## Technology Stack & Tools

- Solidity (Writing Smart Contracts & Tests)
- Javascript (React & Testing)
- [Hardhat](https://hardhat.org/) (Development Framework)
- [Ethers.js](https://docs.ethers.io/v5/) (Blockchain Interaction)
- [React.js](https://reactjs.org/) (Frontend Framework)

## Requirements For Initial Setup
- Install [NodeJS](https://nodejs.org/en/)

## Setting Up
### 1. Clone/Download the Repository

### 2. Install Dependencies:
`$ npm install`

### 3. Run tests
`$ npm run hh:test`

### 5. Run deployment script
`$ npm run deploy:sonic`

### 6. Start demo
`$ npm run demo`

## Color palette

| Purpose / Region                             | Hex         | Approx RGB      |
| -------------------------------------------- | ----------- | --------------- |
| Deep Blue background (badge)                 | **#152a5a** | (21, 42, 90)    |
| Bright Cyan / Teal accent (glow / text)      | **#00c8d2** | (0, 200, 210)   |
| Orange-Yellow glow / burst                   | **#ff9c00** | (255, 156, 0)   |
| Near-white / light for text / highlights     | **#f0f8ff** | (240, 248, 255) |
| Darker shade for contrast (shadow / borders) | **#0c1a3d** | (12, 26, 61)    |


## Time estimate

* Standardiserade grades - 0 - 5 ny parameter som är numeriskt värde - 4h (inkl tester och display-logik)


## TODOS

1. Center header for IMEI id in tracker page.
2. No alert when imei missing, but a red dot instead of green with info with info about .
3. Upload optional pictures (xxx USD) , calculate size times time and display in frontend.
4. Tracker page first - smaller text in parenthesis (debug links on blockchain explorer: .....)
5. Get all data for NFT -> inspect onchain json data



### Hosting frontend on Walrus Sui
Faucet for Sui tokens on testnet: https://faucet.n1stake.com/
https://faucet.sui.io/


### UPloaded frontend
https://6sm69gvj21kq6ky24ygra7smuxg5h4ntxqylq6rlh2myzo7p0.buildonwalrus.dev/tracker.html

https://devicestamp.buildonwalrus.dev/tracker.html


bought domain at https://testnet.suins.io/


Next steps: how to handle devicdstamp.blockchain


Fixing nicer urls:

Extensionless URLs
By default, Walrus Sites do not automatically rewrite extensionless URLs to .html files.
This means that if you have a file called tracker.html, visiting /tracker will not automatically serve tracker.html unless you specifically add a resource for /tracker or configure your build to support this.

How to Support Extensionless URLs
Option 1: Duplicate the Resource

Upload both tracker.html and a copy named tracker (without extension) as resources in your Walrus Site.
This way, both /tracker.html and /tracker will work.
Option 2: Use index.html in Folders

If you want /tracker/ to work, create a folder called tracker and put an index.html inside it.
Upload the folder structure so that /tracker/index.html is available. Then, /tracker/ will serve the page.
Option 3: Custom Routing (Not Natively Supported)

There is no mention in the Walrus Sites documentation of a built-in way to rewrite URLs or handle extensionless routing automatically like Netlify/Vercel.
You would need to handle this at build time (e.g., with your static site generator) by generating both versions of each page.

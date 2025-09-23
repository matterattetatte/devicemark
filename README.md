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



### TODOS
By Monday:

- Filuppladdning (extrahera data i tabellformat: Pass/fail, faultcodes int[], grade string). Behöver inte se super ut. - TODO: uppdatera kontraktet så att det kan ta emot summary

- En enkel eBay-mock (white label) på produktsidan. Ska se likadan ut, men en grön ikon som är klickbar som navigerar i ny flik till lookupen...

- Snygg lookup (se postnord-tracking), som hämtar och visar blockchain-data



## Color palette

| Purpose / Region                             | Hex         | Approx RGB      |
| -------------------------------------------- | ----------- | --------------- |
| Deep Blue background (badge)                 | **#152a5a** | (21, 42, 90)    |
| Bright Cyan / Teal accent (glow / text)      | **#00c8d2** | (0, 200, 210)   |
| Orange-Yellow glow / burst                   | **#ff9c00** | (255, 156, 0)   |
| Near-white / light for text / highlights     | **#f0f8ff** | (240, 248, 255) |
| Darker shade for contrast (shadow / borders) | **#0c1a3d** | (12, 26, 61)    |


## Time estimate

* Nytt token som kupong + tester 6h
* Standardiserade grades - 0 - 5 ny parameter som är numeriskt värde - 4h (inkl tester och display-logik)
// * make sure to replace all black to green in image <img alt="Barcode Generator TEC-IT" src="https://barcode.tec-it.com/barcode.ashx?data=356127107307440&amp;code=Code128&amp;eclevel=L"> 
* Check how the raw request looks like when signing a transaction

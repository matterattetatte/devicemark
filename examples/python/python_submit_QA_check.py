import os
import zipfile
import json
from pathlib import Path
import ipfshttpclient
from web3 import Web3
from eth_account import Account
import asyncio

# Set up paths
folder_path = os.path.join(os.path.dirname(__file__), '../mock/QAData0')

# Create a ZIP file in memory
zip_path = 'QAData0.zip'
with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zip_file:
    for root, _, files in os.walk(folder_path):
        for file in files:
            file_path = os.path.join(root, file)
            zip_file.write(file_path, os.path.relpath(file_path, os.path.dirname(folder_path)))

# Read ZIP file as bytes
with open(zip_path, 'rb') as f:
    zip_data = f.read()

# Connect to IPFS client (assumes local IPFS node at /ip4/127.0.0.1/tcp/5001)
async def upload_to_ipfs():
    async with ipfshttpclient.connect() as client:
        result = await client.add_bytes(zip_data)
        cid_str = result['Hash']
        print(f"Uploaded to IPFS with CID: {cid_str}")
        return cid_str

# Run async IPFS upload
cid_str = asyncio.run(upload_to_ipfs())

# Prepare QA check details
nft_id = 1  # Example NFT ID
passed = True  # Example check result
details = json.dumps({
    "testType": "color_fastness",
    "result": "No fading observed",
    "testDate": "2025-08-20",
    "standards": "ISO 105-B02",
    "ipfsCID": cid_str,
    "score": 95
})

# Connect to Sonic Testnet
SONIC_TESTNET_RPC = 'https://rpc.testnet.soniclabs.com'  # Sonic testnet RPC
SONIC_CHAIN_ID = 64165  # Sonic testnet chain ID
w3 = Web3(Web3.HTTPProvider(SONIC_TESTNET_RPC))

# Verify connection
if not w3.is_connected():
    raise Exception("Failed to connect to Sonic Testnet RPC")

# Set up QA factory account (replace with your private key)
qa_factory = Account.from_key('YOUR_PRIVATE_KEY')  # Replace with your private key

# Load contract ABI and address (replace with your deployed contract details)
# Example: DevicesQA_abi = [...] (load from JSON file or deployment artifact)
DevicesQA_address = 'YOUR_DevicesQA_CONTRACT_ADDRESS'  # Replace with your contract address
deviceNFT_address = 'YOUR_CLOTHINGNFT_CONTRACT_ADDRESS'  # Replace with your NFT contract address
DevicesQA = w3.eth.contract(address=DevicesQA_address, abi=DevicesQA_abi)
deviceNFT = w3.eth.contract(address=deviceNFT_address, abi=deviceNFT_abi)

# Submit QA check to DevicesQA contract
transaction = DevicesQA.functions.submitQACheck(nft_id, passed, details).build_transaction({
    'from': qa_factory.address,
    'nonce': w3.eth.get_transaction_count(qa_factory.address),
    'gas': 2000000,  # Sonic has low gas fees; adjust if needed
    'gasPrice': w3.to_wei('1', 'gwei'),  # Sonic testnet uses low gas prices
    'chainId': SONIC_CHAIN_ID  # Required for Sonic testnet
})

# Sign and send transaction
signed_txn = w3.eth.account.sign_transaction(transaction, qa_factory.key)
txn_hash = w3.eth.send_raw_transaction(signed_txn.raw_transaction)
txn_receipt = w3.eth.wait_for_transaction_receipt(txn_hash)

# Check for emitted HistoryAdded event
event_found = False
for event in deviceNFT.events.HistoryAdded().process_receipt(txn_receipt):
    event_found = True
    break
assert event_found, "HistoryAdded event was not emitted"

# Download file from IPFS by CID
async def download_from_ipfs(cid):
    async with ipfshttpclient.connect() as client:
        downloaded_data = await client.cat(cid)
        return downloaded_data

# Run async IPFS download
downloaded_data = asyncio.run(download_from_ipfs(cid_str))

# Verify downloaded data matches uploaded data
assert downloaded_data == zip_data, "Downloaded data does not match uploaded data"

# Clean up temporary ZIP file
os.remove(zip_path)
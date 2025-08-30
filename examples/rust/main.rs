use ipfs_api::{IpfsClient, TryFromUri};
use web3::{
    contract::{Contract, Options},
    types::{Address, H256, U256},
};
use ethabi::Token;
use serde_json::json;
use std::{fs::{self, File}, path::Path, io::Write};
use zip::{write::FileOptions, ZipWriter};
use walkdir::WalkDir;
use anyhow::{Result, anyhow};
use hex::ToHex;

#[tokio::main]
async fn main() -> Result<()> {
    // Set up paths
    let folder_path = Path::new("../mock/QAData0");
    let zip_path = Path::new("QAData0.zip");

    // Create a ZIP file
    let zip_file = File::create(zip_path)?;
    let mut zip = ZipWriter::new(zip_file);
    let options = FileOptions::default().compression_method(zip::CompressionMethod::Deflated);

    for entry in WalkDir::new(folder_path).into_iter().filter_map(|e| e.ok()) {
        let path = entry.path();
        if path.is_file() {
            let relative_path = path.strip_prefix(folder_path)?.to_str().ok_or_else(|| anyhow!("Invalid path"))?;
            zip.start_file(relative_path, options)?;
            let data = fs::read(path)?;
            zip.write_all(&data)?;
        }
    }
    zip.finish()?;

    // Read ZIP file as bytes
    let zip_data = fs::read(zip_path)?;

    // Connect to IPFS client (assumes local IPFS node at /ip4/127.0.0.1/tcp/5001)
    let client = IpfsClient::from_str("http://127.0.0.1:5001")?;
    let result = client.add(&*zip_data).await?;
    let cid_str = result.hash;
    println!("Uploaded to IPFS with CID: {}", cid_str);

    // Prepare QA check details
    let nft_id = 1u64; // Example NFT ID
    let passed = true; // Example check result
    let details = json!({
        "testType": "color_fastness",
        "result": "No fading observed",
        "testDate": "2025-08-20",
        "standards": "ISO 105-B02",
        "ipfsCID": cid_str,
        "score": 95
    }).to_string();

    // Connect to Sonic Testnet
    let sonic_testnet_rpc = "https://rpc.testnet.soniclabs.com";
    let sonic_chain_id = 64165u64;
    let transport = web3::transports::Http::new(sonic_testnet_rpc)?;
    let w3 = web3::Web3::new(transport);

    // Verify connection
    if w3.eth().block_number().await.is_err() {
        return Err(anyhow!("Failed to connect to Sonic Testnet RPC"));
    }

    // Set up QA factory account (replace with your private key)
    let private_key = "YOUR_PRIVATE_KEY"; // Replace with your private key
    let account = web3::eth_accounts::Account::from_private_key(
        H256::from_slice(&hex::decode(private_key)?),
        &w3,
    );

    // Load contract ABI and address (replace with your deployed contract details)
    let clothes_qa_address: Address = "YOUR_CLOTHESQA_CONTRACT_ADDRESS"
        .parse()
        .map_err(|_| anyhow!("Invalid contract address"))?;
    let clothing_nft_address: Address = "YOUR_CLOTHINGNFT_CONTRACT_ADDRESS"
        .parse()
        .map_err(|_| anyhow!("Invalid NFT contract address"))?;
    
    // Example ABI (load from file or hardcode)
    let clothes_qa_abi: &[u8] = include_bytes!("path/to/clothesQA_abi.json"); // Replace with actual ABI
    let clothing_nft_abi: &[u8] = include_bytes!("path/to/clothingNFT_abi.json"); // Replace with actual ABI
    let clothes_qa = Contract::from_json(w3.eth(), clothes_qa_address, clothes_qa_abi)?;
    let clothing_nft = Contract::from_json(w3.eth(), clothing_nft_address, clothing_nft_abi)?;

    // Submit QA check to clothesQA contract
    let tx = clothes_qa.call(
        "submitQACheck",
        (nft_id, passed, details.clone()),
        account.address(),
        Options {
            gas: Some(U256::from(2_000_000)),
            gas_price: Some(U256::from(1_000_000_000)), // 1 gwei
            ..Default::default()
        },
    ).await?;

    // Wait for transaction receipt
    let receipt = w3.eth().transaction_receipt(tx).await?.ok_or_else(|| anyhow!("Transaction failed"))?;

    // Check for emitted HistoryAdded event (simplified check)
    let event_found = receipt.logs.iter().any(|log| {
        log.topics.get(0).map_or(false, |topic| {
            // Replace with actual event signature hash for HistoryAdded
            topic == &H256::from_slice(&hex::decode("YOUR_EVENT_SIGNATURE_HASH")?)
        })
    });
    if !event_found {
        return Err(anyhow!("HistoryAdded event was not emitted"));
    }

    // Download file from IPFS by CID
    let downloaded_data = client.cat(&cid_str).await?;
    let downloaded_data: Vec<u8> = downloaded_data.collect().await?;

    // Verify downloaded data matches uploaded data
    if downloaded_data != zip_data {
        return Err(anyhow!("Downloaded data does not match uploaded data"));
    }

    // Clean up temporary ZIP file
    fs::remove_file(zip_path)?;

    Ok(())
}
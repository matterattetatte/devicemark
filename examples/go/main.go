package main

import (
    "bytes"
    "context"
    "encoding/hex"
    "encoding/json"
    "fmt"
    "io"
    "os"
    "path/filepath"
    "strings"

    "github.com/ethereum/go-ethereum/accounts/abi"
    "github.com/ethereum/go-ethereum/accounts/abi/bind"
    "github.com/ethereum/go-ethereum/common"
    "github.com/ethereum/go-ethereum/core/types"
    "github.com/ethereum/go-ethereum/crypto"
    "github.com/ethereum/go-ethereum/ethclient"
    "github.com/ipfs/go-ipfs-api"
    "github.com/klauspost/compress/zip"
    "github.com/spf13/afero"
)

func main() {
    // Set up paths
    folderPath := "../mock/QAData0"
    zipPath := "QAData0.zip"

    // Create a ZIP file
    var zipBuf bytes.Buffer
    zipWriter := zip.NewWriter(&zipBuf)
    fs := afero.NewOsFs()

    err := filepath.Walk(folderPath, func(path string, info os.FileInfo, err error) error {
        if err != nil {
            return err
        }
        if info.IsDir() {
            return nil
        }
        relPath, err := filepath.Rel(folderPath, path)
        if err != nil {
            return err
        }
        zipFile, err := zipWriter.Create(relPath)
        if err != nil {
            return err
        }
        fileData, err := afero.ReadFile(fs, path)
        if err != nil {
            return err
        }
        _, err = zipFile.Write(fileData)
        return err
    })
    if err != nil {
        fmt.Fprintf(os.Stderr, "Error creating ZIP: %v\n", err)
        os.Exit(1)
    }
    zipWriter.Close()

    // Read ZIP data
    zipData := zipBuf.Bytes()

    // Save ZIP file temporarily
    err = os.WriteFile(zipPath, zipData, 0644)
    if err != nil {
        fmt.Fprintf(os.Stderr, "Error writing ZIP file: %v\n", err)
        os.Exit(1)
    }
    defer os.Remove(zipPath)

    // Connect to IPFS client
    ipfsClient := shell.NewShell("localhost:5001")
    cid, err := ipfsClient.Add(bytes.NewReader(zipData))
    if err != nil {
        fmt.Fprintf(os.Stderr, "Error uploading to IPFS: %v\n", err)
        os.Exit(1)
    }
    fmt.Printf("Uploaded to IPFS with CID: %s\n", cid)

    // Prepare QA check details
    nftID := uint64(1)
    passed := true
    details := map[string]interface{}{
        "testType":  "color_fastness",
        "result":    "No fading observed",
        "testDate":  "2025-08-20",
        "standards": "ISO 105-B02",
        "ipfsCID":   cid,
        "score":     95,
    }
    detailsJSON, err := json.Marshal(details)
    if err != nil {
        fmt.Fprintf(os.Stderr, "Error marshaling JSON: %v\n", err)
        os.Exit(1)
    }

    // Connect to Sonic Testnet
    sonicTestnetRPC := "https://rpc.testnet.soniclabs.com"
    client, err := ethclient.Dial(sonicTestnetRPC)
    if err != nil {
        fmt.Fprintf(os.Stderr, "Failed to connect to Sonic Testnet RPC: %v\n", err)
        os.Exit(1)
    }
    defer client.Close()

    // Set up QA factory account
    privateKeyHex := "YOUR_PRIVATE_KEY" // Replace with your private key
    privateKey, err := crypto.HexToECDSA(privateKeyHex)
    if err != nil {
        fmt.Fprintf(os.Stderr, "Error parsing private key: %v\n", err)
        os.Exit(1)
    }

    // Load contract ABIs (replace with actual ABI JSON strings)
    clothesQAAbiJSON := `YOUR_CLOTHESQA_ABI_JSON` // Replace with ABI JSON
    clothingNFTAbiJSON := `YOUR_CLOTHINGNFT_ABI_JSON` // Replace with ABI JSON
    clothesQAAbi, err := abi.JSON(strings.NewReader(clothesQAAbiJSON))
    if err != nil {
        fmt.Fprintf(os.Stderr, "Error parsing clothesQA ABI: %v\n", err)
        os.Exit(1)
    }
    clothingNFTAbi, err := abi.JSON(strings.NewReader(clothingNFTAbiJSON))
    if err != nil {
        fmt.Fprintf(os.Stderr, "Error parsing clothingNFT ABI: %v\n", err)
        os.Exit(1)
    }

    // Contract addresses
    clothesQAAddress := common.HexToAddress("YOUR_CLOTHESQA_CONTRACT_ADDRESS")
    clothingNFTAddress := common.HexToAddress("YOUR_CLOTHINGNFT_CONTRACT_ADDRESS")

    // Create contract bindings
    clothesQA, err := bind.NewBoundContract(clothesQAAddress, clothesQAAbi, client, client, client)
    if err != nil {
        fmt.Fprintf(os.Stderr, "Error binding clothesQA contract: %v\n", err)
        os.Exit(1)
    }

    // Prepare transaction
    auth, err := bind.NewKeyedTransactorWithChainID(privateKey, big.NewInt(64165)) // Sonic Testnet chain ID
    if err != nil {
        fmt.Fprintf(os.Stderr, "Error creating transactor: %v\n", err)
        os.Exit(1)
    }
    auth.GasLimit = 2000000
    auth.GasPrice = big.NewInt(1000000000) // 1 gwei

    // Submit QA check
    tx, err := clothesQA.Transact(auth, "submitQACheck", nftID, passed, string(detailsJSON))
    if err != nil {
        fmt.Fprintf(os.Stderr, "Error submitting QA check: %v\n", err)
        os.Exit(1)
    }

    // Wait for transaction receipt
    receipt, err := bind.WaitMined(context.Background(), client, tx)
    if err != nil {
        fmt.Fprintf(os.Stderr, "Error waiting for transaction: %v\n", err)
        os.Exit(1)
    }

    // Check for HistoryAdded event
    eventFound := false
    historyAddedSig := crypto.Keccak256Hash([]byte("HistoryAdded(uint256,bytes)")) // Replace with actual event signature
    for _, log := range receipt.Logs {
        if log.Address == clothingNFTAddress && len(log.Topics) > 0 && log.Topics[0] == historyAddedSig {
            eventFound = true
            break
        }
    }
    if !eventFound {
        fmt.Fprintf(os.Stderr, "HistoryAdded event was not emitted\n")
        os.Exit(1)
    }

    // Download file from IPFS
    downloadedData, err := ipfsClient.Cat(cid)
    if err != nil {
        fmt.Fprintf(os.Stderr, "Error downloading from IPFS: %v\n", err)
        os.Exit(1)
    }
    var downloadedBuf bytes.Buffer
    _, err = io.Copy(&downloadedBuf, downloadedData)
    if err != nil {
        fmt.Fprintf(os.Stderr, "Error reading downloaded data: %v\n", err)
        os.Exit(1)
    }
    downloadedData.Close()

    // Verify downloaded data
    if !bytes.Equal(downloadedBuf.Bytes(), zipData) {
        fmt.Fprintf(os.Stderr, "Downloaded data does not match uploaded data\n")
        os.Exit(1)
    }

    fmt.Println("Success: Data uploaded, transaction submitted, and data verified")
}
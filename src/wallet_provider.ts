import {
  getAddressBalance,
  getFundingUTXOs,
  getNetworkFees,
  getTipHeight,
  pushTx
} from './mempool_api'

export type Fees = {
  // fee for inclusion in the next block
  fastestFee: number
  // fee for inclusion in a block in 30 mins
  halfHourFee: number
  // fee for inclusion in a block in 1 hour
  hourFee: number
  // economy fee: inclusion not guaranteed
  economyFee: number
  // minimum fee: the minimum fee of the network
  minimumFee: number
}

// UTXO is a structure defining attributes for a UTXO
export interface UTXO {
  // hash of transaction that holds the UTXO
  txid: string
  // index of the output in the transaction
  vout: number
  // amount of satoshis the UTXO holds
  value: number
  // the script that the UTXO contains
  scriptPubKey: string
}

export interface InscriptionResult {
  list: Inscription[]
  total: number
}

export interface Inscription {
  output: string
  inscriptionId: string
  address: string
  offset: number
  outputValue: number
  location: string
  contentType: string
  contentLength: number
  inscriptionNumber: number
  timestamp: number
  genesisTransaction: string
}

// supported networks
export enum Network {
  MAINNET = 'mainnet',
  TESTNET = 'testnet',
  SIGNET = 'signet'
}

// WalletInfo is a structure defining attributes for a wallet
export type WalletInfo = {
  publicKeyHex: string
  address: string
}

// Default number of inscriptions to fetch in a single method call
export const DEFAULT_INSCRIPTION_LIMIT = 100

/**
 * Abstract class representing a wallet provider.
 * Provides methods for connecting to a wallet, retrieving wallet information, signing transactions, and more.
 */

export abstract class WalletProvider {
  /**
   * Connects to the wallet and returns the instance of the wallet provider.
   * Currently only supports "native segwit" and "taproot" address types.
   * @returns A promise that resolves to an instance of the wrapper wallet provider in babylon friendly format.
   * @throws An error if the wallet is not installed or if connection fails.
   */
  abstract connectWallet(): Promise<this>

  /**
   * Gets the name of the wallet provider.
   * @returns A promise that resolves to the name of the wallet provider.
   */
  abstract getWalletProviderName(): Promise<string>

  /**
   * Gets the address of the connected wallet.
   * @returns A promise that resolves to the address of the connected wallet.
   */
  abstract getAddress(): Promise<string>

  /**
   * Gets the public key of the connected wallet.
   * @returns A promise that resolves to the public key of the connected wallet.
   */
  abstract getPublicKeyHex(): Promise<string>

  /**
   * Signs the given PSBT in hex format.
   * @param psbtHex - The hex string of the unsigned PSBT to sign.
   * @returns A promise that resolves to the hex string of the signed PSBT.
   */
  abstract signPsbt(psbtHex: string): Promise<string>

  /**
   * Signs multiple PSBTs in hex format.
   * @param psbtsHexes - The hex strings of the unsigned PSBTs to sign.
   * @returns A promise that resolves to an array of hex strings, each representing a signed PSBT.
   */
  abstract signPsbts(psbtsHexes: string[]): Promise<string[]>

  /**
   * Gets the network of the current account.
   * @returns A promise that resolves to the network of the current account.
   */
  abstract getNetwork(): Promise<Network>

  /**
   * Signs a message using BIP-322 simple.
   * @param message - The message to sign.
   * @returns A promise that resolves to the signed message.
   */
  abstract signMessageBIP322(message: string): Promise<string>

  /**
   * Registers an event listener for the specified event.
   * At the moment, only the "accountChanged" event is supported.
   * @param eventName - The name of the event to listen for.
   * @param callBack - The callback function to be executed when the event occurs.
   */
  abstract on(eventName: string, callBack: () => void): void
  abstract off(eventName: string, callBack: () => void): void

  abstract switchNetwork(network: Network): Promise<void>
  abstract sendBitcoin(to: string, satAmount: number): Promise<string>

  /**
   * Retrieves the inscriptions for the connected wallet.
   * @returns A promise that resolves to an array of inscriptions.
   */
  abstract getInscriptions(
    cursor?: number,
    size?: number
  ): Promise<InscriptionResult>

  /**
   * Retrieves the network fees.
   * @returns A promise that resolves to the network fees.
   */
  public async getNetworkFees(): Promise<Fees> {
    return await getNetworkFees(await this.getNetwork())
  }

  /**
   * Pushes a transaction to the network.
   * @param txHex - The hexadecimal representation of the transaction.
   * @returns A promise that resolves to a string representing the transaction ID.
   */
  public async pushTx(txHex: string): Promise<string> {
    return await pushTx(await this.getNetwork(), txHex)
  }

  /**
   * Retrieves the unspent transaction outputs (UTXOs) for a given address and amount.
   *
   * If the amount is provided, it will return UTXOs that cover the specified amount.
   * If the amount is not provided, it will return all available UTXOs for the address.
   *
   * @param address - The address to retrieve UTXOs for.
   * @param amount - Optional amount of funds required.
   * @returns A promise that resolves to an array of UTXOs.
   */
  public async getUtxos(address: string, amount?: number): Promise<UTXO[]> {
    // mempool call
    return await getFundingUTXOs(await this.getNetwork(), address, amount)
  }

  /**
   * Retrieves the tip height of the BTC chain.
   * @returns A promise that resolves to the block height.
   */
  public async getBTCTipHeight(): Promise<number> {
    return await getTipHeight(await this.getNetwork())
  }

  /**
   * Gets the balance for the connected wallet address.
   * By default, this method will return the mempool balance if not implemented by the child class.
   * @returns A promise that resolves to the balance of the wallet.
   */
  public async getBalance(): Promise<number> {
    return await getAddressBalance(
      await this.getNetwork(),
      await this.getAddress()
    )
  }
}

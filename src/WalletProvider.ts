import { Keplr } from '@keplr-wallet/types'
import { KeplrSignOptions, Key } from '@keplr-wallet/types/src/wallet/keplr'
import {
  AminoSignResponse,
  BroadcastMode,
  OfflineAminoSigner,
  OfflineDirectSigner,
  StdSignature,
  StdSignDoc
} from '@keplr-wallet/types/src/cosmjs'
import { ChainInfo } from '@keplr-wallet/types/src/chain-info'

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

export type TomoChain = {
  network: string
  backendUrls?: Record<string, string>
}

export type TomoChainBTC = TomoChain & {
  backendUrls?: {
    mempoolUrl?: string
    inscriptionUrl?: string
  }
}

export type TomoChainCosmos = TomoChain & {
  backendUrls?: {
    rpcUrl?: string
  }
}

// export type TomoCosmosInjected = Keplr
export type TomoCosmosInjected = {
  enable(chainIds: string | string[]): Promise<void>
  getOfflineSigner(
    chainId: string,
    signOptions?: KeplrSignOptions
  ): OfflineAminoSigner & OfflineDirectSigner
  getKey(chainId: string): Promise<Key>
  signAmino(
    chainId: string,
    signer: string,
    signDoc: StdSignDoc,
    signOptions?: KeplrSignOptions
  ): Promise<AminoSignResponse>
  signArbitrary(
    chainId: string,
    signer: string,
    data: string | Uint8Array
  ): Promise<StdSignature>
  sendTx(
    chainId: string,
    tx: Uint8Array,
    mode: BroadcastMode
  ): Promise<Uint8Array>
  experimentalSuggestChain?(chainInfo: ChainInfo): Promise<void>
}

export type ProviderOption = {
  getWindow?: () => Window
  chains: TomoChain[]
}

/**
 * Abstract class representing a wallet provider.
 * Provides methods for connecting to a wallet, retrieving wallet information, signing transactions, and more.
 */

export abstract class WalletProvider {
  chains: TomoChain[]
  option: ProviderOption
  constructor(option: ProviderOption) {
    this.chains = option.chains
    this.option = option
  }
  /**
   * Connects to the wallet and returns the instance of the wallet provider.
   * Currently only supports "native segwit" and "taproot" address types.
   * @returns A promise that resolves to an instance of the wrapper wallet provider in babylon friendly format.
   * @throws An error if the wallet is not installed or if connection fails.
   */
  abstract connectWallet(): Promise<this>

  /**
   * Gets the address of the connected wallet.
   * @returns A promise that resolves to the address of the connected wallet.
   */
  abstract getAddress(): Promise<string>

  /**
   * Gets the network of the current account.
   * @returns A promise that resolves to the network of the current account.
   */
  abstract getNetwork(): Promise<string>

  /**
   * Gets the name of the wallet provider.
   * @returns Name of the wallet provider.
   */
  abstract getWalletProviderName(): Promise<string>

  /**
   * Gets the icon URL of the wallet provider.
   * @returns Icon URL of the wallet provider.
   */
  abstract getWalletProviderIcon(): Promise<string>
}

export function getWindow(option: ProviderOption | undefined): Window {
  return option?.getWindow ? option.getWindow() : window
}

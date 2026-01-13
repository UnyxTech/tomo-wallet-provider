import {
  getAddressBalance,
  getFundingUTXOs,
  getInscriptions,
  getNetworkFees,
  getTipHeight,
  pushTx,
  setBtcApiUrl,
  setBtcServiceApiUrl
} from '../../mempoolApi'
import {
  Fees,
  InscriptionResult,
  Network,
  ProviderOption,
  UTXO,
  WalletProvider
} from '../../WalletProvider'
import { initBTCEccLib } from '../../utils/eccLibUtils'

export type TomoBitcoinInjected = {
  // connect
  requestAccounts: () => Promise<string[]>
  getAccounts: () => Promise<string[]>
  getPublicKey: () => Promise<string>
  signPsbt: (psbtHex: string, options?: SignPsbtOptions) => Promise<string>
  signPsbts: (
    psbtsHexes: string[],
    options?: SignPsbtOptions[]
  ) => Promise<string[]>
  getNetwork: () => Promise<Network>
  signMessage: (
    message: string,
    // default 'ecdsa'
    type?: 'ecdsa' | 'bip322-simple'
  ) => Promise<string>
  switchNetwork: (network: Network) => Promise<void>
  sendBitcoin: (to: string, amount: number) => Promise<string>
  pushTx?: (txHex: string) => Promise<string>
  getBalance?: (address: string) => Promise<number>
  getInscriptions?: (
    cursor?: number,
    size?: number
  ) => Promise<InscriptionResult[]>
  on?: (eventName: string, callBack: () => void) => void
  off?: (eventName: string, callBack: () => void) => void
}

export interface Contract {
  id: string
  params: Record<string, string | number | string[] | number[]>
}

/**
 * Sign psbt input option, compatible with OneKey signPsbt "toSignInputs" field.
 */
export interface SignPsbtToSignInput {
  /**
   * Which input index to sign.
   */
  index: number
  /**
   * Address used to locate the corresponding private key.
   * Either "address" or "publicKey" should be provided.
   */
  address?: string
  /**
   * Public key used to locate the corresponding private key.
   * Either "address" or "publicKey" should be provided.
   */
  publicKey?: string
  /**
   * Optional sighash types for the input.
   */
  sighashTypes?: number[]
  /**
   * Default is false. Set true to use original private key when signing taproot inputs.
   */
  disableTweakSigner?: boolean
  /**
   * Force whether to use tweaked signer. Higher priority than disableTweakSigner.
   */
  useTweakedSigner?: boolean
}

export interface SignPsbtOptions {
  /**
   * Whether finalize psbt after signing. Default is true.
   */
  autoFinalized?: boolean
  /**
   * Compatible with OneKey signPsbt "toSignInputs" field.
   * Used to specify which inputs should be signed and how.
   */
  toSignInputs?: SignPsbtToSignInput[]
  /**
   * Tomo contracts extension, kept for backward compatibility.
   */
  contracts?: Contract[]
}

/**
 * Abstract class representing a wallet provider.
 * Provides methods for connecting to a wallet, retrieving wallet information, signing transactions, and more.
 */

export abstract class BTCProvider extends WalletProvider {
  bitcoinNetworkProvider: TomoBitcoinInjected
  constructor(
    option: ProviderOption,
    bitcoinNetworkProvider: TomoBitcoinInjected
  ) {
    super(option)
    this.bitcoinNetworkProvider = bitcoinNetworkProvider
    initBTCEccLib()
    setBtcApiUrl(this.chains?.[0]?.backendUrls?.mempoolUrl)
    setBtcServiceApiUrl(this.chains?.[0]?.backendUrls?.inscriptionUrl)
  }
  /**
   * Gets the address of the connected wallet.
   * @returns A promise that resolves to the address of the connected wallet.
   */
  async getAddress(): Promise<string> {
    const accounts = (await this.bitcoinNetworkProvider.getAccounts()) || []
    if (!accounts?.[0]) {
      throw new Error('Wallet not connected')
    }
    return accounts[0]
  }

  /**
   * Gets the public key of the connected wallet.
   * @returns A promise that resolves to the public key of the connected wallet.
   */
  async getPublicKeyHex(): Promise<string> {
    return await this.bitcoinNetworkProvider.getPublicKey()
  }

  /**
   * Signs the given PSBT in hex format.
   * @param psbtHex - The hex string of the unsigned PSBT to sign.
   * @param options - Optional parameters for signing the PSBT.
   * @returns A promise that resolves to the hex string of the signed PSBT.
   */
  async signPsbt(psbtHex: string, options?: SignPsbtOptions): Promise<string> {
    return await this.bitcoinNetworkProvider.signPsbt(psbtHex, options)
  }

  /**
   * Signs multiple PSBTs in hex format.
   * @param psbtsHexes - The hex strings of the unsigned PSBTs to sign.
   * @param options - Optional parameters for signing the PSBTs.
   * @returns A promise that resolves to an array of hex strings, each representing a signed PSBT.
   */
  async signPsbts(
    psbtsHexes: string[],
    options?: SignPsbtOptions[]
  ): Promise<string[]> {
    return await this.bitcoinNetworkProvider.signPsbts(psbtsHexes, options)
  }

  /**
   * Gets the network of the current account.
   * @returns A promise that resolves to the network of the current account.
   */
  async getNetwork(): Promise<Network> {
    return (await this.bitcoinNetworkProvider.getNetwork()).replace(
      'livenet',
      'mainnet'
    ) as Network
  }

  /**
   * Signs a message using BIP-322 simple.
   * @param message - The message to sign.
   * @returns A promise that resolves to the signed message.
   */
  async signMessageBIP322(message: string): Promise<string> {
    return await this.signMessage(message, 'bip322-simple')
  }

  async signMessage(
    message: string,
    type: 'ecdsa' | 'bip322-simple' = 'ecdsa'
  ): Promise<string> {
    return await this.bitcoinNetworkProvider.signMessage(message, type)
  }

  /**
   * Registers an event listener for the specified event.
   * At the moment, only the "accountChanged" event is supported.
   * @param eventName - The name of the event to listen for.
   * @param callBack - The callback function to be executed when the event occurs.
   */
  on(eventName: string, callBack: () => void) {
    this.bitcoinNetworkProvider?.on?.(eventName, callBack)
  }
  off(eventName: string, callBack: () => void): void {
    this.bitcoinNetworkProvider?.off?.(eventName, callBack)
  }

  async switchNetwork(network: Network): Promise<void> {
    await this.bitcoinNetworkProvider.switchNetwork(network)
  }
  async sendBitcoin(to: string, satAmount: number): Promise<string> {
    const result = await this.bitcoinNetworkProvider.sendBitcoin(
      to,
      Number(satAmount)
    )
    return result
  }

  /**
   * Retrieves the inscriptions for the connected wallet.
   * @returns A promise that resolves to an array of inscriptions.
   */
  public async getInscriptions(
    cursor?: number,
    size?: number
  ): Promise<InscriptionResult> {
    return await getInscriptions({
      address: await this.getAddress(),
      // @ts-ignore
      networkType: (await this.getNetwork()).toUpperCase(),
      cursor: cursor,
      size: size
    })
  }

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

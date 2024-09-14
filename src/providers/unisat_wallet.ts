import {
  InscriptionResult,
  Network,
  WalletInfo,
  WalletProvider
} from '../wallet_provider'
import { parseUnits } from '../utils/parseUnits'

export const unisatProvider = 'unisat'

export class UnisatWallet extends WalletProvider {
  private unisatWalletInfo: WalletInfo | undefined
  private bitcoinNetworkProvider: any

  constructor() {
    super()
    // check whether there is an OKX Wallet extension
    if (!window[unisatProvider]) {
      throw new Error('UniSat Wallet extension not found')
    }
    this.bitcoinNetworkProvider = window[unisatProvider]
  }

  connectWallet = async (): Promise<this> => {
    const unisatwallet = window[unisatProvider]
    try {
      const accounts = await unisatwallet.requestAccounts()
      const compressedPublicKey = await unisatwallet.getPublicKey()
      if (compressedPublicKey && accounts[0]) {
        this.unisatWalletInfo = {
          publicKeyHex: compressedPublicKey,
          address: accounts[0]
        }
        return this
      }
      return this
    } catch (error) {
      throw new Error('Failed to connect to unisat wallet')
    }
  }

  getWalletProviderName = async (): Promise<string> => {
    return 'UniSat'
  }

  getAddress = async (): Promise<string> => {
    return (await this.bitcoinNetworkProvider.getAccounts())[0]
  }

  getPublicKeyHex = async () => {
    if (!this.unisatWalletInfo) {
      throw new Error('OKX Wallet not connected')
    }
    return this.unisatWalletInfo.publicKeyHex
  }

  signPsbt = async (psbtHex: string): Promise<string> => {
    if (!this.unisatWalletInfo) {
      throw new Error('Wallet not connected')
    }
    // Use signPsbt since it shows the fees
    return await this.bitcoinNetworkProvider.signPsbt(psbtHex)
  }

  signPsbts = async (psbtsHexes: string[]): Promise<string[]> => {
    if (!this.unisatWalletInfo) {
      throw new Error('Wallet not connected')
    }
    // sign the PSBTs
    return await this.bitcoinNetworkProvider.signPsbts(psbtsHexes)
  }

  signMessageBIP322 = async (message: string): Promise<string> => {
    if (!this.unisatWalletInfo) {
      throw new Error('Wallet not connected')
    }
    return await this.bitcoinNetworkProvider.signMessage(
      message,
      'bip322-simple'
    )
  }

  getNetwork = async (): Promise<Network> => {
    return (await this.bitcoinNetworkProvider.getNetwork()).replace(
      'livenet',
      'mainnet'
    )
  }

  async switchNetwork(network: Network) {
    return await this.bitcoinNetworkProvider.switchNetwork(
      network.replace('mainnet', 'livenet')
    )
  }

  async sendBitcoin(to: string, satAmount: number) {
    const result = await this.bitcoinNetworkProvider.sendBitcoin(
      to,
      Number(parseUnits(satAmount.toString(), 8))
    )
    return result
  }

  on = (eventName: string, callBack: () => void) => {
    return this.bitcoinNetworkProvider.on(eventName, callBack)
  }

  off = (eventName: string, callBack: () => void) => {
    return this.bitcoinNetworkProvider.off(eventName, callBack)
  }

  getBalance = async (): Promise<number> => {
    const result = await this.bitcoinNetworkProvider.getBalance()
    return result.total
  }

  pushTx = async (txHex: string): Promise<string> => {
    return await this.bitcoinNetworkProvider.pushTx(txHex)
  }
  async getInscriptions(
    cursor?: number,
    size?: number
  ): Promise<InscriptionResult> {
    return await this.bitcoinNetworkProvider.getInscriptions(cursor, size)
  }
}

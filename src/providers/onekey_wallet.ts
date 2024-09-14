import {
  Inscription,
  InscriptionResult,
  Network,
  WalletInfo,
  WalletProvider
} from '../wallet_provider'
import { parseUnits } from '../utils/parseUnits'

export const oneKeyProvider = '$onekey'

// Internal network names
const INTERNAL_NETWORK_NAMES = {
  [Network.MAINNET]: 'livenet',
  [Network.TESTNET]: 'testnet',
  [Network.SIGNET]: 'signet'
}

export class OneKeyWallet extends WalletProvider {
  private oneKeyWalletInfo: WalletInfo | undefined
  private oneKeyWallet: any
  private bitcoinNetworkProvider: any
  private networkEnv: Network | undefined

  constructor() {
    super()

    // check whether there is an OneKey extension
    if (!window[oneKeyProvider]?.btcwallet) {
      throw new Error('OneKey Wallet extension not found')
    }

    this.oneKeyWallet = window[oneKeyProvider]

    // OneKey provider stays the same for all networks
    this.bitcoinNetworkProvider = this.oneKeyWallet.btcwallet
  }

  async connectWallet(): Promise<this> {
    const self = await this.bitcoinNetworkProvider.connectWallet()
    const address = await this.bitcoinNetworkProvider.getAddress()
    const publicKeyHex = await this.bitcoinNetworkProvider.getPublicKeyHex()
    this.oneKeyWalletInfo = {
      address,
      publicKeyHex
    }
    return self
  }

  async getWalletProviderName(): Promise<string> {
    return this.bitcoinNetworkProvider.getWalletProviderName()
  }

  async getAddress(): Promise<string> {
    return this.bitcoinNetworkProvider.getAddress()
  }

  async getPublicKeyHex(): Promise<string> {
    if (!this.oneKeyWalletInfo) {
      return this.bitcoinNetworkProvider.getPublicKeyHex()
    }
    return this.oneKeyWalletInfo.publicKeyHex
  }

  async signPsbt(psbtHex: string): Promise<string> {
    return this.bitcoinNetworkProvider.signPsbt(psbtHex)
  }

  async signPsbts(psbtsHexes: string[]): Promise<string[]> {
    return this.bitcoinNetworkProvider.signPsbts(psbtsHexes)
  }

  async getNetwork(): Promise<Network> {
    const internalNetwork = await this.bitcoinNetworkProvider.getNetwork()

    for (const [key, value] of Object.entries(INTERNAL_NETWORK_NAMES)) {
      if (value === 'testnet') {
        return Network.SIGNET
      }
      // in case of testnet return signet
      else if (value === internalNetwork) {
        return key as Network
      }
    }

    throw new Error('Unsupported network')
  }

  async signMessageBIP322(message: string): Promise<string> {
    return this.bitcoinNetworkProvider.signMessageBIP322(message)
  }

  on = (eventName: string, callBack: () => void) => {
    return this.bitcoinNetworkProvider.on(eventName, callBack)
  }

  off = (eventName: string, callBack: () => void) => {
    return this.bitcoinNetworkProvider.off(eventName, callBack)
  }

  getBalance = async (): Promise<number> => {
    const network = await this.getNetwork()
    if (network === Network.MAINNET) {
      return await this.bitcoinNetworkProvider.getBalance()
    }
    return await super.getBalance()
  }

  pushTx = async (txHex: string): Promise<string> => {
    return await this.bitcoinNetworkProvider.pushTx(txHex)
  }

  async switchNetwork(network: Network) {
    return await this.bitcoinNetworkProvider.switchNetwork(
      INTERNAL_NETWORK_NAMES[network]
    )
  }

  async sendBitcoin(to: string, satAmount: number) {
    const result = await this.bitcoinNetworkProvider.sendBitcoin(
      to,
      Number(parseUnits(satAmount.toString(), 8))
    )
    return result
  }
  getInscriptions(cursor?: number, size?: number): Promise<InscriptionResult> {
    throw new Error('Method not implemented.')
  }
}

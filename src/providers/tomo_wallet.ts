import {
  Inscription,
  InscriptionResult,
  Network,
  WalletInfo,
  WalletProvider
} from '../wallet_provider'
import { parseUnits } from '../utils/parseUnits'

export const tomoProvider = 'tomo_btc'

export class TomoWallet extends WalletProvider {
  private tomoWalletInfo: WalletInfo | undefined
  private bitcoinNetworkProvider: any
  private networkEnv: Network | undefined

  constructor() {
    super()

    // check whether there is Tomo extension
    if (!window[tomoProvider]) {
      throw new Error('Tomo Wallet extension not found')
    }

    this.bitcoinNetworkProvider = window[tomoProvider]
  }

  connectWallet = async (): Promise<this> => {
    const workingVersion = '1.2.0'
    if (!this.bitcoinNetworkProvider) {
      throw new Error('Tomo Wallet extension not found')
    }
    if (this.bitcoinNetworkProvider.getVersion) {
      const version = await this.bitcoinNetworkProvider.getVersion()
      if (version < workingVersion) {
        throw new Error('Please update Tomo Wallet to the latest version')
      }
    }

    let addresses = null
    let pubKey = null
    try {
      // this will not throw an error even if user has no BTC Signet enabled
      addresses = await this.bitcoinNetworkProvider.connectWallet()
      pubKey = await this.bitcoinNetworkProvider.getPublicKey()
      if (!addresses || addresses.length === 0 || !pubKey) {
        throw new Error('BTC is not enabled in Tomo Wallet')
      }
    } catch (error) {
      throw new Error('BTC is not enabled in Tomo Wallet')
    }

    this.tomoWalletInfo = {
      publicKeyHex: pubKey,
      address: addresses[0]
    }
    return this
  }

  getWalletProviderName = async (): Promise<string> => {
    return 'Tomo'
  }

  getAddress = async (): Promise<string> => {
    return (await this.bitcoinNetworkProvider.getAccounts())[0]
  }

  getPublicKeyHex = async (): Promise<string> => {
    if (!this.tomoWalletInfo) {
      throw new Error('Tomo Wallet not connected')
    }
    return this.tomoWalletInfo.publicKeyHex
  }

  signPsbt = async (psbtHex: string): Promise<string> => {
    if (!this.tomoWalletInfo) {
      throw new Error('Tomo Wallet not connected')
    }
    // sign the PSBT
    return await this.bitcoinNetworkProvider.signPsbt(psbtHex)
  }

  signPsbts = async (psbtsHexes: string[]): Promise<string[]> => {
    if (!this.tomoWalletInfo) {
      throw new Error('Tomo Wallet not connected')
    }

    // sign the PSBTs
    return await this.bitcoinNetworkProvider.signPsbts(psbtsHexes)
  }

  signMessageBIP322 = async (message: string): Promise<string> => {
    if (!this.tomoWalletInfo) {
      throw new Error('Tomo Wallet not connected')
    }
    return await this.bitcoinNetworkProvider.signMessage(
      message,
      'bip322-simple'
    )
  }

  getNetwork = async (): Promise<Network> => {
    return await this.bitcoinNetworkProvider.getNetwork()
  }

  on = (eventName: string, callBack: () => void) => {
    return this.bitcoinNetworkProvider.on(eventName, callBack)
  }

  off = (eventName: string, callBack: () => void) => {
    return this.bitcoinNetworkProvider.off(eventName, callBack)
  }

  getBalance = async (): Promise<number> => {
    const result = await this.bitcoinNetworkProvider.getBalance()
    return result
  }

  pushTx = async (txHex: string): Promise<string> => {
    return await this.bitcoinNetworkProvider.pushTx(txHex)
  }

  async switchNetwork(network: Network) {
    return await this.bitcoinNetworkProvider.switchNetwork(network)
  }

  async sendBitcoin(to: string, satAmount: number) {
    const result = await this.bitcoinNetworkProvider.sendBitcoin(
      to,
      Number(parseUnits(satAmount.toString(), 8))
    )
    return result
  }
  async getInscriptions(
    cursor?: number,
    size?: number
  ): Promise<InscriptionResult> {
    throw new Error('Method not implemented.')

    // const result = await this.bitcoinNetworkProvider.getInscriptions(
    //   cursor,
    //   size
    // )
    // return {
    //   list: result.list.reduce((list: Inscription[], item: any) => {
    //     item.inscriptions.forEach((inscription: any) => {
    //       list.push({
    //         ...inscription,
    //         output: null,
    //         inscriptionId: inscription.inscriptionId,
    //         address: item.inscriptionId,
    //         offset: inscription.offset,
    //         outputValue: null,
    //         location: null,
    //         contentType: null,
    //         contentLength: null,
    //         inscriptionNumber: inscription.inscriptionNumber,
    //         timestamp: null,
    //         genesisTransaction: null
    //       })
    //     })
    //     return list
    //   }, [] as Inscription[]),
    //   total: result.list.reduce((count: number, item: any) => {
    //     return count + item.inscriptions.length
    //   }, 0)
    // }
  }
}

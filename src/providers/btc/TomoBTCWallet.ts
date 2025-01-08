/* eslint-disable @typescript-eslint/ban-ts-comment */
import { BTCProvider } from './BTCProvider'
import { getWindow, ProviderOption } from '../../WalletProvider'
import tomoIcon from '../../icons/tomo.png'
import { TomoWallet } from '../../types'

export const tomoProvider = 'tomo_btc'

export class TomoBTCWallet extends BTCProvider {
  constructor(option: ProviderOption) {
    // @ts-ignore
    const bitcoinNetworkProvider = getWindow(option)[tomoProvider]
    // check whether there is Tomo extension
    if (!bitcoinNetworkProvider) {
      throw new Error('Tomo Wallet extension not found')
    }
    super(option, bitcoinNetworkProvider)
  }

  connectWallet = async (): Promise<this> => {
    const workingVersion = '1.2.0'
    if (!this.bitcoinNetworkProvider) {
      throw new Error('Tomo Wallet extension not found')
    }
    // @ts-ignore
    if (this.bitcoinNetworkProvider.getVersion) {
      // @ts-ignore
      const version = await this.bitcoinNetworkProvider.getVersion()
      if (version < workingVersion) {
        throw new Error('Please update Tomo Wallet to the latest version')
      }
    }

    let addresses = null
    let pubKey = null
    try {
      // this will not throw an error even if user has no BTC Signet enabled
      // @ts-ignore
      addresses = await this.bitcoinNetworkProvider.connectWallet()
      pubKey = await this.bitcoinNetworkProvider.getPublicKey()
      if (!addresses || addresses.length === 0 || !pubKey) {
        throw new Error('BTC is not enabled in Tomo Wallet')
      }
    } catch (error) {
      throw new Error('BTC is not enabled in Tomo Wallet')
    }

    return this
  }

  getBalance = async (): Promise<number> => {
    // @ts-ignore
    const result = await this.bitcoinNetworkProvider.getBalance()
    return result
  }

  pushTx = async (txHex: string): Promise<string> => {
    // @ts-ignore
    return await this.bitcoinNetworkProvider.pushTx(txHex)
  }

  getWalletProviderName(): Promise<string> {
    return Promise.resolve(tomoBTCWalletOption.name)
  }
  getWalletProviderIcon(): Promise<string> {
    return Promise.resolve(tomoBTCWalletOption.img)
  }
}

export const tomoBTCWalletOption = {
  id: 'bitcoin_tomo',
  img: tomoIcon,
  name: 'Tomo',
  chainType: 'bitcoin',
  connectProvider: TomoBTCWallet,
  type: 'extension'
} as TomoWallet

import { BTCProvider } from './BTCProvider'
import { getWindow, Network, ProviderOption } from '../../WalletProvider'
import KeplrIcon from '../../icons/keplr_wallet.png'
import { TomoWallet } from '../../types'

export const KeplrBitcoinWalletProvider = 'bitcoin_keplr'

export class KeplrBTCWallet extends BTCProvider {
  constructor(option: ProviderOption) {
    // @ts-ignore
    const bitcoinNetworkProvider = getWindow(option)?.[KeplrBitcoinWalletProvider];

    if (!bitcoinNetworkProvider) {
      throw new Error('Keplr Wallet extension not found')
    }
    super(option, bitcoinNetworkProvider)
  }

  connectWallet = async (): Promise<this> => {
    if (!this.bitcoinNetworkProvider) {
      throw new Error('Keplr Wallet extension not found')
    }

    let addresses = null
    let pubKey = null
    try {
      // this will not throw an error even if user has no BTC Signet enabled
      // @ts-ignore
      addresses = await this.bitcoinNetworkProvider.connectWallet()
      pubKey = await this.bitcoinNetworkProvider.getPublicKey()
      if (!addresses || addresses.length === 0 || !pubKey) {
        throw new Error('BTC is not enabled in Keplr Wallet')
      }
    } catch (error) {
      throw new Error('BTC is not enabled in Keplr Wallet')
    }

    return this
  }


  async switchNetwork(network: Network) {
    return await this.bitcoinNetworkProvider.switchNetwork(
      network.replace('mainnet', 'livenet') as Network
    )
  }

   async getNetwork(): Promise<Network> {
    const result = (await this.bitcoinNetworkProvider.getNetwork()).replace('livenet', 'mainnet') as Network;
    return result
  }

  getBalance = async (): Promise<number> => {
    // @ts-ignore
    const result = await this.bitcoinNetworkProvider.getBalance()
    // @ts-ignore
    return result.confirmed
  }

  pushTx = async (txHex: string): Promise<string> => {
    // @ts-ignore
    return await this.bitcoinNetworkProvider.pushTx(txHex)
  }

  getWalletProviderName(): Promise<string> {
    return Promise.resolve(keplrBTCWalletOption.name)
  }
  getWalletProviderIcon(): Promise<string> {
    return Promise.resolve(keplrBTCWalletOption.img)
  }
}

export const keplrBTCWalletOption = {
  id: 'bitcoin_keplr',
  img: KeplrIcon,
  name: 'Keplr',
  chainType: 'bitcoin',
  connectProvider: KeplrBTCWallet,
  type: 'extension'
} as TomoWallet

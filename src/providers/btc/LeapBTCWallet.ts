import { ProviderOption } from '../../WalletProvider'
import { BTCProvider } from './BTCProvider'
import leapIcon from '../../icons/leap.jpg'
import { TomoWallet } from '../../types'

export const LEAP_BTC_WALLET_PROVIDER = 'leapBitcoin'

export class LeapBTCWallet extends BTCProvider {
  constructor(option: ProviderOption) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const bitcoinNetworkProvider = window[LEAP_BTC_WALLET_PROVIDER]

    if (!bitcoinNetworkProvider) {
      throw new Error('Leap Wallet extension not found')
    }

    super(option, bitcoinNetworkProvider)
  }

  connectWallet = async (): Promise<this> => {
    const accounts = await this.bitcoinNetworkProvider.requestAccounts()
    const address = accounts[0]
    const publicKeyHex = await this.getPublicKeyHex()

    if (!address || !publicKeyHex) {
      throw new Error('Could not connect to Leap Wallet')
    }

    return this
  }

  getWalletProviderIcon(): Promise<string> {
    return Promise.resolve(leapBtcWalletOptions.img)
  }

  getWalletProviderName(): Promise<string> {
    return Promise.resolve(leapBtcWalletOptions.name)
  }
}

export const leapBtcWalletOptions = {
  id: 'bitcoin_leap',
  img: leapIcon,
  name: 'Leap',
  chainType: 'bitcoin',
  connectProvider: LeapBTCWallet,
  type: 'extension'
} as TomoWallet

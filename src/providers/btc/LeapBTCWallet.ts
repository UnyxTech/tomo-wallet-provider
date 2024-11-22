import { TomoChain } from '../../WalletProvider'
import { BTCProvider } from './BTCProvider'

export const LEAP_BTC_WALLET_PROVIDER = 'leapBitcoin'

export class LeapBTCWallet extends BTCProvider {
  constructor(chains: TomoChain[]) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const bitcoinNetworkProvider = window[LEAP_BTC_WALLET_PROVIDER]

    if (!bitcoinNetworkProvider) {
      throw new Error('Leap Wallet extension not found')
    }

    super(chains, bitcoinNetworkProvider)
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
}

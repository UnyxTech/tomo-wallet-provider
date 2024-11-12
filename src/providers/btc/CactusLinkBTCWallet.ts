import { TomoChain } from '../../WalletProvider'
import { BTCProvider } from './BTCProvider'

export class CactusLinkBTCWallet extends BTCProvider {
  constructor(chains: TomoChain[]) {
    // @ts-ignore
    const bitcoinNetworkProvider = window.cactuslink
    if (!bitcoinNetworkProvider) {
      throw new Error('Cactus Link Wallet extension not found')
    }
    super(chains, bitcoinNetworkProvider)
  }

  async connectWallet(): Promise<this> {
    const walletNetwork = await this.getNetwork()
    try {
      await this.bitcoinNetworkProvider.requestAccounts() // Connect to Cactus Link Wallet extension
    } catch (error) {
      if ((error as Error)?.message?.includes('rejected')) {
        throw new Error('Connection to Cactus Link Wallet was rejected')
      } else {
        throw new Error((error as Error)?.message)
      }
    }
    const address = await this.getAddress()
    const publicKeyHex = await this.getPublicKeyHex()

    if (!address || !publicKeyHex) {
      throw new Error('Could not connect to Cactus Link Wallet')
    }

    return this
  }

  signPsbt = async (psbtHex: string): Promise<string> => {
    // @ts-ignore
    return await this.bitcoinNetworkProvider.signPsbt(psbtHex, {
      autoFinalized: true
    })
  }

  signPsbts = async (psbtsHexes: string[]): Promise<string[]> => {
    const options = psbtsHexes.map((_) => {
      return {
        autoFinalized: true
      }
    })
    // @ts-ignore
    return await this.bitcoinNetworkProvider.signPsbts(psbtsHexes, options)
  }

  on = (eventName: string, callBack: () => void) => {
    if (eventName === 'accountChanged') {
      return this.bitcoinNetworkProvider?.on?.('accountsChanged', callBack)
    }
    return this.bitcoinNetworkProvider?.on?.(eventName, callBack)
  }

  off = (eventName: string, callBack: () => void) => {
    if (eventName === 'accountChanged') {
      return this.bitcoinNetworkProvider?.off?.('accountsChanged', callBack)
    }
    return this.bitcoinNetworkProvider?.off?.(eventName, callBack)
  }
}

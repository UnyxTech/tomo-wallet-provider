import { getWindow, ProviderOption } from '../../WalletProvider'
import { BTCProvider, SignPsbtOptions } from './BTCProvider'
import { TomoWallet } from '../../types'
import cactuslinkIcon from '../../icons/cactuslink.svg'

export class CactusLinkBTCWallet extends BTCProvider {
  constructor(option: ProviderOption) {
    // @ts-ignore
    const bitcoinNetworkProvider = getWindow(option).cactuslink
    if (!bitcoinNetworkProvider) {
      throw new Error('Cactus Link Wallet extension not found')
    }
    super(option, bitcoinNetworkProvider)
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

  signPsbt = async (
    psbtHex: string,
    options?: SignPsbtOptions
  ): Promise<string> => {
    // @ts-ignore
    return await this.bitcoinNetworkProvider.signPsbt(
      psbtHex,
      options || {
        autoFinalized: true
      }
    )
  }

  signPsbts = async (
    psbtsHexes: string[],
    options?: SignPsbtOptions[]
  ): Promise<string[]> => {
    const curOptions =
      options ||
      psbtsHexes.map((_) => {
        return {
          autoFinalized: true
        }
      })
    // @ts-ignore
    return await this.bitcoinNetworkProvider.signPsbts(psbtsHexes, curOptions)
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

  getWalletProviderName(): Promise<string> {
    return Promise.resolve(cactusLinkBTCWalletOption.name)
  }
  getWalletProviderIcon(): Promise<string> {
    return Promise.resolve(cactusLinkBTCWalletOption.img)
  }
}

export const cactusLinkBTCWalletOption = {
  id: 'bitcoin_cactuslink',
  img: cactuslinkIcon,
  name: 'Cactus Link',
  chainType: 'bitcoin',
  connectProvider: CactusLinkBTCWallet,
  type: 'extension'
} as TomoWallet

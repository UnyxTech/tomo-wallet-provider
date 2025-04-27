import { CosmosProvider } from './CosmosProvider'
import { getWindow, ProviderOption } from '../../WalletProvider'
import { TomoWallet } from '../../types'
import cactuslinkIcon from '../../icons/cactuslink.svg'

export class CactusLinkosmosWallet extends CosmosProvider {
  constructor(option: ProviderOption) {
    // @ts-ignore
    const provider = getWindow(option).cactuslink_cosmos
    if (!provider) {
      throw new Error('CactusLink Wallet extension not found')
    }
    super(option, provider)
  }
  getWalletProviderName(): Promise<string> {
    return Promise.resolve(cactusLinkCosmosWalletOption.name)
  }
  getWalletProviderIcon(): Promise<string> {
    return Promise.resolve(cactusLinkCosmosWalletOption.img)
  }
  // on(eventName: string, callBack: () => void) {
  //   if (eventName === 'accountChanged') {
  //     window.addEventListener('cactuslink_keystorechange', callBack)
  //   }
  // }
  // off(eventName: string, callBack: () => void) {
  //   if (eventName === 'accountChanged') {
  //     window.removeEventListener('cactuslink_keystorechange', callBack)
  //   }
  // }
}

export const cactusLinkCosmosWalletOption = {
  id: 'cosmos_cactuslink',
  img: cactuslinkIcon,
  name: 'Cactus Link',
  chainType: 'cosmos',
  connectProvider: CactusLinkosmosWallet,
  type: 'extension'
} as TomoWallet

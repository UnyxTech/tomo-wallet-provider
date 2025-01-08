import { CosmosProvider } from './CosmosProvider'
import { getWindow, ProviderOption } from '../../WalletProvider'
import { TomoWallet } from '../../types'
import onekeyIcon from '../../icons/onekey.svg'

export class OneKeyCosmosWallet extends CosmosProvider {
  constructor(option: ProviderOption) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const provider = getWindow(option).$onekey?.cosmos
    if (!provider) {
      throw new Error('OneKey Wallet extension not found')
    }
    super(option, provider)
  }
  getWalletProviderName(): Promise<string> {
    return Promise.resolve(oneKeyCosmosWalletOption.name)
  }
  getWalletProviderIcon(): Promise<string> {
    return Promise.resolve(oneKeyCosmosWalletOption.img)
  }
}

export const oneKeyCosmosWalletOption = {
  id: 'cosmos_onekey',
  img: onekeyIcon,
  name: 'OneKey',
  chainType: 'cosmos',
  connectProvider: OneKeyCosmosWallet,
  type: 'extension'
} as TomoWallet
